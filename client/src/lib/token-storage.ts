import CryptoJS from 'crypto-js';
import { decodeJwt } from './jwt-helper';

// Storage keys
const GOOGLE_TOKENS_KEY = 'metamuse_google_tokens';
const ENCRYPTION_KEY = 'metamuse_encryption_key'; // This would ideally be a server-side secure key

// Token storage interface
interface TokenStorage {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  ga4PropertyId?: string;
  scope: string;
  idToken?: string;
}

// Token response from Google OAuth
export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * Encrypt data using AES encryption
 */
function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt data using AES encryption
 */
function decryptData(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Save Google OAuth tokens to encrypted localStorage
 */
export function saveGoogleTokens(tokenResponse: GoogleTokenResponse, ga4PropertyId?: string): void {
  const expiryDate = new Date().getTime() + (tokenResponse.expires_in * 1000);
  
  const tokensToStore: TokenStorage = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || '',
    expiryDate,
    ga4PropertyId,
    scope: tokenResponse.scope,
    idToken: tokenResponse.id_token
  };
  
  const encryptedData = encryptData(JSON.stringify(tokensToStore));
  localStorage.setItem(GOOGLE_TOKENS_KEY, encryptedData);
}

/**
 * Get Google OAuth tokens from encrypted localStorage
 */
export function getGoogleTokens(): TokenStorage | null {
  const encryptedData = localStorage.getItem(GOOGLE_TOKENS_KEY);
  
  if (!encryptedData) {
    return null;
  }
  
  try {
    const decryptedData = decryptData(encryptedData);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Error decrypting tokens:', error);
    return null;
  }
}

/**
 * Check if the current token is valid or needs to be refreshed
 */
export function isTokenValid(): boolean {
  const tokens = getGoogleTokens();
  
  if (!tokens) {
    return false;
  }
  
  // Check if token has expired
  const currentTime = new Date().getTime();
  return tokens.expiryDate > currentTime;
}

/**
 * Update stored access token after refresh
 */
export function updateAccessToken(newTokenResponse: GoogleTokenResponse): void {
  const tokens = getGoogleTokens();
  
  if (!tokens) {
    throw new Error('No tokens found to update');
  }
  
  const expiryDate = new Date().getTime() + (newTokenResponse.expires_in * 1000);
  
  const updatedTokens: TokenStorage = {
    ...tokens,
    accessToken: newTokenResponse.access_token,
    expiryDate
  };
  
  const encryptedData = encryptData(JSON.stringify(updatedTokens));
  localStorage.setItem(GOOGLE_TOKENS_KEY, encryptedData);
}

/**
 * Clear stored Google tokens
 */
export function clearGoogleTokens(): void {
  localStorage.removeItem(GOOGLE_TOKENS_KEY);
}

/**
 * Check if user has granted required scopes
 */
export function hasRequiredScopes(requiredScopes: string[]): boolean {
  const tokens = getGoogleTokens();
  
  if (!tokens) {
    return false;
  }
  
  const grantedScopes = tokens.scope.split(' ');
  return requiredScopes.every(scope => grantedScopes.includes(scope));
}

/**
 * Get user info from JWT token
 */
export function getUserInfo(): { email?: string; name?: string; picture?: string } | null {
  const tokens = getGoogleTokens();
  
  if (!tokens) {
    return null;
  }
  
  try {
    // First try to decode the ID token if it exists
    if (tokens.idToken) {
      const decodedIdToken: any = decodeJwt(tokens.idToken);
      return {
        email: decodedIdToken.email,
        name: decodedIdToken.name,
        picture: decodedIdToken.picture
      };
    }
    
    // Fall back to access token if no ID token
    if (tokens.accessToken) {
      const decodedToken: any = decodeJwt(tokens.accessToken);
      return {
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      };
    }
    
    // If we got here, we have tokens but no user info
    return {
      email: 'Connected Google Account',
      name: 'Google User',
      picture: undefined
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    // Return default values instead of null
    return {
      email: 'Connected Google Account',
      name: 'Google User',
      picture: undefined
    };
  }
}