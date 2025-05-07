# Obfuscator Extension for VS Code

## Overview

Ever wanted to paste some text into an AI program, share a code snippet, or post on a forum, but it contained keywords or sensitive information you'd rather keep private? With the Obfuscator Extension for Visual Studio Code, you can quickly and easily replace words in your text right within your favorite editor.

## Features

- **Case Sensitivity**: Choose whether your search is case sensitive or not.
- **Bulk Replacement**: Replace multiple words at once using a simple, intuitive format.

## Installation

1. Open your Visual Studio Code.
2. Go to the Extensions view by clicking on the square icon on the sidebar.
3. Search for "obfuscator".
4. Click "Install".

## Usage

1. Open the command palette (`Ctrl+Shift+P`) and type "Obfuscate: Configure" and hit Enter.
2. This will open the `obfuscator.json` file located in the `.vscode` directory.
3. Edit the file to define your obfuscation rules. The structure of the file is as follows:

```json
{
    "caseSensitive": false, // Set to true if replacements should be case-sensitive
    "rules": {
        "realOrgName": "organization", // Replace "realOrgName" with "organization"
        "projectName": "project" // Replace "projectName" with "project"
    }
}
```

4. Save the file and highlight the text you wish to obfuscate in your active editor.
5. Open the command palette (`Ctrl+Shift+P`) and type "Obfuscate" and hit Enter.

### Error Handling

- If no text is highlighted, the command will fail with an error message prompting you to select text.
- If the `obfuscator.json` file does not exist, it will be created with default dummy content and opened for editing.

## Development

Use `yarn` and check out the `package.json` file.

## Contributing

See [vsc-extension-quickstart.md](vsc-extension-quickstart.md) for more information on how to get started with this project.

## How to Contribute

We welcome contributions from the community! Feel free to submit issues and pull requests on our GitHub repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.
