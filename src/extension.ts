import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let obfuscateCommand = vscode.commands.registerCommand('obfuscate.start', async () => {
        processText(context);
    });
    let resetCommand = vscode.commands.registerCommand('obfuscate.selection', async () => {
        // resetPreferences(context);
    });

    context.subscriptions.push(obfuscateCommand);
    context.subscriptions.push(resetCommand);
}

// async function resetPreferences(context: vscode.ExtensionContext) {
//     await context.globalState.update('caseSensitive', '');
//     await context.globalState.update('userInput', '');
//     await context.globalState.update('commandHistory', []);
//     vscode.window.showInformationMessage('Obfuscate settings have been reset.');
// }

async function processText(context: vscode.ExtensionContext) {
    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        let caseSensitive = context.globalState.get<string>('caseSensitive', '');
        let commandHistory: string[] = context.globalState.get('commandHistory', []);

        if (caseSensitive === '') {
            const caseSensitiveOption = await vscode.window.showQuickPick(['Case Sensitive', 'Case Insensitive'], {
                placeHolder: 'Do you want the search to be case sensitive?',
            });

            if (caseSensitiveOption === 'Case Insensitive') {
                caseSensitive = 'false';
            } else {
                caseSensitive = 'true';
            }

            await context.globalState.update('caseSensitive', caseSensitive);
        }

        const selection = activeEditor.selection;
        const highlightedText = activeEditor.document.getText(selection);

        const quickPick = vscode.window.createQuickPick();
        quickPick.items = commandHistory.map(label => ({ label }));
        quickPick.matchOnDetail = true;
        quickPick.placeholder = 'Select a previous command or type a new one';

        quickPick.onDidAccept(async () => {
            const userInput = quickPick.selectedItems.length > 0 ? quickPick.selectedItems[0].label : quickPick.value;
            if (userInput !== undefined) {
                processReplacementsAndHistory(userInput, highlightedText, activeEditor, selection, caseSensitive, context, commandHistory);
            }
            quickPick.dispose();
        });

        quickPick.show();
    }
}


async function processReplacementsAndHistory(userInput: string, highlightedText: string, activeEditor: vscode.TextEditor, selection: vscode.Selection, caseSensitive: string, context: vscode.ExtensionContext, commandHistory: string[]) {
    await context.globalState.update('userInput', userInput);
    commandHistory = commandHistory.filter(cmd => cmd !== userInput);
    commandHistory.unshift(userInput);
    await context.globalState.update('commandHistory', commandHistory);

    if (userInput !== '') {
        const replacements = parseReplacements(userInput);
        let newText = highlightedText;

        for (const [word, newWord] of Object.entries(replacements)) {
            const regex = new RegExp(word, caseSensitive === 'true' ? 'g' : 'gi');
            newText = newText.replace(regex, newWord);
        }

        await activeEditor.edit((editBuilder) => {
            editBuilder.replace(selection, newText);
        });

        processText(context);
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

export function deactivate() {}
