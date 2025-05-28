import { useEffect, useState, useRef } from 'react';
import { usePlans } from '@/hooks/use-plans';
import { PlanCard } from '@/components/plan-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function PlansPage() {
  const { data: plans, isLoading, error } = usePlans();
  const [userId, setUserId] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const hasScrolledRef = useRef(false);

  // Fetch user's current subscription info
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user from local storage first
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          return;
        }
        
        const localUser = JSON.parse(userJson);
        
        // Check if we have a login API
        const userData = await fetch('/api/auth/user', {
          headers: {
            'user-id': localUser.id
          }
        });
        if (userData.status === 200) {
          const user = await userData.json();
          setUserId(user.id);

          if (user.id) {
            // Check subscription status
            const subscriptionData = await fetch(`/api/user/subscription?userId=${user.id}`, {
              headers: {
                'user-id': user.id
              }
            });
            if (subscriptionData.status === 200) {
              const subscription = await subscriptionData.json();
              setCurrentPlan(subscription.currentPlan);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);
  
  // Controlla se c'è un piano specificato nell'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const selectedPlan = searchParams.get('plan');
    
    if (selectedPlan && plans && !hasScrolledRef.current) {
      // Cerca il piano selezionato
      const planElement = document.getElementById(`plan-${selectedPlan}`);
      
      if (planElement) {
        // Scroll alla posizione del piano
        planElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Aggiungi un'evidenziazione temporanea
        planElement.classList.add('ring-4', 'ring-primary', 'ring-opacity-50');
        setTimeout(() => {
          planElement.classList.remove('ring-4', 'ring-primary', 'ring-opacity-50');
        }, 3000);
        
        toast({
          title: 'Select your plan',
          description: `You were interested in the ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan. Click Subscribe to continue.`,
        });
        
        // Rimuovi il parametro dall'URL senza ricaricare la pagina
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        hasScrolledRef.current = true;
      }
    }
  }, [plans, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-10 bg-[#f9fef0]">
        <div className="container">
          <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Plan</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col space-y-3">
                <Skeleton className="h-[400px] w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-10 bg-[#f9fef0]">
        <div className="container">
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            <p>Failed to load plans. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-[#f9fef0]">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your needs. All plans include basic SEO analysis features, 
            while premium plans include advanced features like Google Analytics integration and Image Optimization tools.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
          {plans && plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              currentPlan={currentPlan}
              userId={userId || 0} 
            />
          ))}
        </div>

        <Separator className="my-12" />

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Feature Comparison</h2>
          
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="col-span-1 font-semibold">Feature</div>
            <div className="col-span-1 text-center font-semibold">Free</div>
            <div className="col-span-1 text-center font-semibold">Basic</div>
            <div className="col-span-1 text-center font-semibold">Premium</div>
            <div className="col-span-1 text-center font-semibold">Enterprise</div>
          </div>

          <div className="grid grid-cols-5 gap-4 py-3 border-t">
            <div className="col-span-1">Analyses per month</div>
            <div className="col-span-1 text-center">25</div>
            <div className="col-span-1 text-center">100</div>
            <div className="col-span-1 text-center">500</div>
            <div className="col-span-1 text-center">Unlimited</div>
          </div>

          <div className="grid grid-cols-5 gap-4 py-3 border-t">
            <div className="col-span-1">SEO Analysis</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
          </div>

          <div className="grid grid-cols-5 gap-4 py-3 border-t">
            <div className="col-span-1">Keyword Analysis</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
          </div>

          <div className="grid grid-cols-5 gap-4 py-3 border-t">
            <div className="col-span-1">Core Web Vitals</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
          </div>

          <div className="grid grid-cols-5 gap-4 py-3 border-t">
            <div className="col-span-1">Google Analytics</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
          </div>

          <div className="grid grid-cols-5 gap-4 py-3 border-t">
            <div className="col-span-1">Image Optimizer</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">✓</div>
            <div className="col-span-1 text-center">✓</div>
          </div>

          <div className="grid grid-cols-5 gap-4 py-3 border-t">
            <div className="col-span-1">How LLMs Understand Your Site</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">✓</div>
          </div>

          <div className="grid grid-cols-5 gap-4 py-3 border-t">
            <div className="col-span-1">Priority Support</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">-</div>
            <div className="col-span-1 text-center">✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}