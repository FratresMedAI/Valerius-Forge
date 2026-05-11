import type { Provider } from './llm.js';

// Curated list of common models per provider. The terminal-native version of
// the dropdown — short, opinionated, current. Users can pass anything; this
// is just a quick reference shown by `valerius models`.
export const COMMON_MODELS: Record<Provider, { recommended: string[]; budget: string[] }> = {
  openai: {
    recommended: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4o', 'o3', 'o3-mini'],
    budget: ['gpt-5-nano', 'gpt-4o-mini', 'gpt-4.1-nano'],
  },
  anthropic: {
    recommended: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-opus-4', 'claude-sonnet-4'],
    budget: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
  },
  google: {
    recommended: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
    budget: ['gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'],
  },
  xai: {
    recommended: ['grok-4', 'grok-4-fast', 'grok-3'],
    budget: ['grok-3-mini'],
  },
  openrouter: {
    recommended: [
      'anthropic/claude-opus-4-5',
      'openai/gpt-5',
      'google/gemini-2.5-pro',
      'x-ai/grok-4',
      'anthropic/claude-sonnet-4-5',
    ],
    budget: ['openai/gpt-5-mini', 'google/gemini-2.5-flash', 'meta-llama/llama-3.3-70b-instruct'],
  },
  local: {
    recommended: ['llama3.3', 'qwen2.5-coder:32b', 'deepseek-r1:32b'],
    budget: ['llama3.2', 'qwen2.5:7b'],
  },
};
