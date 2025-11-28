/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTIMENT_API_URL: string;
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

