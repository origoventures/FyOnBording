import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type TextType = 'metaTitle' | 'metaDescription' | 'ogTitle' | 'ogDescription' | 'twitterTitle' | 'twitterDescription';
type FeedbackStatus = 'success' | 'warning' | 'error';

interface SmartTextCheckerProps {
  text: string;
  textType: TextType;
  onChange: (text: string) => void;
  keywords?: string[];
}

export default function SmartTextChecker({ text, textType, onChange, keywords = [] }: SmartTextCheckerProps) {
  const [lengthFeedback, setLengthFeedback] = useState<{status: FeedbackStatus, message: string}>({ 
    status: 'warning', 
    message: 'Analisi in corso...' 
  });
  
  const [keywordsFeedback, setKeywordsFeedback] = useState<{status: FeedbackStatus, message: string}>({ 
    status: 'warning', 
    message: 'Analisi in corso...' 
  });
  
  const [readabilityFeedback, setReadabilityFeedback] = useState<{status: FeedbackStatus, message: string}>({ 
    status: 'warning', 
    message: 'Analisi in corso...' 
  });
  
  const [clarityFeedback, setClarityFeedback] = useState<{status: FeedbackStatus, message: string}>({ 
    status: 'warning', 
    message: 'Analisi in corso...' 
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
    if (!debouncedText) {
      setLengthFeedback({ status: 'warning', message: '⚠️ Testo mancante' });
      setKeywordsFeedback({ status: 'warning', message: '⚠️ Testo mancante' });
      setReadabilityFeedback({ status: 'warning', message: '⚠️ Testo mancante' });
      setClarityFeedback({ status: 'warning', message: '⚠️ Testo mancante' });
      return;
    }
    
    const config = getTextConfig();
    
    // 1. Analisi lunghezza
    const length = debouncedText.length;
    if (length < config.minLength) {
      setLengthFeedback({
        status: 'warning',
        message: `⚠️ Troppo corto (${length}/${config.optimalLength} ${config.lengthUnit})`
      });
    } else if (length > config.maxLength) {
      setLengthFeedback({
        status: 'warning',
        message: `⚠️ Troppo lungo (${length}/${config.maxLength} ${config.lengthUnit})`
      });
    } else {
      setLengthFeedback({
        status: 'success',
        message: `✅ Lunghezza ottimale (${length}/${config.optimalLength} ${config.lengthUnit})`
      });
    }
    
    // 2. Analisi keywords
    if (keywords.length === 0) {
      setKeywordsFeedback({
        status: 'warning',
        message: '⚠️ Nessuna keyword fornita per l\'analisi'
      });
    } else {
      const textLower = debouncedText.toLowerCase();
      const foundKeywords = keywords.filter(keyword => 
        textLower.includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length === 0) {
        setKeywordsFeedback({
          status: 'error',
          message: '❌ Non contiene nessuna keyword target'
        });
      } else if (foundKeywords.length < Math.min(2, keywords.length)) {
        setKeywordsFeedback({
          status: 'warning',
          message: `⚠️ Contiene solo ${foundKeywords.length} keyword target`
        });
      } else {
        setKeywordsFeedback({
          status: 'success',
          message: `✅ Contiene ${foundKeywords.length} keyword target`
        });
      }
    }
    
    // 3. Analisi leggibilità
    const words = debouncedText.split(/\s+/).filter(Boolean).length;
    const sentences = debouncedText.split(/[.!?]+/).filter(Boolean).length;
    
    if (words === 0 || sentences === 0) {
      setReadabilityFeedback({
        status: 'warning',
        message: '⚠️ Testo insufficiente per valutare la leggibilità'
      });
    } else {
      const avgWordsPerSentence = words / sentences;
      
      if (avgWordsPerSentence > 20) {
        setReadabilityFeedback({
          status: 'warning',
          message: '⚠️ Frasi troppo lunghe, semplifica'
        });
      } else if (textType.includes('Description') && words < 5) {
        setReadabilityFeedback({
          status: 'warning',
          message: '⚠️ Troppo breve, aggiungi più dettagli'
        });
      } else {
        setReadabilityFeedback({
          status: 'success',
          message: '✅ Buona leggibilità'
        });
      }
    }
    
    // 4. Analisi chiarezza e tono
    const vagueTerms = ['miglior', 'eccellente', 'fantastico', 'incredibile', 'ottimo'];
    const foundVagueTerms = vagueTerms.filter(term => 
      debouncedText.toLowerCase().includes(term.toLowerCase())
    );
    
    const hasCTA = textType.includes('Description') && 
      (debouncedText.includes('Scopri') || 
       debouncedText.includes('Visita') || 
       debouncedText.includes('Leggi') ||
       debouncedText.includes('Contatta') ||
       debouncedText.includes('Prova'));
    
    if (foundVagueTerms.length > 1) {
      setClarityFeedback({
        status: 'warning',
        message: '⚠️ Troppi termini vaghi, sii più specifico'
      });
    } else if (textType.includes('Description') && !hasCTA) {
      setClarityFeedback({
        status: 'warning',
        message: '💡 Aggiungi una call-to-action'
      });
    } else {
      setClarityFeedback({
        status: 'success',
        message: '✅ Messaggio chiaro e specifico'
      });
    }
    
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
      
      // Esempi di riscrittura intelligente basata sul tipo di tag SEO
      let newText = '';
      
      // Estrai eventuali parole chiave dal testo corrente
      const words = text.split(' ').filter(word => word.length > 3);
      const keyTerms = words.length > 3 ? words.slice(0, 3) : ['SEO', 'ottimizzazione', 'web'];
      
      if (textType === 'metaTitle') {
        // Titoli: concisi e con keyword all'inizio per SEO
        newText = `${keyTerms[0] || 'SEO'} ${keyTerms[1] || 'Analisi'}: Ottimizza il tuo sito web | Tool professionali`;
      } else if (textType === 'metaDescription') {
        // Descrizioni: informative con call-to-action
        newText = `Scopri come migliorare il ranking del tuo sito con la nostra analisi ${keyTerms[0] || 'SEO'} completa. Strumenti avanzati, report dettagliati e suggerimenti mirati per posizionarti meglio sui motori di ricerca.`;
      } else if (textType.includes('og')) {
        // OG tags: accattivanti per i social media
        newText = `Ottimizza la visibilità del tuo sito con l'analisi ${keyTerms[0] || 'SEO'} professionale. Risultati immediati e verificabili!`;
      } else if (textType.includes('twitter')) {
        // Twitter cards: brevi e d'impatto
        newText = `Migliora subito il tuo ${keyTerms[0] || 'SEO'} con il nostro strumento di analisi professionale. Prova ora!`;
      } else {
        // Fallback
        newText = `Analisi SEO professionale: ottimizza il tuo sito web e aumenta il traffico organico. Strumenti avanzati e suggerimenti personalizzati.`;
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
        <Badge variant={lengthFeedback.status === 'success' ? 'outline' : 'secondary'} className="flex items-center gap-1">
          {lengthFeedback.status === 'success' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {lengthFeedback.message}
        </Badge>
        
        <Badge variant={keywordsFeedback.status === 'success' ? 'outline' : 'secondary'} className="flex items-center gap-1">
          {keywordsFeedback.status === 'success' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {keywordsFeedback.message}
        </Badge>
        
        <Badge variant={readabilityFeedback.status === 'success' ? 'outline' : 'secondary'} className="flex items-center gap-1">
          {readabilityFeedback.status === 'success' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Lightbulb className="h-3 w-3" />
          )}
          {readabilityFeedback.message}
        </Badge>
        
        <Badge variant={clarityFeedback.status === 'success' ? 'outline' : 'secondary'} className="flex items-center gap-1">
          {clarityFeedback.status === 'success' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Lightbulb className="h-3 w-3" />
          )}
          {clarityFeedback.message}
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