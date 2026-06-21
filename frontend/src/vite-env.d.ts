/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API (e.g. https://parkflow-api.onrender.com) */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
