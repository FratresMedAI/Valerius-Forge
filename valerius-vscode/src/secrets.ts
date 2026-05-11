import * as vscode from 'vscode';

export async function getApiKey(ctx: vscode.ExtensionContext): Promise<string | undefined> {
  return ctx.secrets.get('valerius.apiKey');
}
export async function setApiKey(ctx: vscode.ExtensionContext, key: string): Promise<void> {
  await ctx.secrets.store('valerius.apiKey', key);
}
export async function clearApiKey(ctx: vscode.ExtensionContext): Promise<void> {
  await ctx.secrets.delete('valerius.apiKey');
}
export function getProvider(ctx: vscode.ExtensionContext): string {
  return ctx.globalState.get('valerius.provider', 'openai');
}
export async function setProvider(ctx: vscode.ExtensionContext, provider: string): Promise<void> {
  await ctx.globalState.update('valerius.provider', provider);
}
export function getModel(ctx: vscode.ExtensionContext): string {
  return ctx.globalState.get('valerius.model', 'gpt-4o');
}
export async function setModel(ctx: vscode.ExtensionContext, model: string): Promise<void> {
  await ctx.globalState.update('valerius.model', model);
}
