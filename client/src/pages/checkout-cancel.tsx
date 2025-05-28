import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutCancel() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Mostra un messaggio all'utente
    toast({
      title: "Payment Cancelled",
      description: "Your payment process was cancelled. You will be redirected to the pricing page.",
      variant: "default"
    });

    // Breve ritardo prima del reindirizzamento
    const redirectTimer = setTimeout(() => {
      setLocation('/pricing');
    }, 1500);

    return () => clearTimeout(redirectTimer);
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="text-center p-8">
        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
        <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
        <p className="text-gray-600">You'll be redirected to the pricing page in a moment.</p>
      </div>
    </div>
  );
}