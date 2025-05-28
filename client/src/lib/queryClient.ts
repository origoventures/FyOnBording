import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Type for enhanced API request options
export interface ApiRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

/**
 * Enhanced API request function for making fetch requests with better typing
 */
// Utility function to add timeout to fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 15000) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  // Create a promise that rejects in <timeoutMs> milliseconds
  const timeoutPromise = new Promise<Response>((_, reject) => {
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    // Clean up timeout if the fetch completes in time
    signal.addEventListener('abort', () => clearTimeout(timeoutId));
  });
  
  // Return a race between timeout and fetch
  return Promise.race([
    fetch(url, { ...options, signal }),
    timeoutPromise
  ]);
};

// Function to get the current user's ID for authenticated requests
const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

export async function apiRequest<T = any>(
  urlOrOptions: string | ApiRequestOptions,
  options?: RequestInit,
  timeoutMs = 15000
): Promise<T> {
  // Handle the new options format
  if (typeof urlOrOptions === 'object') {
    const { url, method = 'GET', data, params, headers = {} } = urlOrOptions;
    
    // Build query string for params
    let requestUrl = url;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        requestUrl += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    
    // Get current user ID for authenticated requests
    const userId = getCurrentUserId();
    
    // Set up request options
    const requestOptions: RequestInit = {
      method,
      credentials: "include",
      headers: {
        ...(method !== 'GET' && data ? { "Content-Type": "application/json" } : {}),
        ...(userId ? { "user-id": userId } : {}), // Add user-id header for authenticated requests
        ...headers,
      },
    };
    
    // Add the request body for non-GET requests
    if (method !== 'GET' && data) {
      requestOptions.body = JSON.stringify(data);
    }
    
    // Use fetchWithTimeout instead of fetch
    const res = await fetchWithTimeout(requestUrl, requestOptions, timeoutMs);
    await throwIfResNotOk(res);
    
    // Parse the response based on content type
    if (res.headers.get("content-type")?.includes("application/json")) {
      return res.json();
    }
    
    return res as unknown as T;
  }
  
  // Original implementation for backward compatibility
  const userId = getCurrentUserId();
  
  const res = await fetch(urlOrOptions as string, {
    credentials: "include",
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(userId ? { "user-id": userId } : {}), // Add user-id header for authenticated requests
      ...options?.headers,
    },
  });

  await throwIfResNotOk(res);
  
  // Only try to parse JSON if we're expecting a type other than Response
  if (res.headers.get("content-type")?.includes("application/json")) {
    return res.json();
  }
  
  return res as unknown as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const userId = getCurrentUserId();
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        ...(userId ? { "user-id": userId } : {}), // Add user-id header for authenticated requests
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
