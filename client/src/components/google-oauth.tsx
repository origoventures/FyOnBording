import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Shield, LogOut, LineChart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getGoogleTokens, saveGoogleTokens, clearGoogleTokens, isTokenValid, updateAccessToken, getUserInfo } from "@/lib/token-storage";
import { env, initializeEnv } from "@/env";

// Form schema
const googleOAuthSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  propertyId: z.string().optional()
});

type GoogleOAuthFormValues = z.infer<typeof googleOAuthSchema>;

interface GoogleOAuthProps {
  onConnect: () => void;
}

export default function GoogleOAuth({ onConnect }: GoogleOAuthProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [envLoaded, setEnvLoaded] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<GoogleOAuthFormValues>({
    resolver: zodResolver(googleOAuthSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
      propertyId: ""
    }
  });
  
  // Load environment variables and update form
  useEffect(() => {
    const loadEnv = async () => {
      const loadedEnv = await initializeEnv();
      
      // Set form values with the loaded environment variables only if available
      if (loadedEnv.GOOGLE_CLIENT_ID && loadedEnv.GOOGLE_CLIENT_SECRET) {
        form.setValue('clientId', loadedEnv.GOOGLE_CLIENT_ID);
        form.setValue('clientSecret', loadedEnv.GOOGLE_CLIENT_SECRET);
        setEnvLoaded(true);
        
        console.log("Environment variables loaded from server");
      } else {
        // Don't set values if environment variables are not available
        setEnvLoaded(true);
        console.log("No environment variables available for Google integration");
      }
    };
    
    loadEnv();
  }, [form]);

  useEffect(() => {
    // Check if user is already connected
    const tokens = getGoogleTokens();
    if (tokens) {
      setIsConnected(true);
      
      // Try to get user info from token
      try {
        const userInfo = getUserInfo();
        if (userInfo && userInfo.email) {
          setUserEmail(userInfo.email);
        }
      } catch (error) {
        console.error("Error getting user info:", error);
      }
      
      // Check if token is valid, if not refresh it
      if (!isTokenValid()) {
        refreshToken(tokens.refreshToken);
      }
    }
  }, []);

  const refreshToken = async (refreshToken: string) => {
    try {
      const response = await apiRequest<any>({
        url: '/api/google/refresh',
        method: 'POST',
        data: { refreshToken }
      });
      
      if (response) {
        updateAccessToken(response);
        toast({
          title: "Token refreshed",
          description: "Your access token has been refreshed.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      toast({
        title: "Error refreshing token",
        description: "There was an error refreshing your access token. Please reconnect your account.",
        variant: "destructive"
      });
      handleDisconnect();
    }
  };

  const handleOAuthInit = async (values: GoogleOAuthFormValues) => {
    setIsAuthorizing(true);
    
    try {
      // Get the redirect URI from the current location
      const redirectUri = `${window.location.origin}/oauth-callback`;
      
      const response = await apiRequest<{ authUrl: string }>({
        url: '/api/google/init',
        method: 'POST',
        data: {
          clientId: values.clientId,
          clientSecret: values.clientSecret,
          redirectUri
        }
      });
      
      if (response && response.authUrl) {
        // Save the property ID temporarily in localStorage
        if (values.propertyId) {
          localStorage.setItem('ga4_property_id', values.propertyId);
        }
        
        // Open the OAuth authorization URL in a new window
        const authWindow = window.open(response.authUrl, '_blank', 'width=600,height=600');
        
        // Poll for the OAuth callback
        const pollTimer = window.setInterval(() => {
          try {
            // Check if the window has been redirected to our callback URL
            if (authWindow && authWindow.location.href.includes(redirectUri)) {
              window.clearInterval(pollTimer);
              
              // Extract the authorization code from the URL
              const code = new URL(authWindow.location.href).searchParams.get('code');
              
              if (code) {
                // Exchange the code for tokens
                handleOAuthCallback(code);
              } else {
                throw new Error("No authorization code received");
              }
              
              // Close the auth window
              authWindow.close();
            }
          } catch (e) {
            // Ignore security errors (cross-origin)
            if (!(e instanceof DOMException)) {
              console.error("Error polling auth window:", e);
              window.clearInterval(pollTimer);
              setIsAuthorizing(false);
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error initializing OAuth:", error);
      toast({
        title: "OAuth Error",
        description: "Failed to initialize OAuth. Please check your credentials and try again.",
        variant: "destructive"
      });
      setIsAuthorizing(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      const response = await apiRequest<any>({
        url: '/api/google/callback',
        method: 'POST',
        data: { code }
      });
      
      if (response) {
        // Get the stored property ID
        const propertyId = localStorage.getItem('ga4_property_id');
        
        // Save the tokens
        saveGoogleTokens(response, propertyId || undefined);
        
        // Remove the temporary property ID
        localStorage.removeItem('ga4_property_id');
        
        setIsConnected(true);
        setIsAuthorizing(false);
        
        // Get user info from the token
        const userInfo = getUserInfo();
        if (userInfo && userInfo.email) {
          setUserEmail(userInfo.email);
        }
        
        toast({
          title: "Connected to Google",
          description: "Your Google account has been connected successfully.",
          variant: "default"
        });
        
        // Notify parent component
        onConnect();
      }
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to complete the OAuth process. Please try again.",
        variant: "destructive"
      });
      setIsAuthorizing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const tokens = getGoogleTokens();
      
      if (tokens && tokens.accessToken) {
        await apiRequest({
          url: '/api/google/revoke',
          method: 'POST',
          data: { token: tokens.accessToken }
        });
      }
      
      // Clear tokens regardless of API response
      clearGoogleTokens();
      setIsConnected(false);
      setUserEmail(null);
      
      toast({
        title: "Disconnected",
        description: "Your Google account has been disconnected.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error disconnecting account:", error);
      
      // Clear tokens anyway on error
      clearGoogleTokens();
      setIsConnected(false);
      setUserEmail(null);
      
      toast({
        title: "Error",
        description: "There was an error disconnecting your account, but local credentials have been cleared.",
        variant: "destructive"
      });
    }
  };

  if (isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="mr-2 h-5 w-5 text-green-500" />
            Connected to Google
          </CardTitle>
          <CardDescription>
            Your account is connected to Google Search Console and Analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {userEmail && (
              <div className="mb-2">Connected account: <span className="font-medium">{userEmail}</span></div>
            )}
            <div className="text-muted-foreground">
              You can view metrics from Google Search Console and Analytics for your analyzed URLs.
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="flex items-center text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={handleDisconnect}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-blue-500" />
          Connect to Google APIs
        </CardTitle>
        <CardDescription>
          Connect to Google Search Console and Analytics to view performance metrics
        </CardDescription>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          <p className="font-medium">Informazioni sull'autenticazione</p>
          <p className="mt-1 text-blue-600 text-xs">
            L'applicazione usa l'API OAuth 2.0 di Google, che richiede che ogni utente si autentichi con il proprio account Google per accedere ai dati.
            Gli utenti esterni dell'app dovranno loggarsi con un account che ha accesso ai dati di Search Console/Analytics per il sito che stanno analizzando.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Hidden form fields - not visible to the user */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleOAuthInit)} className="space-y-4">
            <input type="hidden" {...form.register('clientId')} />
            <input type="hidden" {...form.register('clientSecret')} />
            
            {/* Only show the GA4 Property ID field */}
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GA4 Property ID (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 123456789" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Il numero ID della tua proprietà GA4
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isAuthorizing || !envLoaded}
            >
              {isAuthorizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autorizzazione in corso...
                </>
              ) : !envLoaded ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Caricamento configurazione...
                </>
              ) : (
                "Connetti a Google"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}