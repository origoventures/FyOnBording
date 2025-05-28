import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { saveGoogleTokens, GoogleTokenResponse } from '@/lib/token-storage';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function OAuthCallback() {
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract authorization code from URL
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage(`Authorization was denied: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setErrorMessage('No authorization code received');
          return;
        }

        // Exchange code for tokens
        const response = await apiRequest<GoogleTokenResponse>({
          url: '/api/google/callback',
          method: 'POST',
          data: { code }
        });

        if (response) {
          // Get the stored property ID from localStorage (if any)
          const propertyId = localStorage.getItem('ga4_property_id');
          
          // Save the tokens
          saveGoogleTokens(response, propertyId || undefined);
          
          // Remove the temporary property ID
          localStorage.removeItem('ga4_property_id');
          
          setStatus('success');
          
          // Close the window after a short delay if opened as popup
          if (window.opener) {
            setTimeout(() => {
              window.close();
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to complete authentication');
      }
    };

    handleCallback();
  }, []);

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#03071C] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-8 px-6">
          <div className="flex flex-col items-center justify-center text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 text-[#d1f96d] animate-spin mb-4" />
                <h2 className="text-2xl font-bold mb-2">Authenticating...</h2>
                <p className="text-gray-500">
                  Please wait while we complete the authentication process
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Authentication Successful</h2>
                <p className="text-gray-500 mb-6">
                  Your Google account has been successfully connected. You can now view your Search Console and Analytics data.
                </p>
                {!window.opener && (
                  <Button onClick={goHome} className="bg-[#d1f96d] hover:bg-[#b4dc5a] text-[#03071C]">
                    Return to Analysis
                  </Button>
                )}
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
                <p className="text-gray-500 mb-2">
                  There was an error connecting your Google account:
                </p>
                <p className="text-red-500 mb-6">
                  {errorMessage || 'Unknown error occurred'}
                </p>
                {!window.opener && (
                  <Button onClick={goHome} variant="outline">
                    Return to Analysis
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}