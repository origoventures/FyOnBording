import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertCircle, CheckCircle, XCircle, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getGoogleTokens, isTokenValid, clearGoogleTokens } from "@/lib/token-storage";
import Layout from "@/components/layout";
import GoogleOAuth from "@/components/google-oauth";
import { initializeEnv } from "@/env";

interface ApiStatus {
  name: string;
  active: boolean;
  error?: string;
  loading: boolean;
}

export default function ApiTestPage() {
  const [apiStatus, setApiStatus] = useState<Record<string, ApiStatus>>({
    'oauth2.googleapis.com': { name: 'OAuth 2.0 API', active: false, loading: true },
    'searchconsole.googleapis.com': { name: 'Search Console API', active: false, loading: true },
    'analyticsdata.googleapis.com': { name: 'Analytics Data API', active: false, loading: true }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [testUrl] = useState<string>('https://www.example.com');
  const [testDates] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  useEffect(() => {
    // Initialize environment variables and check authentication
    const initializeAuth = async () => {
      await initializeEnv();
      
      // Check for valid tokens
      const tokens = getGoogleTokens();
      const hasValidTokens = tokens && isTokenValid();
      
      // Update authentication status
      setIsAuthenticated(Boolean(hasValidTokens));
      setIsLoadingAuth(false);
      
      // Load initial OAuth status
      if (hasValidTokens) {
        // If we have tokens, check the OAuth status right away
        checkOAuthStatus();
      }
    };
    
    // Check if this is an admin user (you would need to implement this check)
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    
    if (!isAdmin) {
      // Redirect non-admin users away from this page
      window.location.href = '/';
      return;
    }
    
    initializeAuth();
  }, []);
  
  // Handle successful Google OAuth connection
  const handleConnected = () => {
    setIsAuthenticated(true);
    checkOAuthStatus();
  };
  
  // Handle disconnection
  const handleDisconnected = () => {
    setIsAuthenticated(false);
    setApiStatus({
      'oauth2.googleapis.com': { name: 'OAuth 2.0 API', active: false, loading: false },
      'searchconsole.googleapis.com': { name: 'Search Console API', active: false, loading: false },
      'analyticsdata.googleapis.com': { name: 'Analytics Data API', active: false, loading: false }
    });
  };

  const checkOAuthStatus = async () => {
    try {
      // Update status to loading
      setApiStatus(prev => ({
        ...prev,
        'oauth2.googleapis.com': { ...prev['oauth2.googleapis.com'], loading: true }
      }));

      // Fetch API status from backend
      const response = await apiRequest<Record<string, { active: boolean, error?: string }>>({
        url: '/api/google/status',
        method: 'GET'
      });

      if (response) {
        // Update OAuth status
        setApiStatus(prev => ({
          ...prev,
          'oauth2.googleapis.com': {
            name: 'OAuth 2.0 API',
            active: response['oauth2.googleapis.com']?.active || false,
            error: response['oauth2.googleapis.com']?.error,
            loading: false
          }
        }));
      }
    } catch (error: any) {
      setApiStatus(prev => ({
        ...prev,
        'oauth2.googleapis.com': {
          name: 'OAuth 2.0 API',
          active: false,
          error: error.message || 'Failed to check OAuth status',
          loading: false
        }
      }));
    }
  };

  const testSearchConsoleApi = async () => {
    try {
      // Update status to loading
      setApiStatus(prev => ({
        ...prev,
        'searchconsole.googleapis.com': { ...prev['searchconsole.googleapis.com'], loading: true }
      }));

      const tokens = getGoogleTokens();
      if (!tokens) {
        throw new Error('No tokens available');
      }

      // Create a promise that will reject after a timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API request timed out after 15 seconds')), 15000)
      );

      // Try to fetch data from Search Console API with a timeout
      const apiPromise = apiRequest({
        url: `/api/google/search-console?url=${encodeURIComponent(testUrl)}&startDate=${testDates.startDate}&endDate=${testDates.endDate}&accessToken=${tokens.accessToken}`,
        method: 'GET'
      });

      // Race the API request against the timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);

      console.log("Search Console API test completed successfully", response);

      setApiStatus(prev => ({
        ...prev,
        'searchconsole.googleapis.com': {
          name: 'Search Console API',
          active: true,
          loading: false
        }
      }));

      return true;
    } catch (error: any) {
      console.error("Search Console API test failed:", error);
      
      setApiStatus(prev => ({
        ...prev,
        'searchconsole.googleapis.com': {
          name: 'Search Console API',
          active: false,
          error: error.message || 'Failed to test Search Console API',
          loading: false
        }
      }));
      return false;
    }
  };

  const testAnalyticsApi = async () => {
    try {
      // Update status to loading
      setApiStatus(prev => ({
        ...prev,
        'analyticsdata.googleapis.com': { ...prev['analyticsdata.googleapis.com'], loading: true }
      }));

      const tokens = getGoogleTokens();
      if (!tokens) {
        throw new Error('No tokens available');
      }

      const propertyId = tokens.ga4PropertyId || '0'; // Use placeholder if none provided

      // Create a promise that will reject after a timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API request timed out after 15 seconds')), 15000)
      );

      // Try to fetch data from GA4 API with a timeout
      const apiPromise = apiRequest({
        url: `/api/google/analytics?url=${encodeURIComponent(testUrl)}&startDate=${testDates.startDate}&endDate=${testDates.endDate}&propertyId=${propertyId}&accessToken=${tokens.accessToken}`,
        method: 'GET'
      });

      // Race the API request against the timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);

      console.log("Analytics API test completed successfully", response);

      setApiStatus(prev => ({
        ...prev,
        'analyticsdata.googleapis.com': {
          name: 'Analytics Data API',
          active: true,
          loading: false
        }
      }));

      return true;
    } catch (error: any) {
      console.error("Analytics API test failed:", error);
      
      setApiStatus(prev => ({
        ...prev,
        'analyticsdata.googleapis.com': {
          name: 'Analytics Data API',
          active: false,
          error: error.message || 'Failed to test Analytics API',
          loading: false
        }
      }));
      return false;
    }
  };

  const runAllTests = async () => {
    if (!isAuthenticated) {
      return;
    }

    await checkOAuthStatus();
    await testSearchConsoleApi();
    await testAnalyticsApi();
  };

  return (
    <>
      <div className="container max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Google API Test Page</h1>
        
        {isLoadingAuth ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-8 w-1/3" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-2/3" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : !isAuthenticated ? (
          <>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                You need to authenticate with Google before testing the APIs.
              </AlertDescription>
            </Alert>
            
            <div className="mb-8">
              {/* Pass state and update handler to GoogleOAuth */}
              <GoogleOAuth onConnect={handleConnected} />
            </div>
          </>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Authentication Status</CardTitle>
                <CardDescription>
                  Your current authentication status with Google APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500 h-5 w-5" />
                  <span>Authenticated with Google</span>
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={runAllTests}>
                  Test All APIs
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => {
                    const tokens = getGoogleTokens();
                    if (tokens && tokens.accessToken) {
                      // Call the API to revoke the token
                      apiRequest({
                        url: '/api/google/revoke',
                        method: 'POST',
                        data: { token: tokens.accessToken }
                      }).finally(() => {
                        // Clear tokens from local storage
                        clearGoogleTokens();
                        handleDisconnected();
                      });
                    } else {
                      clearGoogleTokens();
                      handleDisconnected();
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Object.entries(apiStatus).map(([key, api]) => (
                <Card key={key} className={api.active ? "border-green-200" : api.error ? "border-red-200" : "border-gray-200"}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {api.name}
                      {api.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : api.active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${api.loading ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${api.active && !api.loading ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${!api.active && !api.loading ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      `}
                    >
                      {api.loading ? 'Testing...' : api.active ? 'Active' : 'Inactive'}
                    </Badge>
                    
                    {api.error && (
                      <p className="text-xs text-red-500 mt-2">
                        {api.error}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={api.loading || !isAuthenticated}
                      onClick={() => {
                        if (key === 'oauth2.googleapis.com') checkOAuthStatus();
                        if (key === 'searchconsole.googleapis.com') testSearchConsoleApi();
                        if (key === 'analyticsdata.googleapis.com') testAnalyticsApi();
                      }}
                    >
                      {api.loading ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test API'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p>This is a diagnostic page for testing Google API connectivity. It is only accessible via direct URL.</p>
          <p className="mt-1">Test URL: {testUrl}</p>
          <p className="mt-1">Date Range: {testDates.startDate} to {testDates.endDate}</p>
        </div>
      </div>
    </>
  );
}