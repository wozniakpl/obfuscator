import path = require('path');
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as glob from 'glob';

interface MappingRule {
    [key: string]: string;
}

interface Mappings {
    caseSensitive: boolean;
    rules: MappingRule[];
}

interface Resource {
    path: string;
    recursive?: boolean;
}

interface Config {
    mappings: Mappings;
    resources: Resource[];
}

export function activate(context: vscode.ExtensionContext) {
    console.error("FOO")
    let obfuscateCommand = vscode.commands.registerCommand('obfuscate.start', async () => {
        return obfuscate(context);
    });
    let obfuscateSelectionCommand = vscode.commands.registerCommand('obfuscate.selection', async () => {
        return obfuscateSelection(context);
    });

    context.subscriptions.push(obfuscateCommand);
    context.subscriptions.push(obfuscateSelectionCommand);
}

function getConfig(): Config {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        throw new Error('No workspace folder found');
    }

    const configPath = path.join(workspaceFolder.uri.fsPath, '.obfuscaterc.json');
    if (!fs.existsSync(configPath)) {
        throw new Error('Configuration file .obfuscaterc.json not found.');
    }

    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configContent);
    } catch (error) {
        throw new Error('Invalid configuration file format.');
    }
}

function validateConfig(config: Config) {
    if (!config.mappings || !config.mappings.rules) {
        throw new Error('Invalid configuration: missing mappings or rules');
    }

    if (!Array.isArray(config.mappings.rules)) {
        throw new Error('Invalid configuration: rules must be an array');
    }

    if (!config.resources || !Array.isArray(config.resources)) {
        throw new Error('Invalid configuration: resources must be an array');
    }
}

function obfuscateText(text: string, mappings: Mappings): string {
    let result = text;
    
    mappings.rules.forEach(rule => {
        const [wordToReplace, replacement] = Object.entries(rule)[0];
        const regex = new RegExp(
            wordToReplace,
            mappings.caseSensitive ? 'g' : 'gi'
        );
        result = result.replace(regex, replacement);
    });

    return result;
}

async function obfuscateSelection(context: vscode.ExtensionContext) {
    console.error('DEBUG: obfuscateSelection');
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
        return 'No text selected. Please select text to obfuscate.';
    }

    try {
        const config = getConfig();
        validateConfig(config);

        const text = editor.document.getText(editor.selection);
        const obfuscatedText = obfuscateText(text, config.mappings);

        await editor.edit(editBuilder => {
            editBuilder.replace(editor.selection, obfuscatedText);
        });

        return undefined;
    } catch (error) {
        return error instanceof Error ? error.message : 'An error occurred';
    }
}

// async function obfuscateResources(context: vscode.ExtensionContext, config: Config) {
//     const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
//     if (!workspaceFolder) {
//         throw new Error('No workspace folder found');
//     }

//     for (const resource of config.resources) {
//         const pattern = path.join(workspaceFolder.uri.fsPath, resource.path);
//         const files = glob.sync(pattern, { 
//             ignore: ['**/node_modules/**'],
//             dot: false,
//             nodir: true
//         });

//         for (const file of files) {
//             const content = fs.readFileSync(file, 'utf8');
//             const obfuscatedContent = obfuscateText(content, config.mappings);
//             fs.writeFileSync(file, obfuscatedContent);
//         }
//     }
// }

async function obfuscate(context: vscode.ExtensionContext) {
    return 'xD';
    // try {
    //     const config = getConfig();
    //     validateConfig(config);

    //     const editor = vscode.window.activeTextEditor;
    //     if (editor && !editor.selection.isEmpty) {
    //         return obfuscateSelection(context);
    //     }

    //     await obfuscateResources(context, config);
    //     return undefined;
    // } catch (error) {
    //     return error instanceof Error ? error.message : 'An error occurred';
    // }
}

export function deactivate() {}
