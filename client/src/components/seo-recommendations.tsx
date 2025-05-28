import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, ChevronRight, ChevronDown, Lightbulb } from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RecommendationItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'good' | 'warning' | 'error';
  improvement: string;
  category: 'meta-tags' | 'content' | 'performance' | 'structure' | 'images' | 'social';
}

interface SeoRecommendationsProps {
  tags: Record<string, string>;
  url: string;
  score: number;
  webVitals?: any;
}

export default function SeoRecommendations({ tags, url, score, webVitals }: SeoRecommendationsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Generare le raccomandazioni in base all'analisi
  const recommendations = generateRecommendations(tags, score, webVitals, url);
  
  // Raggruppare le raccomandazioni per categoria
  const categorizedRecommendations = recommendations.reduce((acc, recommendation) => {
    if (!acc[recommendation.category]) {
      acc[recommendation.category] = [];
    }
    acc[recommendation.category].push(recommendation);
    return acc;
  }, {} as Record<string, RecommendationItem[]>);
  
  // Contare le raccomandazioni per ogni livello di priorità
  const priorityCounts = recommendations.reduce((acc, recommendation) => {
    acc[recommendation.priority] = (acc[recommendation.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Se non ci sono raccomandazioni, mostra un messaggio positivo
  if (recommendations.length === 0) {
    return (
      <div className="bg-green-50 text-green-800 p-6 rounded-lg border border-green-200">
        <h3 className="text-xl font-semibold flex items-center">
          <Check className="h-6 w-6 mr-2" />
          Ottimo lavoro!
        </h3>
        <p className="mt-2">
          La tua pagina è ben ottimizzata per i motori di ricerca. Continua così!
        </p>
      </div>
    );
  }
  
  // Nomi leggibili delle categorie
  const categoryNames: Record<string, string> = {
    'meta-tags': 'Meta Tags',
    'content': 'Contenuto',
    'performance': 'Performance',
    'structure': 'Struttura',
    'images': 'Immagini',
    'social': 'Social Media'
  };

  // Colori per i badge di priorità
  const priorityColors: Record<string, string> = {
    'high': 'bg-red-100 text-red-800 hover:bg-red-200',
    'medium': 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    'low': 'bg-green-100 text-green-800 hover:bg-green-200'
  };

  // Ottenere le categorie ordinate per numero di raccomandazioni critiche
  const sortedCategories = Object.keys(categorizedRecommendations).sort((a, b) => {
    const aHighPriority = categorizedRecommendations[a].filter(r => r.priority === 'high').length;
    const bHighPriority = categorizedRecommendations[b].filter(r => r.priority === 'high').length;
    return bHighPriority - aHighPriority;
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5" />
          Raccomandazioni SEO Personalizzate
        </CardTitle>
        <CardDescription className="text-blue-100">
          Abbiamo analizzato il tuo sito e identificato {recommendations.length} opportunità di miglioramento
        </CardDescription>
        
        <div className="flex gap-2 mt-3">
          {priorityCounts.high && (
            <Badge variant="outline" className="bg-red-100 bg-opacity-20 text-white border-red-300">
              {priorityCounts.high} Critiche
            </Badge>
          )}
          {priorityCounts.medium && (
            <Badge variant="outline" className="bg-amber-100 bg-opacity-20 text-white border-amber-300">
              {priorityCounts.medium} Moderate
            </Badge>
          )}
          {priorityCounts.low && (
            <Badge variant="outline" className="bg-green-100 bg-opacity-20 text-white border-green-300">
              {priorityCounts.low} Minori
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          {sortedCategories.map((category) => (
            <AccordionItem value={category} key={category}>
              <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                <div className="flex items-center">
                  <span className="font-medium">{categoryNames[category] || category}</span>
                  <Badge className="ml-2 bg-slate-200 text-slate-800">
                    {categorizedRecommendations[category].length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                <div className="divide-y">
                  {categorizedRecommendations[category].map((recommendation, idx) => (
                    <div 
                      key={`${category}-${idx}`} 
                      className="p-4 hover:bg-slate-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          {recommendation.status === 'good' ? (
                            <Check className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : recommendation.status === 'warning' ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div>
                            <h4 className="font-medium text-sm mb-1">{recommendation.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                            <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-100 text-sm">
                              <p className="font-medium text-blue-800 mb-1">Suggerimento:</p>
                              <p className="text-blue-700">{recommendation.improvement}</p>
                            </div>
                          </div>
                        </div>
                        <Badge className={priorityColors[recommendation.priority]}>
                          {recommendation.priority === 'high' ? 'Alta' : recommendation.priority === 'medium' ? 'Media' : 'Bassa'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Funzione principale per generare le raccomandazioni basate sull'analisi
function generateRecommendations(
  tags: Record<string, string>, 
  score: number,
  webVitals?: any,
  url?: string
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  
  // Controllo del meta title
  const title = tags.title || '';
  if (!title) {
    recommendations.push({
      title: 'Meta title mancante',
      description: 'Il tag <title> è essenziale per SEO e usabilità.',
      priority: 'high',
      status: 'error',
      improvement: 'Aggiungi un tag title conciso (50-60 caratteri) che descriva accuratamente il contenuto della pagina e includa la tua keyword principale.',
      category: 'meta-tags'
    });
  } else if (title.length < 30) {
    recommendations.push({
      title: 'Meta title troppo corto',
      description: `Il tuo title ("${title}") ha solo ${title.length} caratteri.`,
      priority: 'medium',
      status: 'warning',
      improvement: 'Estendi il title a 50-60 caratteri per migliorare il click-through rate e includere più keyword rilevanti.',
      category: 'meta-tags'
    });
  } else if (title.length > 60) {
    recommendations.push({
      title: 'Meta title troppo lungo',
      description: `Il tuo title ha ${title.length} caratteri e potrebbe essere troncato nei risultati di ricerca.`,
      priority: 'medium',
      status: 'warning',
      improvement: 'Riduci il title a 50-60 caratteri mantenendo le keyword principali all\'inizio.',
      category: 'meta-tags'
    });
  }
  
  // Controllo della meta description
  const description = tags['description'] || '';
  if (!description) {
    recommendations.push({
      title: 'Meta description mancante',
      description: 'La meta description aiuta a migliorare il CTR nei risultati di ricerca.',
      priority: 'high',
      status: 'error',
      improvement: 'Aggiungi una meta description persuasiva di 150-160 caratteri che riassuma il contenuto e includa una call-to-action.',
      category: 'meta-tags'
    });
  } else if (description.length < 70) {
    recommendations.push({
      title: 'Meta description troppo corta',
      description: `La tua description ha solo ${description.length} caratteri.`,
      priority: 'medium',
      status: 'warning',
      improvement: 'Espandi la meta description a 150-160 caratteri per fornire più contesto e includere più keyword rilevanti.',
      category: 'meta-tags'
    });
  } else if (description.length > 160) {
    recommendations.push({
      title: 'Meta description troppo lunga',
      description: `La tua description ha ${description.length} caratteri e verrà troncata nei risultati di ricerca.`,
      priority: 'medium',
      status: 'warning',
      improvement: 'Riduci la meta description a 150-160 caratteri mantenendo il messaggio principale e le keyword.',
      category: 'meta-tags'
    });
  }
  
  // Controllo dei tag Open Graph per i social media
  if (!tags['og:title'] || !tags['og:description'] || !tags['og:image']) {
    let missingTags = [];
    if (!tags['og:title']) missingTags.push('og:title');
    if (!tags['og:description']) missingTags.push('og:description');
    if (!tags['og:image']) missingTags.push('og:image');
    
    recommendations.push({
      title: 'Tag Open Graph incompleti',
      description: `Mancano i seguenti tag Open Graph: ${missingTags.join(', ')}.`,
      priority: 'medium',
      status: 'warning',
      improvement: 'Aggiungi tutti i tag Open Graph necessari (og:title, og:description, og:image, og:url) per migliorare l\'aspetto quando il contenuto viene condiviso sui social media.',
      category: 'social'
    });
  }
  
  // Controllo dei Twitter Card tags
  if (!tags['twitter:card'] || !tags['twitter:title'] || !tags['twitter:description']) {
    recommendations.push({
      title: 'Twitter Card tags mancanti',
      description: 'I Twitter Card tags migliorano la visualizzazione dei link su Twitter.',
      priority: 'low',
      status: 'warning',
      improvement: 'Aggiungi almeno twitter:card, twitter:title, twitter:description e twitter:image per migliorare la condivisione su Twitter.',
      category: 'social'
    });
  }
  
  // Controllo del canonical tag
  if (!tags.canonical) {
    recommendations.push({
      title: 'Canonical tag mancante',
      description: 'Il tag canonical aiuta a prevenire problemi di contenuto duplicato.',
      priority: 'medium',
      status: 'warning',
      improvement: 'Aggiungi un tag link rel="canonical" che punti all\'URL canonico di questa pagina per evitare penalizzazioni per contenuto duplicato.',
      category: 'meta-tags'
    });
  }
  
  // Controllo dell'attributo hreflang per siti multilingua
  if (!tags['hreflang']) {
    const htmlLang = tags.html?.match(/lang="([^"]+)"/)?.[1];
    if (htmlLang && !['en', 'en-US'].includes(htmlLang)) {
      recommendations.push({
        title: 'Tag hreflang mancante per sito multilingua',
        description: 'Il tuo sito sembra utilizzare una lingua diversa dall\'inglese.',
        priority: 'medium',
        status: 'warning',
        improvement: 'Aggiungi tag hreflang per indicare le versioni del sito in lingue alternative, migliorando il targeting internazionale nei motori di ricerca.',
        category: 'meta-tags'
      });
    }
  }
  
  // Controllo del viewport per responsività mobile
  if (!tags['viewport']) {
    recommendations.push({
      title: 'Meta viewport mancante',
      description: 'Il tag viewport è essenziale per la corretta visualizzazione sui dispositivi mobili.',
      priority: 'high',
      status: 'error',
      improvement: 'Aggiungi <meta name="viewport" content="width=device-width, initial-scale=1"> per garantire che il tuo sito si adatti correttamente ai dispositivi mobili.',
      category: 'meta-tags'
    });
  } else if (!tags['viewport'].includes('width=device-width')) {
    recommendations.push({
      title: 'Meta viewport non ottimale',
      description: 'Il tag viewport dovrebbe includere width=device-width per la corretta visualizzazione responsive.',
      priority: 'medium',
      status: 'warning',
      improvement: 'Modifica il meta viewport tag in <meta name="viewport" content="width=device-width, initial-scale=1">.',
      category: 'meta-tags'
    });
  }
  
  // Controllo dei meta robots
  if (tags['robots'] && tags['robots'].includes('noindex')) {
    recommendations.push({
      title: 'Pagina bloccata dall\'indicizzazione',
      description: 'Il tag robots contiene "noindex" che impedisce ai motori di ricerca di indicizzare la pagina.',
      priority: 'high',
      status: 'error',
      improvement: 'Rimuovi "noindex" dal meta robots tag se desideri che questa pagina sia indicizzata dai motori di ricerca.',
      category: 'meta-tags'
    });
  }
  
  // Controllo dei Core Web Vitals
  if (webVitals) {
    // LCP (Largest Contentful Paint)
    if (webVitals.lcp && (webVitals.lcp.status === 'needs-improvement' || webVitals.lcp.status === 'poor')) {
      recommendations.push({
        title: 'Migliorare il tempo di caricamento (LCP)',
        description: `Il tuo Largest Contentful Paint (${webVitals.lcp.value}ms) è ${webVitals.lcp.status === 'poor' ? 'scarso' : 'da migliorare'}.`,
        priority: webVitals.lcp.status === 'poor' ? 'high' : 'medium',
        status: webVitals.lcp.status === 'poor' ? 'error' : 'warning',
        improvement: 'Ottimizza le immagini, implementa il lazy loading, migliora il server response time e utilizza una CDN per ridurre il tempo di caricamento dei contenuti principali.',
        category: 'performance'
      });
    }
    
    // FID (First Input Delay)
    if (webVitals.fid && (webVitals.fid.status === 'needs-improvement' || webVitals.fid.status === 'poor')) {
      recommendations.push({
        title: 'Migliorare l\'interattività (FID)',
        description: `Il tuo First Input Delay (${webVitals.fid.value}ms) è ${webVitals.fid.status === 'poor' ? 'scarso' : 'da migliorare'}.`,
        priority: webVitals.fid.status === 'poor' ? 'high' : 'medium',
        status: webVitals.fid.status === 'poor' ? 'error' : 'warning',
        improvement: 'Riduci il JavaScript non essenziale, suddividi i task lunghi e utilizza web workers per operazioni pesanti che potrebbero bloccare il thread principale.',
        category: 'performance'
      });
    }
    
    // CLS (Cumulative Layout Shift)
    if (webVitals.cls && (webVitals.cls.status === 'needs-improvement' || webVitals.cls.status === 'poor')) {
      recommendations.push({
        title: 'Ridurre lo spostamento del layout (CLS)',
        description: `Il tuo Cumulative Layout Shift (${webVitals.cls.value}) è ${webVitals.cls.status === 'poor' ? 'scarso' : 'da migliorare'}.`,
        priority: webVitals.cls.status === 'poor' ? 'high' : 'medium',
        status: webVitals.cls.status === 'poor' ? 'error' : 'warning',
        improvement: 'Specifica le dimensioni per immagini e video, riserva spazio per annunci e banner, e carica i contenuti dinamici in modo che non spostino gli elementi esistenti.',
        category: 'performance'
      });
    }
  }
  
  // Controllo delle strutture dati per i rich snippet
  if (!tags['application/ld+json']) {
    recommendations.push({
      title: 'Schema markup (structured data) mancante',
      description: 'I dati strutturati aiutano i motori di ricerca a comprendere il contenuto e possono generare rich snippet.',
      priority: 'medium',
      status: 'warning',
      improvement: 'Implementa JSON-LD markup appropriato per il tipo di contenuto (articolo, prodotto, evento, etc.) per migliorare la visibilità nei risultati di ricerca con rich snippet.',
      category: 'structure'
    });
  }
  
  // Controllo immagini
  let hasImageAltIssue = false;
  for (const key in tags) {
    if (key.startsWith('img') && key.includes('alt') && (!tags[key] || tags[key] === '')) {
      hasImageAltIssue = true;
      break;
    }
  }
  
  if (hasImageAltIssue) {
    recommendations.push({
      title: 'Attributi alt mancanti nelle immagini',
      description: 'Alcune immagini non hanno attributi alt, importanti per accessibilità e SEO.',
      priority: 'medium',
      status: 'warning',
      improvement: 'Aggiungi attributi alt descrittivi a tutte le immagini per migliorare l\'accessibilità e aiutare i motori di ricerca a comprendere il contenuto delle immagini.',
      category: 'images'
    });
  }
  
  // Controllo di header tags (h1, h2, ecc.)
  if (!tags['h1']) {
    recommendations.push({
      title: 'Tag H1 mancante',
      description: 'Il tag H1 è importante per la struttura della pagina e per i motori di ricerca.',
      priority: 'high',
      status: 'error',
      improvement: 'Aggiungi un tag H1 che contenga la tua keyword principale e descrivi chiaramente l\'argomento della pagina.',
      category: 'structure'
    });
  } else if (tags['h1'].includes(',')) {
    // Verifica se ci sono più H1 (contando le virgole)
    recommendations.push({
      title: 'Più tag H1 nella pagina',
      description: 'È consigliato avere un solo tag H1 per pagina.',
      priority: 'medium',
      status: 'warning',
      improvement: 'Mantieni un solo tag H1 principale e usa H2-H6 per le sottosezioni.',
      category: 'structure'
    });
  }
  
  // Aggiungi raccomandazioni generiche basate sullo score complessivo
  if (score < 70) {
    if (!recommendations.some(r => r.category === 'structure' && r.title.includes('URL'))) {
      recommendations.push({
        title: 'Ottimizzare la struttura delle URL',
        description: 'URL SEO-friendly sono semplici, descrittivi e contengono keyword rilevanti.',
        priority: 'medium',
        status: 'warning',
        improvement: 'Usa URL brevi e descrittivi con parole separate da trattini, evita parametri eccessivi e mantieni una struttura gerarchica logica del sito.',
        category: 'structure'
      });
    }
    
    if (!recommendations.some(r => r.category === 'images')) {
      recommendations.push({
        title: 'Migliorare l\'ottimizzazione delle immagini',
        description: 'Le immagini non ottimizzate rallentano il caricamento della pagina e peggiorano l\'esperienza utente.',
        priority: 'medium',
        status: 'warning',
        improvement: 'Comprimi le immagini, utilizza formati moderni come WebP, aggiungi attributi alt descrittivi e implementa il lazy loading per le immagini sotto la fold.',
        category: 'images'
      });
    }
    
    // Raccomandazione per contenuti
    if (score < 50) {
      recommendations.push({
        title: 'Migliorare la qualità e la lunghezza dei contenuti',
        description: 'I contenuti di alta qualità e sufficientemente approfonditi sono essenziali per il ranking nei motori di ricerca.',
        priority: 'high',
        status: 'warning',
        improvement: 'Sviluppa contenuti più approfonditi (almeno 1000 parole per le pagine principali), ricchi di informazioni utili e pertinenti alle query di ricerca del tuo pubblico target.',
        category: 'content'
      });
    }
  }
  
  // Suggerimenti sulla sicurezza
  if (url && !url.startsWith('https://')) {
    recommendations.push({
      title: 'Passare a HTTPS',
      description: 'Il tuo sito non utilizza una connessione sicura (HTTPS).',
      priority: 'high',
      status: 'error',
      improvement: 'Implementa un certificato SSL e migra tutto il sito a HTTPS. I motori di ricerca preferiscono i siti sicuri e alcuni browser mostrano avvisi per i siti non sicuri.',
      category: 'structure'
    });
  }
  
  return recommendations;
}