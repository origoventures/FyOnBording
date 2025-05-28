// Module declarations for packages without TypeScript definitions

declare module 'stopword' {
  export function removeStopwords(tokens: string[], locale?: string[]): string[];
  export const en: string[];
  export const fr: string[];
  export const de: string[];
  export const es: string[];
  export const it: string[];
  export const pt: string[];
  export const nl: string[];
  export const ja: string[];
  export const ru: string[];
  export const zh: string[];
}

declare module 'crypto-js' {
  export function AES(): any;
  export namespace AES {
    function encrypt(message: string, secretKey: string): any;
    function decrypt(ciphertext: any, secretKey: string): any;
  }
  export namespace enc {
    const Utf8: any;
  }
}

declare module 'jwt-decode' {
  export default function jwtDecode(token: string): any;
}