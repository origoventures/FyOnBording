import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight, BarChart2, CheckCircle, Globe, Rocket, Shield, Sparkles } from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Dirige gli utenti alla pagina appropriata in base al loro stato di autenticazione
  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/seo'); // Pagina di analisi SEO
    } else {
      // Se non autenticato, vai al login con piano free preselezionato
      sessionStorage.setItem('selectedPlan', 'free');
      navigate('/login');
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="py-20 bg-[#03071C] text-white rounded-lg mb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <motion.div 
              className="lg:w-1/2 mb-10 lg:mb-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Ottimizza il tuo sito web con<br />
                <span className="text-[#d1f96d]">Meta Muse</span>
              </h1>
              <p className="text-lg mb-8 text-gray-300 max-w-lg">
                Analizza, ottimizza e monitora le prestazioni SEO del tuo sito web con la nostra piattaforma all-in-one.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-[#d1f96d] hover:bg-[#b4dc5a] text-[#03071C] font-medium px-8 py-6 h-auto text-lg"
                  onClick={handleGetStarted}
                >
                  Inizia Ora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10 px-8 py-6 h-auto text-lg"
                  onClick={() => navigate('/plans')}
                >
                  Scopri i Piani
                </Button>
              </div>
            </motion.div>
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-[#0a0e28] p-6 rounded-xl border border-[#d1f96d]/20">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2 items-center text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Analisi completa dei meta tag</span>
                  </div>
                  <div className="flex gap-2 items-center text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Valutazione Core Web Vitals</span>
                  </div>
                  <div className="flex gap-2 items-center text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Integrazione Google Search Console</span>
                  </div>
                  <div className="flex gap-2 items-center text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Ottimizzazione immagini</span>
                  </div>
                  <div className="flex gap-2 items-center text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Analisi della concorrenza</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Funzionalità Principali</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Strumenti potenti per migliorare il posizionamento del tuo sito web nei motori di ricerca
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Globe className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-center mb-2">Analisi SEO Completa</h3>
                <p className="text-gray-600 text-center">
                  Analisi dettagliata dei meta tag, contenuti e struttura del tuo sito web con suggerimenti di miglioramento.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Rocket className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-center mb-2">Core Web Vitals</h3>
                <p className="text-gray-600 text-center">
                  Misurazione e monitoraggio dei Core Web Vitals per migliorare l'esperienza utente e il ranking.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <BarChart2 className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-center mb-2">Analytics Integrati</h3>
                <p className="text-gray-600 text-center">
                  Integrazione con Google Search Console e Analytics per monitorare le prestazioni in tempo reale.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Shield className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-center mb-2">Sicurezza SEO</h3>
                <p className="text-gray-600 text-center">
                  Verifica della sicurezza del sito e conformità ai requisiti di Google per un ranking ottimale.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-center mb-2">Ottimizzazione Immagini</h3>
                <p className="text-gray-600 text-center">
                  Strumenti per ottimizzare le immagini del sito migliorando dimensioni, formati e attributi alt.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-center mb-2">Report Dettagliati</h3>
                <p className="text-gray-600 text-center">
                  Report completi e personalizzabili per tracciare i progressi e i miglioramenti nel tempo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#03071C] text-white rounded-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto a migliorare il tuo SEO?</h2>
          <p className="text-lg mb-8 text-gray-300 max-w-2xl mx-auto">
            Unisciti a migliaia di siti web che hanno migliorato il loro posizionamento con SEO Analyzer
          </p>
          <Button 
            className="bg-[#d1f96d] hover:bg-[#b4dc5a] text-[#03071C] font-medium px-8 py-6 h-auto text-lg"
            onClick={handleGetStarted}
          >
            Inizia Gratuitamente <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}