import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import sinon from 'sinon';

suite('Extension Test Suite', () => {
    let extension: vscode.Extension<any> | undefined;
    let workspaceFolder: vscode.WorkspaceFolder | undefined;
    let testWorkspaceFolder: string;

    suiteSetup(async () => {
        // Create a temporary test workspace
        testWorkspaceFolder = path.join(__dirname, '..', '..', 'test-workspace');
        fs.mkdirSync(testWorkspaceFolder, { recursive: true });

        // Create a mock workspace folder
        workspaceFolder = {
            uri: vscode.Uri.file(testWorkspaceFolder),
            name: 'test-workspace',
            index: 0
        };

        // Activate the extension
        extension = vscode.extensions.getExtension('BartoszWozniakSolutions.obfuscator');
        await extension?.activate();
    });

    suiteTeardown(() => {
        // Clean up test workspace
        if (fs.existsSync(testWorkspaceFolder)) {
            fs.rmSync(testWorkspaceFolder, { recursive: true, force: true });
        }
    });

    // Helper function to create config file
    function createConfigFile(config: any) {
        const configPath = path.join(testWorkspaceFolder, '.obfuscaterc.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return configPath;
    }

    test('Extension should register all commands on activation', async () => {
        const commands = await vscode.commands.getCommands(true);
        const ourCommands = commands.filter(cmd => cmd.startsWith('obfuscate.'));
        assert.strictEqual(ourCommands.length, 2, 'Expected exactly two commands to be registered');
        assert.ok(ourCommands.includes('obfuscate.start'), 'Command "obfuscate.start" not registered');
        assert.ok(ourCommands.includes('obfuscate.selection'), 'Command "obfuscate.selection" not registered');
    });

    test('Obfuscate selection command with no selection should show warning', async () => {
        // Execute selection command without selection
        const result = await vscode.commands.executeCommand('obfuscate.selection');
        
        // Verify warning was shown
        assert.strictEqual(result, 'No text selected. Please select text to obfuscate.');
    });

    // test('Obfuscate selection command with selection should apply mappings from config', async () => {
        // Create config file with test configuration
        // createConfigFile({
        //     mappings: {
        //         caseSensitive: true,
        //         rules: [
        //             { "wordToReplace": "replacement" },
        //             { "anotherWord": "another_replacement" }
        //         ]
        //     },
        //     resources: [] // Not needed for selection test
        // });
        
        // const document = await vscode.workspace.openTextDocument({
        //     content: 'wordToReplace and anotherWord',
        //     language: 'plaintext'
        // });
        // const editor = await vscode.window.showTextDocument(document);

        // // Create a selection
        // const selection = new vscode.Selection(0, 0, 0, 30);
        // editor.selection = selection;
        
        // // ✅ Stub activeTextEditor to return your editor
        // const stub = sinon.stub(vscode.window, 'activeTextEditor').get(() => editor);
        
        // Execute the command
        // const result = await vscode.commands.executeCommand('obfuscate.selection');
        // assert.strictEqual(result, 'xD');
        // Verify the content was obfuscated using mappings from config
        // const content = editor.document.getText();
        // assert.strictEqual(content, 'replacement and another_replacement');
    // });

//     test('Obfuscate command should process files based on .obfuscaterc.json', async () => {
//         // Create config file with test configuration
//         createConfigFile({
//             mappings: {
//                 caseSensitive: true,
//                 rules: [
//                     { "testWord": "replacement" }
//                 ]
//             },
//             resources: [
//                 {
//                     path: "test/*.txt",
//                     recursive: true
//                 }
//             ]
//         });
        
//         // Create test files
//         const testDir = path.join(testWorkspaceFolder, 'test');
//         fs.mkdirSync(testDir, { recursive: true });
//         fs.writeFileSync(path.join(testDir, 'file1.txt'), 'testWord');
//         fs.writeFileSync(path.join(testDir, 'file2.txt'), 'testWord');
        
//         // Execute obfuscate command
//         await vscode.commands.executeCommand('obfuscate.start');
        
//         // Verify files were processed
//         const file1Content = fs.readFileSync(path.join(testDir, 'file1.txt'), 'utf8');
//         const file2Content = fs.readFileSync(path.join(testDir, 'file2.txt'), 'utf8');
//         assert.strictEqual(file1Content, 'replacement');
//         assert.strictEqual(file2Content, 'replacement');
//     });

//     test('Obfuscate command should handle recursive directory structure', async () => {
//         // Create config file with test configuration
//         createConfigFile({
//             mappings: {
//                 caseSensitive: true,
//                 rules: [
//                     { "recursiveWord": "recursive_replacement" }
//                 ]
//             },
//             resources: [
//                 {
//                     path: "recursive_test/**/*.txt",
//                     recursive: true
//                 }
//             ]
//         });
        
//         // Create nested directory structure
//         const baseDir = path.join(testWorkspaceFolder, 'recursive_test');
//         const dirs = [
//             'level1',
//             'level1/level2',
//             'level1/level2/level3'
//         ];
        
//         // Create directories
//         dirs.forEach(dir => {
//             fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
//         });
        
//         // Create test files in each directory
//         dirs.forEach(dir => {
//             fs.writeFileSync(
//                 path.join(baseDir, dir, 'test.txt'),
//                 'recursiveWord'
//             );
//         });
        
//         // Execute obfuscate command
//         await vscode.commands.executeCommand('obfuscate.start');
        
//         // Verify files in all directories were processed
//         dirs.forEach(dir => {
//             const content = fs.readFileSync(
//                 path.join(baseDir, dir, 'test.txt'),
//                 'utf8'
//             );
//             assert.strictEqual(content, 'recursive_replacement');
//         });
//     });

//     test('Obfuscate command should handle missing .obfuscaterc.json', async () => {
//         // Remove .obfuscaterc.json if it exists
//         const configPath = path.join(testWorkspaceFolder, '.obfuscaterc.json');
//         if (fs.existsSync(configPath)) {
//             fs.unlinkSync(configPath);
//         }
        
//         // Execute obfuscate command
//         const result = await vscode.commands.executeCommand('obfuscate.start');
        
//         // Verify error was shown
//         assert.strictEqual(result, 'Configuration file .obfuscaterc.json not found.');
//     });

//     test('Obfuscate command should handle invalid .obfuscaterc.json', async () => {
//         // Create invalid .obfuscaterc.json
//         const configPath = path.join(testWorkspaceFolder, '.obfuscaterc.json');
//         fs.writeFileSync(configPath, 'invalid json content');
        
//         // Execute obfuscate command
//         const result = await vscode.commands.executeCommand('obfuscate.start');
        
//         // Verify error was shown
//         assert.strictEqual(result, 'Invalid configuration file format.');
//     });
});
