import * as vscode from 'vscode';
import { ForgePanel } from './ForgePanel';
import { getApiKey, setApiKey, clearApiKey, getProvider, setProvider, getModel } from './secrets';

const PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic (Claude)', value: 'anthropic' },
  { label: 'Google (Gemini)', value: 'google' },
  { label: 'xAI (Grok)', value: 'xai' },
  { label: 'OpenRouter', value: 'openrouter' },
  { label: 'Local LLM (Ollama / LM Studio)', value: 'local' },
];

let statusBarItem: vscode.StatusBarItem;

export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
  // Status bar
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'valerius.setApiKey';
  ctx.subscriptions.push(statusBarItem);
  await updateStatusBar(ctx);

  // Refresh status bar when secrets change
  ctx.secrets.onDidChange(async (e) => {
    if (e.key === 'valerius.apiKey') await updateStatusBar(ctx);
  }, ctx.subscriptions);

  // Commands
  ctx.subscriptions.push(
    vscode.commands.registerCommand('valerius.forge', () => {
      ForgePanel.createOrShow(ctx);
    }),

    vscode.commands.registerCommand('valerius.forgeSelection', () => {
      const editor = vscode.window.activeTextEditor;
      const selection = editor?.document.getText(editor.selection).trim();
      ForgePanel.createOrShow(ctx, selection || undefined);
    }),

    vscode.commands.registerCommand('valerius.setApiKey', async () => {
      const provider = getProvider(ctx);
      const key = await vscode.window.showInputBox({
        prompt: `Enter your ${provider} API key`,
        password: true,
        placeHolder: 'sk-...',
        ignoreFocusOut: true,
      });
      if (key !== undefined && key.trim()) {
        await setApiKey(ctx, key.trim());
        await updateStatusBar(ctx);
        vscode.window.showInformationMessage('Valerius: API key saved securely.');
      }
    }),

    vscode.commands.registerCommand('valerius.setProvider', async () => {
      const current = getProvider(ctx);
      const items = PROVIDERS.map((p) => ({
        label: p.label,
        description: p.value === current ? '(current)' : '',
        value: p.value,
      }));
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select your LLM provider',
        matchOnDescription: true,
      });
      if (picked) {
        await setProvider(ctx, picked.value);
        vscode.window.showInformationMessage(`Valerius: Provider set to ${picked.label}.`);
      }
    }),

    vscode.commands.registerCommand('valerius.clearApiKey', async () => {
      await clearApiKey(ctx);
      await updateStatusBar(ctx);
      vscode.window.showInformationMessage('Valerius: API key cleared.');
    }),
  );
}

async function updateStatusBar(ctx: vscode.ExtensionContext): Promise<void> {
  const apiKey = await getApiKey(ctx);
  const provider = getProvider(ctx);
  const model = getModel(ctx);

  if (apiKey) {
    statusBarItem.text = `$(zap) Valerius: API Ready`;
    statusBarItem.tooltip = `Provider: ${provider} | Model: ${model}\nClick to update API key`;
    statusBarItem.color = new vscode.ThemeColor('charts.yellow');
  } else {
    statusBarItem.text = `$(zap) Valerius: No Key`;
    statusBarItem.tooltip = `Click to set your API key`;
    statusBarItem.color = new vscode.ThemeColor('disabledForeground');
  }
  statusBarItem.show();
}

export function deactivate(): void {
  // nothing to clean up — subscriptions handle disposal
}
