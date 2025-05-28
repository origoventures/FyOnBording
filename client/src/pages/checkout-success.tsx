import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface CheckoutSession {
  id: string;
  payment_status: string;
  metadata: {
    url: string;
    reportType: string;
  };
}

export default function CheckoutSuccessPage() {
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCheckoutSession = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          setError('No session ID found in URL');
          setLoading(false);
          return;
        }

        const data = await apiRequest({
          url: '/api/checkout-session',
          method: 'GET',
          params: { sessionId }
        });

        if (data.payment_status === 'paid') {
          setSession(data);

          // Quando il pagamento è stato effettuato, aggiorniamo manualmente il piano utente
          // e registriamo il pagamento chiamando un endpoint dedicato
          try {
            const userJson = localStorage.getItem('user');
            if (userJson) {
              const user = JSON.parse(userJson);

              await apiRequest({
                url: '/api/process-payment',
                method: 'POST',
                data: {
                  userId: user.id,
                  sessionId: sessionId,
                  planType: data.metadata?.planType || 'basic',
                  amount: data.amount_total || 0
                }
              });

              // Aggiorna il localStorage con il nuovo piano
              user.currentPlan = data.metadata?.planType || 'basic';
              localStorage.setItem('user', JSON.stringify(user));
            }
          } catch (paymentError) {
            console.error('Error processing payment:', paymentError);
            // Non mostriamo errore all'utente, l'importante è che loro vedano la pagina di successo
          }

          toast({
            title: "Payment Successful",
            description: "Thank you for your purchase! Your SEO report is ready.",
            variant: "default",
          });
        } else {
          setError('Payment not completed. Please contact support if you believe this is an error.');
        }
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError(err.message || 'Failed to verify payment status');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutSession();
  }, [toast]);

  const handleViewReport = () => {
    if (session?.metadata?.url) {
      // Redirect to the SEO analysis page with the URL
      setLocation(`/seo?url=${encodeURIComponent(session.metadata.url)}`);
    } else {
      // If no URL is in the metadata, just go to the SEO analysis page
      setLocation('/seo');
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 dark:bg-[#0a192f] dark:text-white">
        <div className="flex flex-col items-center space-y-4 text-center">
          {loading ? (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <h1 className="text-2xl font-semibold">Verifying Your Payment</h1>
              <p className="text-muted-foreground">Please wait while we verify your payment status...</p>
            </>
          ) : error ? (
            <>
              <AlertCircle className="h-16 w-16 text-destructive" />
              <h1 className="text-2xl font-semibold">Payment Verification Error</h1>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => setLocation('/pricing')}>Return to Pricing</Button>
            </>
          ) : (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h1 className="text-2xl font-semibold">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Thank you for your purchase! Your {session?.metadata?.reportType || 'SEO'} report for{' '}
                <span className="font-semibold">{session?.metadata?.url || 'your website'}</span> is now ready.
              </p>
              <div className="flex space-x-4 mt-4">
                <Button 
                  onClick={handleViewReport}
                  className="bg-[#c8fa5f] hover:bg-[#b8ea4f] text-black font-medium"
                >
                  View Your Report
                </Button>
                <Button variant="outline" onClick={() => setLocation('/seo')}>
                  Go to SEO Analysis
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}