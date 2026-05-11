/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** LLM Provider - Your AI provider */
  "provider": "openai" | "anthropic" | "google" | "xai" | "openrouter" | "local",
  /** API Key - Your API key for the selected provider */
  "apiKey": string,
  /** Model - Model to use (e.g. gpt-4o, claude-opus-4-5, gemini-2.0-flash) */
  "model": string,
  /** Base URL (Local only) - Only needed for local LLMs like Ollama */
  "baseUrl": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `forge` command */
  export type Forge = ExtensionPreferences & {}
  /** Preferences accessible in the `forge-selection` command */
  export type ForgeSelection = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `forge` command */
  export type Forge = {}
  /** Arguments passed to the `forge-selection` command */
  export type ForgeSelection = {}
}

