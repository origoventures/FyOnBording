import { useState, useEffect } from "react";
import UrlForm from "@/components/url-form";
import ResultsSummary from "@/components/results-summary";
import NewResultsSummary from "@/components/new-results-summary";
import GooglePreview from "@/components/google-preview";
import SocialMediaPreview from "@/components/social-media-preview";
import MetaTagsDetails from "@/components/meta-tags-details";
import ExportButton from "@/components/export-button";
import CoreWebVitals from "@/components/core-web-vitals";
import Comparison from "@/components/comparison";
import GoogleIntegrations from "@/components/google-integrations";
import SeoRecommendations from "@/components/seo-recommendations";
import SeoScoreVisualization from "@/components/seo-score-visualization";
import SeoLoadingAnimation from "@/components/seo-loading-animation";
import ShareReportButton from "@/components/share-report-button";
import QuickFixesCarousel from "@/components/quick-fixes-carousel";
import SeoHealthChecklist from "@/components/seo-health-checklist";
import SeoMoodIndicator from "@/components/seo-mood-indicator";
import CollaborationSharing from "@/components/collaboration-sharing";
import CommunicationClarity from "@/components/communication-clarity";
import { useSeoAnalysis } from "@/hooks/use-seo-analysis";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Controlla se l'utente è autenticato e ha un abbonamento
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Controlla se l'utente è autenticato
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        const userData = JSON.parse(userJson);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Verifica l'abbonamento dell'utente
        if (userData.id) {
          const response = await fetch(`/api/user/subscription?userId=${userData.id}`, {
            headers: {
              'user-id': userData.id,
              'user-email': userData.email || ''
            }
          });
          const data = await response.json();
          
          // Utente è abbonato se ha utilizzi rimanenti (include anche il piano Free)
          console.log('Dati abbonamento:', data);
          
          // Update user data with subscription info
          setUser({
            ...userData,
            currentPlan: data.currentPlan
          });
          
          console.log('User data with plan:', {
            ...userData,
            currentPlan: data.currentPlan
          });
          
          setIsSubscribed(data.remainingUsage > 0);
        } else {
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setIsSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const { 
    analyzeSeo, 
    seoData, 
    isLoading: isAnalysisLoading, 
    error
  } = useSeoAnalysis();

  const handleAnalyze = async (submittedUrl: string) => {
    // Ancora una verifica prima di eseguire l'analisi
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to analyze URLs.",
      });
      return;
    }
    
    if (!isSubscribed) {
      toast({
        variant: "destructive",
        title: "Subscription Required",
        description: "You need a paid subscription to analyze URLs.",
      });
      return;
    }
    
    setUrl(submittedUrl);
    try {
      // Passa anche l'ID utente per il tracciamento dell'utilizzo
      await analyzeSeo(submittedUrl, user?.id);
    } catch (err) {
      if (err instanceof Error && err.message.includes("monthly limit")) {
        toast({
          variant: "destructive",
          title: "Limite raggiunto",
          description: "Hai esaurito tutte le analisi del piano gratuito. Fai upgrade al piano successivo",
        });
        navigate("/plans");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to analyze URL",
        });
      }
    }
  };
  
  // Calcola la fase di caricamento con messaggi appropriati
  const getLoadingMessage = () => {
    if (!isAnalysisLoading) return "";
    
    // Lista di messaggi a tema SEO da mostrare durante il caricamento
    const messages = [
      "Analisi degli elementi HTML...",
      "Verifica dei meta tag...", 
      "Analisi delle performance della pagina...",
      "Controllo della struttura del contenuto...",
      "Verifica dell'ottimizzazione mobile...",
      "Analisi delle immagini...",
      "Calcolo del punteggio SEO..."
    ];
    
    // Seleziona un messaggio casuale ma dipendente dal tempo trascorso (cambia ogni 3 secondi)
    const messageIndex = Math.floor(Date.now() / 3000) % messages.length;
    return messages[messageIndex];
  };

  // Se l'utente non è autenticato o non è abbonato, mostra un messaggio che li invita a farlo
  if (!isLoading && (!isAuthenticated || !isSubscribed)) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-[#03071C] text-white rounded-md flex flex-col items-center justify-center text-center">
        <Lock className="w-16 h-16 text-amber-400 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Premium Feature</h1>
        <p className="text-lg mb-8">
          {!isAuthenticated 
            ? "Please log in to access SEO Analysis." 
            : "SEO Analysis is available to users with active subscriptions or remaining free credits."}
        </p>
        <div className="flex gap-4">
          {!isAuthenticated && (
            <button 
              onClick={() => navigate("/login")} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              Log In
            </button>
          )}
          <button 
            onClick={() => navigate("/plans")} 
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-md"
          >
            View Plans
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 bg-[#03071C] text-white rounded-md ${!seoData ? 'max-w-3xl' : ''}`}>
      {/* URL Input Form */}
      <div className="max-w-3xl mx-auto">
        <UrlForm onAnalyze={handleAnalyze} isLoading={isAnalysisLoading} />
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6 sm:mb-8">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <div>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to analyze the website. Please try again."}
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      {/* Animazione di caricamento con tema SEO */}
      {isAnalysisLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center items-center py-16"
        >
          <SeoLoadingAnimation message={getLoadingMessage()} size="large" />
        </motion.div>
      )}

      {/* Results Container - Only shown after successful fetch */}
      {!isLoading && seoData && !error && (
        <>
          {/* New SEO Results Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <NewResultsSummary
              url={url}
              seoScore={seoData.score}
              tagCounts={seoData.tagCounts}
              seoData={seoData}
              userPlan={user?.planType || 'free'}
              analyzedAt={new Date()}
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column: Preview Cards */}
            <div className="space-y-6 md:space-y-8">
              <GooglePreview 
                url={url} 
                title={seoData.tags.title} 
                description={seoData.tags.description} 
              />
              
              <SocialMediaPreview 
                url={url} 
                tags={seoData.tags} 
              />
              
              {/* Core Web Vitals */}
              {seoData.webVitals && (
                <div className="mt-6">
                  <CoreWebVitals data={seoData.webVitals} />
                </div>
              )}
              
              {/* SEO Mood Indicator */}
              <SeoMoodIndicator seoData={seoData} />
            </div>
            
            {/* Right Column: Meta Tags Details */}
            <div className="space-y-6 md:space-y-8">
              <MetaTagsDetails tags={seoData.tags} />
              
              {/* Collaboration Sharing */}
              <CollaborationSharing 
                seoData={seoData} 
                url={seoData.url || url} 
                userPlan={user?.currentPlan || 'free'} 
              />
            </div>
          </div>
          
          {/* AI-Powered Quick Fixes Carousel */}
          {seoData && seoData.url && (
            <div className="mt-8">
              <QuickFixesCarousel 
                seoData={seoData} 
                url={seoData.url} 
              />
            </div>
          )}
          
          {/* Interactive SEO Health Checklist */}
          {seoData && seoData.url && (
            <div className="mt-8">
              <SeoHealthChecklist 
                seoData={seoData} 
                url={seoData.url} 
              />
            </div>
          )}

          {/* Communication Clarity Analysis */}
          {seoData && seoData.url && (
            <div className="mt-10 mb-8">
              <CommunicationClarity 
                url={seoData.url}
                isPremium={user?.currentPlan === 'premium' || user?.currentPlan === 'enterprise'} 
              />
            </div>
          )}
          
          {/* Personalized SEO Recommendations */}
          {seoData && seoData.url && (
            <div className="mt-10 mb-8">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Raccomandazioni SEO Personalizzate</h2>
                <p className="text-gray-400 mt-1">
                  Abbiamo analizzato il tuo sito e creato raccomandazioni su misura per aiutarti a migliorare il posizionamento.
                </p>
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-3 mb-6"></div>
              </div>
              <SeoRecommendations 
                tags={seoData.tags} 
                url={seoData.url} 
                score={seoData.score} 
                webVitals={seoData.webVitals} 
              />
            </div>
          )}
        
          {/* Google Integrations Section */}
          {seoData && seoData.url && (
            <GoogleIntegrations
              url={seoData.url}
              titleTag={seoData.tags.title}
              performanceComparison={seoData.performanceComparison}
            />
          )}

          {/* Comparison Section */}
          {seoData && seoData.url && (
            <Comparison primaryUrl={seoData.url} />
          )}
        </>
      )}
    </main>
  );
}
