import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('obfuscate.selected', () => processSelection(context)),
        vscode.commands.registerCommand('obfuscate.reset', () => resetPreferences(context)),
        vscode.commands.registerCommand('obfuscate.file', () => processAll(context)),
        vscode.commands.registerCommand('obfuscate.directory', () => processDirectory(context))
    );
}

async function getUserPreferences(context: vscode.ExtensionContext): Promise<{ userInput: string; caseSensitive: string } | undefined> {
    let caseSensitive = context.globalState.get<string>('caseSensitive', '');
    let commandHistory: string[] = context.globalState.get('commandHistory', []);

    if (caseSensitive === '') {
        const caseSensitiveOption = await vscode.window.showQuickPick(['Case Sensitive', 'Case Insensitive'], {
            placeHolder: 'Do you want the search to be case sensitive?',
        });
        if (!caseSensitiveOption) return undefined;
        caseSensitive = caseSensitiveOption === 'Case Insensitive' ? 'false' : 'true';
        await context.globalState.update('caseSensitive', caseSensitive);
    }

    const quickPick = vscode.window.createQuickPick();
    quickPick.items = commandHistory.map(label => ({ label }));
    quickPick.matchOnDetail = true;
    quickPick.placeholder = 'Select a previous command or type a new one';

    const userInput = await new Promise<string | undefined>((resolve) => {
        quickPick.onDidAccept(() => {
            const input = quickPick.selectedItems[0]?.label || quickPick.value;
            resolve(input);
            quickPick.dispose();
        });
        quickPick.show();
    });

    if (!userInput) return undefined;

    // Update command history
    commandHistory = commandHistory.filter(cmd => cmd !== userInput);
    commandHistory.unshift(userInput);
    await context.globalState.update('commandHistory', commandHistory);

    return { userInput, caseSensitive };
}

async function processTextReplacement(
    context: vscode.ExtensionContext,
    getTextAndSelection: (editor: vscode.TextEditor) => { text: string; selection: vscode.Selection }
) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;

    const preferences = await getUserPreferences(context);
    if (!preferences) return;

    const { userInput, caseSensitive } = preferences;
    const { text, selection } = getTextAndSelection(activeEditor);
    await applyReplacements(userInput, text, activeEditor, selection, caseSensitive);
}

async function processAll(context: vscode.ExtensionContext) {
    await processTextReplacement(context, (editor) => {
        const documentText = editor.document.getText();
        const firstPosition = editor.document.positionAt(0);
        const lastPosition = editor.document.positionAt(documentText.length);
        return { text: documentText, selection: new vscode.Selection(firstPosition, lastPosition) };
    });
}

async function processSelection(context: vscode.ExtensionContext) {
    await processTextReplacement(context, (editor) => {
        const selection = editor.selection;
        return { text: editor.document.getText(selection), selection };
    });
}

async function processDirectory(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
    }

    // Collect directory-specific preferences
    const dirPreferences = await getDirectoryPreferences(workspaceFolders[0].uri);
    if (!dirPreferences) {
        vscode.window.showInformationMessage('No directory selected. Canceling operation.');
        return;
    }

    const { selectedPath, recursive, fileExtension } = dirPreferences;

    // Collect shared preferences
    const preferences = await getUserPreferences(context);
    if (!preferences) {
        vscode.window.showErrorMessage('No replacement command provided.');
        return;
    }

    const { userInput, caseSensitive } = preferences;

    // Process all files in the selected directory
    const files = await getFilesInDirectory(selectedPath, fileExtension, recursive);

    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const editor = await vscode.window.showTextDocument(document, { preserveFocus: true, preview: false });
        const text = document.getText();
        const firstPosition = document.positionAt(0);
        const lastPosition = document.positionAt(text.length);
        const selection = new vscode.Selection(firstPosition, lastPosition);

        await applyReplacements(userInput, text, editor, selection, caseSensitive);
        await document.save();
    }

    vscode.window.showInformationMessage(`Processed ${files.length} files in directory: ${path.basename(selectedPath)}.`);
}

async function getDirectoryPreferences(defaultUri: vscode.Uri): Promise<{ selectedPath: string; recursive: boolean; fileExtension: string } | undefined> {
    // Let user choose a directory
    const dirUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Directory to Process',
        defaultUri, // Default to root if no selection
    });

    if (!dirUri || dirUri.length === 0) {
        return undefined;
    }

    const selectedPath = dirUri[0].fsPath;

    // Collect directory-specific preferences
    const recursive = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Process directories recursively?',
    }) === 'Yes';

    const fileExtension = await vscode.window.showInputBox({
        placeHolder: 'Enter file extension (e.g., .ts) or leave blank for all files',
    }) || '';

    return { selectedPath, recursive, fileExtension };
}

async function getFilesInDirectory(dir: string, extension: string, recursive: boolean): Promise<string[]> {
    const files: string[] = [];
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });

    // Common text file extensions
    const textExtensions = [
        '.txt', '.js', '.ts', '.json', '.html', '.css', '.md', 
        '.py', '.java', '.cpp', '.c', '.h', '.xml', '.yml', '.yaml', ''
    ];

    for (const dirent of dirents) {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory() && recursive) {
            files.push(...await getFilesInDirectory(fullPath, extension, recursive));
        } else if (dirent.isFile()) {
            const fileExt = path.extname(fullPath).toLowerCase();
            // Check if the file has a text extension and matches the user-specified extension (if provided)
            if (textExtensions.includes(fileExt) && (!extension || fullPath.endsWith(extension))) {
                files.push(fullPath);
            }
        }
    }
    return files;
}

async function applyReplacements(
    userInput: string,
    text: string,
    editor: vscode.TextEditor,
    selection: vscode.Selection,
    caseSensitive: string
) {
    if (userInput) {
        const replacements = parseReplacements(userInput);
        let newText = text;

        for (const [word, newWord] of Object.entries(replacements)) {
            const regex = new RegExp(word, caseSensitive === 'true' ? 'g' : 'gi');
            newText = newText.replace(regex, newWord);
        }

        await editor.edit((editBuilder) => {
            editBuilder.replace(selection, newText);
        });
    }
}

function parseReplacements(input: string): { [key: string]: string } {
    const pairs = input.split(',').map(s => s.trim());
    const replacements: { [key: string]: string } = {};

    for (const pair of pairs) {
        const [word, newWord] = pair.split(':').map(s => s.trim());
        if (word && newWord) {
            replacements[word] = newWord;
        }
    }
    return replacements;
}

async function resetPreferences(context: vscode.ExtensionContext) {
    await Promise.all([
        context.globalState.update('caseSensitive', ''),
        context.globalState.update('userInput', ''),
        context.globalState.update('commandHistory', []),
    ]);
    vscode.window.showInformationMessage('Obfuscate settings have been reset.');
}

export function deactivate() {}