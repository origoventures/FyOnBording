import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface SmartTextCheckProps {
  text: string;
  textType: 'metaTitle' | 'metaDescription' | 'ogTitle' | 'ogDescription' | 'twitterTitle' | 'twitterDescription';
  onChange: (text: string) => void;
  keywords?: string[];
}

export default function SmartTextCheck({ text, textType, onChange, keywords = [] }: SmartTextCheckProps) {
  type FeedbackStatus = 'success' | 'warning' | 'error';
  
  interface FeedbackItem {
    status: FeedbackStatus;
    message: string;
  }
  
  interface TextFeedback {
    length: FeedbackItem;
    keywords: FeedbackItem;
    readability: FeedbackItem;
    clarity: FeedbackItem;
  }
  
  const [feedback, setFeedback] = useState<TextFeedback>({
    length: { status: 'warning', message: 'Analisi in corso...' },
    keywords: { status: 'warning', message: 'Analisi in corso...' },
    readability: { status: 'warning', message: 'Analisi in corso...' },
    clarity: { status: 'warning', message: 'Analisi in corso...' },
  });

  const [isSmartRewriteLoading, setIsSmartRewriteLoading] = useState(false);
  const { toast } = useToast();

  // Debounced text for analysis
  const [debouncedText, setDebouncedText] = useState(text);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(text);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [text]);

  // Configuration basata sul tipo di testo
  const getTextConfig = () => {
    switch (textType) {
      case 'metaTitle':
        return {
          minLength: 30,
          optimalLength: 50,
          maxLength: 60,
          lengthUnit: 'caratteri',
          name: 'Meta Title'
        };
      case 'metaDescription':
        return {
          minLength: 120,
          optimalLength: 150,
          maxLength: 160,
          lengthUnit: 'caratteri',
          name: 'Meta Description'
        };
      case 'ogTitle':
        return {
          minLength: 30,
          optimalLength: 50,
          maxLength: 60,
          lengthUnit: 'caratteri',
          name: 'OG Title'
        };
      case 'ogDescription':
        return {
          minLength: 100,
          optimalLength: 150,
          maxLength: 200,
          lengthUnit: 'caratteri',
          name: 'OG Description'
        };
      case 'twitterTitle':
        return {
          minLength: 30,
          optimalLength: 50,
          maxLength: 60,
          lengthUnit: 'caratteri',
          name: 'Twitter Title'
        };
      case 'twitterDescription':
        return {
          minLength: 100,
          optimalLength: 150,
          maxLength: 200,
          lengthUnit: 'caratteri',
          name: 'Twitter Description'
        };
      default:
        return {
          minLength: 30,
          optimalLength: 50,
          maxLength: 60,
          lengthUnit: 'caratteri',
          name: 'Testo'
        };
    }
  };

  // Analizza il testo quando cambia
  useEffect(() => {
    if (!debouncedText) return;
    
    const config = getTextConfig();
    
    // 1. Analisi lunghezza
    const lengthAnalysis = (): FeedbackItem => {
      const length = debouncedText.length;
      if (length < config.minLength) {
        return {
          status: 'warning',
          message: `⚠️ Troppo corto (${length}/${config.optimalLength} ${config.lengthUnit})`
        };
      } else if (length > config.maxLength) {
        return {
          status: 'warning',
          message: `⚠️ Troppo lungo (${length}/${config.maxLength} ${config.lengthUnit})`
        };
      } else {
        return {
          status: 'success',
          message: `✅ Lunghezza ottimale (${length}/${config.optimalLength} ${config.lengthUnit})`
        };
      }
    };
    
    // 2. Analisi keywords
    const keywordAnalysis = (): FeedbackItem => {
      if (keywords.length === 0) {
        return {
          status: 'warning',
          message: '⚠️ Nessuna keyword fornita per l\'analisi'
        };
      }
      
      const textLower = debouncedText.toLowerCase();
      const foundKeywords = keywords.filter(keyword => 
        textLower.includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length === 0) {
        return {
          status: 'error',
          message: '❌ Non contiene nessuna keyword target'
        };
      } else if (foundKeywords.length < Math.min(2, keywords.length)) {
        return {
          status: 'warning',
          message: `⚠️ Contiene solo ${foundKeywords.length} keyword target`
        };
      } else {
        return {
          status: 'success',
          message: `✅ Contiene ${foundKeywords.length} keyword target`
        };
      }
    };
    
    // 3. Analisi leggibilità
    const readabilityAnalysis = (): FeedbackItem => {
      // Calcolo semplificato indice di leggibilità
      const words = debouncedText.split(/\s+/).filter(Boolean).length;
      const sentences = debouncedText.split(/[.!?]+/).filter(Boolean).length;
      
      if (words === 0 || sentences === 0) {
        return {
          status: 'warning',
          message: '⚠️ Testo insufficiente per valutare la leggibilità'
        };
      }
      
      const avgWordsPerSentence = words / sentences;
      
      if (avgWordsPerSentence > 20) {
        return {
          status: 'warning',
          message: '⚠️ Frasi troppo lunghe, semplifica'
        };
      } else if (textType.includes('Description') && words < 5) {
        return {
          status: 'warning',
          message: '⚠️ Troppo breve, aggiungi più dettagli'
        };
      } else {
        return {
          status: 'success',
          message: '✅ Buona leggibilità'
        };
      }
    };
    
    // 4. Analisi chiarezza e tono
    const clarityAnalysis = (): FeedbackItem => {
      // Cercare buzzword vaghe o frasi cliché
      const vagueTerms = ['miglior', 'eccellente', 'fantastico', 'incredibile', 'ottimo'];
      const foundVagueTerms = vagueTerms.filter(term => 
        debouncedText.toLowerCase().includes(term.toLowerCase())
      );
      
      // Verificare presenza di call-to-action per le descrizioni
      const hasCTA = textType.includes('Description') && 
        (debouncedText.includes('Scopri') || 
         debouncedText.includes('Visita') || 
         debouncedText.includes('Leggi') ||
         debouncedText.includes('Contatta') ||
         debouncedText.includes('Prova'));
      
      if (foundVagueTerms.length > 1) {
        return {
          status: 'warning',
          message: '⚠️ Troppi termini vaghi, sii più specifico'
        };
      } else if (textType.includes('Description') && !hasCTA) {
        return {
          status: 'warning',
          message: '💡 Aggiungi una call-to-action'
        };
      } else {
        return {
          status: 'success',
          message: '✅ Messaggio chiaro e specifico'
        };
      }
    };
    
    // Aggiorna tutti i feedback
    setFeedback({
      length: lengthAnalysis(),
      keywords: keywordAnalysis(),
      readability: readabilityAnalysis(),
      clarity: clarityAnalysis()
    });
    
  }, [debouncedText, textType, keywords]);

  // Funzione di riscrittura "smart"
  const handleSmartRewrite = async () => {
    if (!text) return;
    
    setIsSmartRewriteLoading(true);
    const config = getTextConfig();
    
    try {
      // Simulare una chiamata API a OpenAI
      // In una implementazione reale, qui chiameresti l'API OpenAI
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Esempi di riscrittura migliorata
      let newText = '';
      
      if (textType === 'metaTitle') {
        newText = `SEO ottimizzato: ${text.split(' ').slice(0, 5).join(' ')} | Analisi professionale`;
      } else if (textType === 'metaDescription') {
        newText = `Scopri come ottimizzare ${text.split(' ').slice(0, 3).join(' ')} con la nostra analisi SEO completa. Strumenti professionali, report dettagliati e suggerimenti avanzati per migliorare il tuo ranking.`;
      } else if (textType.includes('og')) {
        newText = `${text.split(' ').slice(0, 5).join(' ')} - Ottimizzazione SEO professionale per il tuo sito web`;
      } else {
        newText = text;
      }
      
      // Limita alla lunghezza ottimale
      if (newText.length > config.optimalLength) {
        newText = newText.substring(0, config.optimalLength);
      }
      
      onChange(newText);
      
      toast({
        title: "Riscrittura completata",
        description: "Il testo è stato ottimizzato per l'SEO.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Errore nella riscrittura",
        description: "Non è stato possibile ottimizzare il testo. Riprova più tardi.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSmartRewriteLoading(false);
    }
  };
  
  return (
    <div className="space-y-2 mt-2">
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Inserisci il testo per ${getTextConfig().name}...`}
        className="min-h-[80px] resize-y"
      />
      
      <div className="flex flex-wrap gap-2 mt-2">
        <Badge variant={feedback.length.status === 'success' ? 'outline' : 'secondary'} className="flex items-center gap-1">
          {feedback.length.status === 'success' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {feedback.length.message}
        </Badge>
        
        <Badge variant={feedback.keywords.status === 'success' ? 'outline' : 'secondary'} className="flex items-center gap-1">
          {feedback.keywords.status === 'success' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {feedback.keywords.message}
        </Badge>
        
        <Badge variant={feedback.readability.status === 'success' ? 'outline' : 'secondary'} className="flex items-center gap-1">
          {feedback.readability.status === 'success' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Lightbulb className="h-3 w-3" />
          )}
          {feedback.readability.message}
        </Badge>
        
        <Badge variant={feedback.clarity.status === 'success' ? 'outline' : 'secondary'} className="flex items-center gap-1">
          {feedback.clarity.status === 'success' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Lightbulb className="h-3 w-3" />
          )}
          {feedback.clarity.message}
        </Badge>
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={handleSmartRewrite}
          disabled={isSmartRewriteLoading}
        >
          <Zap className="h-3 w-3" />
          {isSmartRewriteLoading ? 'Ottimizzazione...' : 'Smart Rewrite'}
        </Button>
      </div>
    </div>
  );
}