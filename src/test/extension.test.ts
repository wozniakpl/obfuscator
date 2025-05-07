import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';

suite('Extension Test Suite', () => {
    test('Extension should register commands on activation', async () => {
        const extensionId = 'BartoszWozniakSolutions.obfuscator';
        const ext = vscode.extensions.getExtension(extensionId);
        await ext?.activate();

        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('obfuscate.start'), 'Command "obfuscate.start" not registered');
        assert.ok(commands.includes('obfuscate.configure'), 'Command "obfuscate.configure" not registered');
    });

    test('Configure command should create and open obfuscator.json', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            const uri = vscode.Uri.file(path.resolve(__dirname, '../../'));
            await vscode.workspace.updateWorkspaceFolders(0, 0, { uri });
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        assert.ok(workspaceFolder, 'No workspace folder found.');

        const configPath = path.join(workspaceFolder, '.vscode', 'obfuscator.json');

        // Ensure the file does not exist before the test
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }

        // Execute the configure command
        await vscode.commands.executeCommand('obfuscate.configure');

        // Check if the file was created
        assert.ok(fs.existsSync(configPath), 'obfuscator.json was not created.');

        // Check if the file was opened in the editor
        const openEditors = vscode.window.visibleTextEditors;
        const isFileOpened = openEditors.some(editor => editor.document.uri.fsPath === configPath);
        assert.ok(isFileOpened, 'obfuscator.json was not opened in the editor.');
    });

    test('Obfuscate command should create and open obfuscator.json with dummy content if it does not exist', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            const uri = vscode.Uri.file(path.resolve(__dirname, '../../'));
            await vscode.workspace.updateWorkspaceFolders(0, 0, { uri });
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        assert.ok(workspaceFolder, 'No workspace folder found.');

        const configPath = path.join(workspaceFolder, '.vscode', 'obfuscator.json');

        // Ensure the file does not exist before the test
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }

        // Execute the obfuscate command
        await vscode.commands.executeCommand('obfuscate.start');

        // Check if the file was created
        assert.ok(fs.existsSync(configPath), 'obfuscator.json was not created.');

        // Check the content of the created file
        const configContent = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        assert.ok('caseSensitive' in configContent, 'The field "caseSensitive" does not exist in obfuscator.json.');
        assert.ok('rules' in configContent, 'The field "rules" does not exist in obfuscator.json.');

        // Check if the file was opened in the editor
        const openEditors = vscode.window.visibleTextEditors;
        const isFileOpened = openEditors.some(editor => editor.document.uri.fsPath === configPath);
        assert.ok(isFileOpened, 'obfuscator.json was not opened in the editor.');
    });

    test('Obfuscate command should fail if no text is highlighted', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            const uri = vscode.Uri.file(path.resolve(__dirname, '../../'));
            await vscode.workspace.updateWorkspaceFolders(0, 0, { uri });
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        assert.ok(workspaceFolder, 'No workspace folder found.');

        // Open a new untitled document
        const document = await vscode.workspace.openTextDocument({ content: 'Sample text for testing' });
        await vscode.window.showTextDocument(document);

        // Ensure no text is selected
        const editor = vscode.window.activeTextEditor;
        assert.ok(editor, 'No active editor found.');
        editor.selection = new vscode.Selection(editor.selection.start, editor.selection.start);

        // Spy on the showErrorMessage method
        const showErrorMessageSpy = sinon.spy(vscode.window, 'showErrorMessage');

        // Execute the obfuscate command
        await vscode.commands.executeCommand('obfuscate.start');

        // Check if the error message was shown
        assert.ok(showErrorMessageSpy.calledWith('No text selected. Please select text to obfuscate.'), 'Expected error message was not shown.');

        // Restore the spy
        showErrorMessageSpy.restore();
    });
});
