import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading, hasActiveSubscription } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!loading) {
      // Utente non autenticato ma tenta di accedere a pagine protette
      if (!user && 
          (location === '/seo' || 
          location === '/image-optimizer' || 
          location === '/profile' || 
          location === '/api-test')) {
        navigate('/login?redirect=' + location);
        return;
      }

      // Per utenti non autenticati, homepage mostra la landing page
      // Per utenti autenticati con abbonamento, reindirizza dalla homepage alla pagina di analisi SEO
      // Ma permette di visitare le pagine dei piani e dei prezzi
      if (user && hasActiveSubscription && location === '/') {
        console.log('Reindirizzamento utente abbonato dalla homepage alla pagina SEO');
        navigate('/seo');
      }
    }
  }, [user, loading, location, hasActiveSubscription, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}