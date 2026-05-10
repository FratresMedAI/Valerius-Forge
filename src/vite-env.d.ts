/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CREATOR_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
