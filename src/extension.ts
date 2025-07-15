import * as vscode from 'vscode';
import { SearchCommand } from './commands/searchCommand';

let searchCommand: SearchCommand;

export function activate(context: vscode.ExtensionContext) {
	console.log('CodeScope extension is now active!');

	searchCommand = new SearchCommand();

	const searchDisposable = vscode.commands.registerCommand('codescope.search', async () => {
		try {
			await searchCommand.execute();
		} catch (error) {
			vscode.window.showErrorMessage(`CodeScope search failed: ${error}`);
		}
	});

	const refreshDisposable = vscode.commands.registerCommand('codescope.refresh', async () => {
		try {
			await searchCommand.refreshIndex();
		} catch (error) {
			vscode.window.showErrorMessage(`CodeScope refresh failed: ${error}`);
		}
	});

	context.subscriptions.push(searchDisposable, refreshDisposable);
}

export function deactivate() {
	if (searchCommand) {
		searchCommand.dispose();
	}
}
