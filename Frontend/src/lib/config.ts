export const BACKEND_URL: string =
  (import.meta as any).env?.VITE_BACKEND_URL ??
  ((import.meta as any).env?.PROD ? 'https://api.qyra.space' : 'http://localhost:3000');
