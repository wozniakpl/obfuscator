import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    test('Extension should register commands on activation', async () => {
        const extensionId = 'BartoszWozniakSolutions.obfuscator';
        const ext = vscode.extensions.getExtension(extensionId);
        await ext?.activate();

        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('obfuscate.start'), 'Command "obfuscate.start" not registered');
        assert.ok(commands.includes('obfuscate.reset'), 'Command "obfuscate.reset" not registered');
    });
});
