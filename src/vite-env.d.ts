/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ZOHO_PARTNER_EMAIL?: string;
  readonly VITE_NORA_CAPITAL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.txt?raw' {
  const content: string;
  export default content;
}

