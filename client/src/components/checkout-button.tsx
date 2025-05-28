import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  planType: 'basic' | 'premium' | 'enterprise';
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  className?: string;
}

export default function CheckoutButton({ 
  planType, 
  children, 
  variant = 'default',
  className = '' 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const { toast } = useToast();

  // On component mount, get user from localStorage
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.id) {
          setUserId(user.id);
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
  }, []);

  const handleCheckout = async () => {
    // Login check - if no user is logged in, redirect to login page
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Redirecting to login page before completing your purchase.",
      });
      
      // Salva il tipo di piano selezionato in sessionStorage
      sessionStorage.setItem('selectedPlan', planType);
      
      // Reindirizza alla pagina di login
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Creating checkout session for user ID ${userId} with plan ${planType}`);
      
      // Use the basic fetch API for simplicity
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType, userId }),
        credentials: 'include'
      });
      
      // Parse the response JSON first (even for error responses)
      const data = await response.json();
      
      // Handle error responses
      if (!response.ok) {
        throw new Error(data.error || data.message || response.statusText);
      }
      
      console.log('Checkout session created:', data);
      
      if (data.url) {
        // Show a success message before redirecting
        toast({
          title: "Redirecting to Stripe",
          description: "You'll be redirected to our secure payment page.",
        });
        
        // Short delay before redirecting to allow the toast to show
        setTimeout(() => {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        }, 1000);
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to initialize checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleCheckout} 
      variant={variant}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : children}
    </Button>
  );
}