/**
 * Client-side environment variables
 * These values are provided by the server at runtime
 */

// Define types for our environment variables
interface EnvVariables {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  initialized: boolean;
}

// Initialize with empty defaults and initialization flag
let envVariables: EnvVariables = {
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  initialized: false
};

// Function to fetch environment variables from the server
export async function initializeEnv(): Promise<EnvVariables> {
  try {
    if (envVariables.initialized) {
      return envVariables;
    }
    
    const response = await fetch('/api/env');
    if (response.ok) {
      const data = await response.json();
      envVariables = {
        ...envVariables,
        ...data,
        initialized: true
      };
      console.log('Environment variables loaded from server');
    }
    
    return envVariables;
  } catch (error) {
    console.error('Failed to load environment variables:', error);
    return envVariables;
  }
}

// Export the environment variables
export const env = envVariables;