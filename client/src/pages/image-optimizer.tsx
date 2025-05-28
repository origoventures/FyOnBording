import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import ImageOptimizer from '@/components/image-optimizer';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

export default function ImageOptimizerPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get user from local storage
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
        
        const user = JSON.parse(userJson);
        
        // Verify subscription plan
        if (user.id) {
          const response = await fetch(`/api/user/subscription?userId=${user.id}`);
          const data = await response.json();
          
          // Only Teams (premium) and Enterprise plans have access to Image Optimizer
          setHasAccess(data.currentPlan && ['premium', 'enterprise'].includes(data.currentPlan));
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, []);
  
  // If no access and loading is complete, show access restriction
  if (!isLoading && !hasAccess) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-[#03071C] text-white rounded-md flex flex-col items-center justify-center text-center">
        <Lock className="w-16 h-16 text-amber-400 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Premium Feature</h1>
        <p className="text-lg mb-8">
          Image Optimizer is only available for Teams and Enterprise plans. 
          Please upgrade your subscription to access this feature.
        </p>
        <button 
          onClick={() => navigate("/")} 
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-md"
        >
          View Pricing
        </button>
      </main>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Image Optimizer - SEO Analysis Tool</title>
        <meta 
          name="description" 
          content="Optimize your website images with our Image Optimizer tool. Convert to WebP format, analyze image quality, and improve your page load times." 
        />
      </Helmet>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <ImageOptimizer />
      )}
    </>
  );
}