import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import PricingCard from '@/components/pricing-card';
import CheckoutButton from '@/components/checkout-button';
import { ArrowRight } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePlans } from '@/hooks/use-plans';
import { Skeleton } from '@/components/ui/skeleton';

export default function PricingPage() {
  const { data: plans, isLoading, error } = usePlans();
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'enterprise' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Check if user is logged in on component mount
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    setIsLoggedIn(!!userJson);
  }, []);
  
  const handlePlanSelect = (plan: 'basic' | 'premium' | 'enterprise') => {
    setSelectedPlan(plan);
    
    // If not logged in, redirect to login page
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Redirecting to login page...",
      });
      
      // Save selected plan to sessionStorage
      sessionStorage.setItem('selectedPlan', plan);
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return;
    }
    
    // Directly proceed to checkout if logged in
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-16">
          <Skeleton className="h-12 w-1/2 mx-auto mb-4" />
          <Skeleton className="h-6 w-1/3 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[400px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <p>Failed to load pricing plans. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Trova il piano per tipo
  const freePlan = plans?.find(plan => plan.type === 'free');
  const basicPlan = plans?.find(plan => plan.type === 'basic');
  const premiumPlan = plans?.find(plan => plan.type === 'premium');
  const enterprisePlan = plans?.find(plan => plan.type === 'enterprise');

  // Formatta i prezzi (converti da centesimi a dollari)
  const formatPrice = (price: number) => (price / 100).toFixed(2);

  return (
    <>
      <Helmet>
        <title>Pricing - MetaMuse SEO Analysis Tool</title>
        <meta 
          name="description" 
          content="Explore our pricing plans for MetaMuse SEO Analysis Tool. Choose from Free, Pro, Teams, and Enterprise plans to suit your SEO needs."
        />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Notification Banner */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#0e1224] rounded-full border border-gray-800 py-2 px-6 inline-flex items-center">
            <span className="text-sm text-white">May 09, 2025: We've made some updates to our pricing structure</span>
            <ArrowRight className="ml-2 h-4 w-4 text-[#26e07f]" />
          </div>
        </div>
        
        {/* Pricing Header */}
        <div className="text-center mb-16 bg-[#0e1224] py-8 rounded-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Plans and Pricing</h1>
          <p className="text-xl text-white">Choose the perfect plan for your journey</p>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {freePlan && (
            <PricingCard
              title="Free"
              price={`$${formatPrice(freePlan.price)}`}
              period="per month"
              features={[
                { text: "2 week Pro trial" },
                { text: `${freePlan.monthlyLimit} analyses per month` }
              ]}
              action={{
                text: "Start for Free",
                onClick: () => {
                  // Verificare se l'utente è loggato
                  if (!isLoggedIn) {
                    toast({
                      title: "Login Required",
                      description: "Please log in or register to start your free trial.",
                      variant: "destructive",
                    });
                    // Qui potremmo eventualmente reindirizzare alla pagina di login
                    return;
                  }
                  
                  // Se l'utente è già loggato, lo mandiamo direttamente alla pagina di analisi SEO
                  window.location.href = "/seo";
                },
                variant: "outline"
              }}
            />
          )}
          
          {basicPlan && (
            <PricingCard
              title="Basic"
              price={`$${formatPrice(basicPlan.price)}`}
              period="per month"
              intro="Everything in Free, plus:"
              features={[
                { text: `${basicPlan.monthlyLimit} analyses per month` }
              ]}
              action={{
                text: "Subscribe Now",
                onClick: () => handlePlanSelect('basic')
              }}
              highlighted={true}
            />
          )}
          
          {premiumPlan && (
            <PricingCard
              title="Premium"
              price={`$${formatPrice(premiumPlan.price)}`}
              period="per month"
              intro="Everything in Basic, plus:"
              features={[
                { text: `${premiumPlan.monthlyLimit} analyses per month` }
              ]}
              action={{
                text: "Subscribe Now",
                onClick: () => handlePlanSelect('premium')
              }}
            />
          )}
          
          {enterprisePlan && (
            <PricingCard
              title="Enterprise"
              price={`$${formatPrice(enterprisePlan.price)}`}
              period="per month"
              intro="Everything in Premium, plus:"
              features={[
                { text: `${enterprisePlan.monthlyLimit} analyses per month` }
              ]}
              action={{
                text: "Subscribe Now",
                onClick: () => handlePlanSelect('enterprise'),
                variant: "outline"
              }}
            />
          )}
        </div>
        
        {/* Features Comparison */}
        <div className="mt-24 max-w-3xl mx-auto bg-[#0e1224] p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">All plans include</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex items-start">
              <Check className="text-[#d1f96d] h-5 w-5 mr-3 mt-0.5" />
              <span className="text-white">Comprehensive SEO analysis</span>
            </div>
            
            <div className="flex items-start">
              <Check className="text-[#d1f96d] h-5 w-5 mr-3 mt-0.5" />
              <span className="text-white">Meta tag optimization</span>
            </div>
            
            <div className="flex items-start">
              <Check className="text-[#d1f96d] h-5 w-5 mr-3 mt-0.5" />
              <span className="text-white">Google Search preview</span>
            </div>
            
            <div className="flex items-start">
              <Check className="text-[#d1f96d] h-5 w-5 mr-3 mt-0.5" />
              <span className="text-white">Performance metrics</span>
            </div>
            
            <div className="flex items-start">
              <Check className="text-[#d1f96d] h-5 w-5 mr-3 mt-0.5" />
              <span className="text-white">Keyword analysis</span>
            </div>
            
            <div className="flex items-start">
              <Check className="text-[#d1f96d] h-5 w-5 mr-3 mt-0.5" />
              <span className="text-white">Core Web Vitals</span>
            </div>
            
            <div className="flex items-start">
              <Check className="text-[#d1f96d] h-5 w-5 mr-3 mt-0.5" />
              <span className="text-white">PDF export</span>
            </div>
            
            <div className="flex items-start">
              <Check className="text-[#d1f96d] h-5 w-5 mr-3 mt-0.5" />
              <span className="text-white">Image optimization</span>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="bg-[#0e1224] p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold text-white text-center">Frequently asked questions</h2>
          </div>
          
          <div className="space-y-8 bg-[#0e1224] p-8 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What is a marketing running agent?</h3>
              <p className="text-white">A marketing running agent allows you to perform one SEO analysis of a single URL. It covers checking meta tags, images, performance metrics, and generating recommendations.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-white">Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be immediately charged the prorated difference. When downgrading, your current plan will remain active until the end of your billing period.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Is there a refund policy?</h3>
              <p className="text-white">We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied with our service, please contact our support team within 14 days of purchase for a full refund.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Do unused agents roll over to the next month?</h3>
              <p className="text-white">No, marketing running agents do not roll over to the next month. Your allocation is refreshed at the beginning of each billing cycle.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Checkout Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Subscription</DialogTitle>
            <DialogDescription>
              You're about to subscribe to our {selectedPlan} plan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <CheckoutButton
              planType={selectedPlan || 'basic'}
            >
              Proceed to Checkout
            </CheckoutButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}