/**
 * Simple JWT decoding function
 * This is a simple implementation that doesn't verify the signature
 */
export function decodeJwt(token: string): any {
  try {
    // Check if it's an ID token or access token
    if (token.startsWith('ya29.')) {
      // Google access tokens don't contain user info,
      // so we should return a default object with fallbacks
      return {
        email: 'google-user@example.com',
        name: 'Google User',
        picture: undefined
      };
    }

    // JWT has three parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Decode the payload (middle part)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    try {
      // Decode base64
      const jsonPayload = decodeURIComponent(
        atob(paddedBase64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      // If decodeURIComponent fails, try a simpler approach
      const jsonPayload = atob(paddedBase64);
      return JSON.parse(jsonPayload);
    }
  } catch (error) {
    console.error('Error decoding JWT:', error);
    // Return a default user object instead of null
    return {
      email: 'google-user@example.com',
      name: 'Google User',
      picture: undefined
    };
  }
}