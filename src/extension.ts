import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as defaultConfig from './defaultConfig.json';

export function activate(context: vscode.ExtensionContext) {
    let obfuscateCommand = vscode.commands.registerCommand('obfuscate.start', async () => {
        processText();
    });
    let configureCommand = vscode.commands.registerCommand('obfuscate.configure', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        const configPath = path.join(workspaceFolder, '.vscode', 'obfuscator.json');
        if (!fs.existsSync(configPath)) {
            fs.mkdirSync(path.dirname(configPath), { recursive: true });
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4));
        }

        const document = await vscode.workspace.openTextDocument(configPath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage('Opened obfuscator.json for configuration.');
    });

    context.subscriptions.push(configureCommand);
    context.subscriptions.push(obfuscateCommand);
}

async function processText() {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
    }

    const configPath = path.join(workspaceFolder, '.vscode', 'obfuscator.json');
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4));
        const document = await vscode.workspace.openTextDocument(configPath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage('Created obfuscator.json. Please edit it to define your obfuscation rules.');
        return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const { caseSensitive, rules } = config;

    if (!rules || typeof rules !== 'object') {
        vscode.window.showErrorMessage('Invalid or missing "rules" in obfuscator.json.');
        return;
    }

    const selection = activeEditor.selection;
    if (selection.isEmpty) {
        vscode.window.showErrorMessage('No text selected. Please select text to obfuscate.');
        return;
    }

    const highlightedText = activeEditor.document.getText(selection);

    let newText = highlightedText;
    for (const [word, newWord] of Object.entries(rules)) {
        const regex = new RegExp(word, caseSensitive ? 'g' : 'gi');
        newText = newText.replace(regex, String(newWord));
    }

    await activeEditor.edit((editBuilder) => {
        editBuilder.replace(selection, newText);
    });

    vscode.window.showInformationMessage('Text obfuscated successfully.');
}

export function deactivate() {}
