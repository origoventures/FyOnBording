import { initializeGoogleAuth } from './google-integrations';

/**
 * Initialize Google OAuth services with environment credentials
 * 
 * @param {string} redirectUri - The OAuth redirect URI
 * @returns {boolean} - Whether initialization was successful
 */
export function initGoogleServices(redirectUri: string): boolean {
  try {
    // Get credentials from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Validate that credentials exist
    if (!clientId || !clientSecret) {
      console.warn('Google API credentials not found in environment variables');
      return false;
    }
    
    // Initialize OAuth client
    initializeGoogleAuth({
      clientId,
      clientSecret,
      redirectUri
    });
    
    console.log('Google API services initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Google API services:', error);
    return false;
  }
}