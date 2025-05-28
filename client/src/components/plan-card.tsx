import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Plan } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PlanCardProps {
  plan: Plan;
  currentPlan: string | null;
  userId: number;
  onCheckout?: (plan: Plan) => void;
}

export function PlanCard({ plan, currentPlan, userId, onCheckout }: PlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    // Se il piano non è cliccabile, non procedere
    if (!isClickable) {
      toast({
        title: "Plan Not Available",
        description: "You can only upgrade to a higher plan than your current one.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to login if user is not authenticated
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Redirecting to login page...",
      });

      // Save selected plan to sessionStorage
      sessionStorage.setItem('selectedPlan', plan.type);

      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return;
    }

    // Gestisci piano gratuito
    if (plan.type === 'free') {
      setIsLoading(true);
      try {
        // Per piano FREE, reindirizza direttamente alla pagina SEO
        toast({
          title: "Free Plan Activated",
          description: "Redirecting to SEO analysis...",
        });

        setTimeout(() => {
          window.location.href = '/seo';
        }, 1000);
        return;
      } catch (error) {
        console.error('Error activating free plan:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (onCheckout) {
      onCheckout(plan);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          planType: plan.type,
          userId
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error during checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = currentPlan === plan.type;
  const isPaid = plan.type !== 'free';

  // Funzione per determinare se un piano è un upgrade rispetto al piano corrente
  const isPlanUpgrade = () => {
    const planRanking = {
      'free': 0,
      'basic': 1,
      'premium': 2,
      'enterprise': 3
    };

    const currentRank = planRanking[currentPlan as keyof typeof planRanking] || 0;
    const planRank = planRanking[plan.type as keyof typeof planRanking] || 0;

    return planRank > currentRank;
  };

  // Un piano è cliccabile se non è il piano attuale
  const isClickable = !isActive && (plan.type === 'free' ? !currentPlan : true);

  // Convert cents to dollars for display
  const priceDisplay = (plan.price / 100).toFixed(2);

  return (
    <Card className={`w-full h-full flex flex-col ${isActive ? 'border-primary' : ''} bg-[#0a192f] text-white`}>
      <CardHeader>
        <div className="mb-4">
          <CardTitle className="text-xl font-bold">
            {plan.type === 'free' ? 'Free' : plan.name}
          </CardTitle>
          <CardDescription className="text-gray-300 h-[100px]">{plan.description}</CardDescription>
        </div>
        <div className="mb-4">
          <div className="text-3xl font-bold flex items-baseline">
            ${priceDisplay}
            {isPaid && <span className="text-sm font-normal text-gray-300 ml-1">/month</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-300 mb-4">
          {plan.monthlyLimit} analyses per month
        </p>

        <div className="space-y-3">
          <div className="flex items-center">
            <Check className="mr-2 h-4 w-4 text-green-400" />
            <span>SEO analysis</span>
          </div>
          <div className="flex items-center">
            <Check className="mr-2 h-4 w-4 text-green-400" />
            <span>Keyword analysis</span>
          </div>
          {plan.type !== 'free' && (
            <div className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-400" />
              <span>Core Web Vitals</span>
            </div>
          )}
          {(plan.type === 'premium' || plan.type === 'enterprise') && (
            <div className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-400" />
              <span>Google Analytics integration</span>
            </div>
          )}
          {(plan.type === 'premium' || plan.type === 'enterprise') && (
            <div className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-400" />
              <span>Image Optimizer</span>
            </div>
          )}
          {plan.type === 'enterprise' && (
            <div className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-400" />
              <span>How LLMs Understand Your Site</span>
            </div>
          )}
          {plan.type === 'enterprise' && (
            <div className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-400" />
              <span>Priority support</span>
            </div>
          )}
        </div>
      </CardContent>
      <div className="mt-auto pb-6 px-6">
        <Button 
          onClick={handleCheckout}
          disabled={!isClickable || isLoading}
          className={`w-full ${isActive ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-[#c8fa5f] hover:bg-[#b8ea4f] text-black'} font-medium`}
        >
          {isLoading ? "Loading..." : isActive ? "Current Plan" : plan.type === 'free' ? 'Start For Free' : 'Subscribe Now'}
        </Button>
      </div>
    </Card>
  );
}