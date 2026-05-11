import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';

export interface ValeriusConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

const CONFIG_DIR = join(homedir(), '.valerius');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export function loadConfig(): Partial<ValeriusConfig> {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as Partial<ValeriusConfig>;
  } catch {
    return {};
  }
}

export function saveConfig(config: Partial<ValeriusConfig>): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  const existing = loadConfig();
  writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...config }, null, 2), 'utf-8');
}

export function clearConfig(): void {
  if (existsSync(CONFIG_PATH)) {
    unlinkSync(CONFIG_PATH);
  }
}
