import React from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { InfoIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Interface for SEO terms dictionary
interface SeoTerm {
  term: string;
  shortDefinition: string;
  longDefinition: string;
  impact: 'high' | 'medium' | 'low';
  learnMoreUrl?: string;
  category: 'technical' | 'content' | 'performance' | 'user-experience' | 'analytics';
}

// Props for the tooltip component
interface SeoTermTooltipProps {
  children: React.ReactNode;
  term: string;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  tooltipAlign?: 'start' | 'center' | 'end';
}

// Dictionary of SEO terms with detailed explanations
const seoTermsDictionary: Record<string, SeoTerm> = {
  'meta-title': {
    term: 'Meta Title',
    shortDefinition: 'The title tag shown in search results',
    longDefinition: 'The meta title appears as the clickable headline in search engine results and browser tabs. It should be descriptive, contain keywords, and be under 60 characters.',
    impact: 'high',
    learnMoreUrl: 'https://moz.com/learn/seo/title-tag',
    category: 'technical'
  },
  'meta-description': {
    term: 'Meta Description',
    shortDefinition: 'A summary of your page content',
    longDefinition: 'The meta description is a ~160 character snippet that summarizes a page\'s content. While not directly used for rankings, it affects click-through rates from search results.',
    impact: 'medium',
    learnMoreUrl: 'https://moz.com/learn/seo/meta-description',
    category: 'technical'
  },
  'canonical-tag': {
    term: 'Canonical Tag',
    shortDefinition: 'Specifies the preferred version of a page',
    longDefinition: 'The canonical tag tells search engines which version of a URL should be indexed when multiple similar pages exist, helping prevent duplicate content issues.',
    impact: 'medium',
    learnMoreUrl: 'https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls',
    category: 'technical'
  },
  'robots-meta': {
    term: 'Robots Meta Tag',
    shortDefinition: 'Controls search engine crawling and indexing',
    longDefinition: 'The robots meta tag tells search engines whether to index a page or follow its links. Used incorrectly, it can prevent your page from appearing in search results.',
    impact: 'high',
    learnMoreUrl: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag',
    category: 'technical'
  },
  'structured-data': {
    term: 'Structured Data',
    shortDefinition: 'Code that helps search engines understand content',
    longDefinition: 'Structured data is a standardized format for providing information about a page and classifying its content. It helps search engines understand context and can enable rich results.',
    impact: 'medium',
    learnMoreUrl: 'https://developers.google.com/search/docs/guides/intro-structured-data',
    category: 'technical'
  },
  'alt-text': {
    term: 'Alt Text',
    shortDefinition: 'Descriptive text for images',
    longDefinition: 'Alt text (alternative text) describes an image\'s content and function on a page. It improves accessibility for screen readers and helps search engines understand images.',
    impact: 'medium',
    learnMoreUrl: 'https://moz.com/learn/seo/alt-text',
    category: 'content'
  },
  'h1-tag': {
    term: 'H1 Tag',
    shortDefinition: 'Main heading of a webpage',
    longDefinition: 'The H1 tag is the main heading of a webpage and should clearly describe what the page is about. It\'s an important signal for both users and search engines.',
    impact: 'high',
    learnMoreUrl: 'https://moz.com/learn/seo/on-page-factors',
    category: 'content'
  },
  'keyword-density': {
    term: 'Keyword Density',
    shortDefinition: 'Frequency of keywords in content',
    longDefinition: 'Keyword density refers to how often a keyword appears in content compared to the total word count. Modern SEO focuses on natural usage rather than specific percentages.',
    impact: 'low',
    learnMoreUrl: 'https://moz.com/blog/3-key-things-you-will-see-when-you-are-the-victim-of-negative-seo',
    category: 'content'
  },
  'lcp': {
    term: 'Largest Contentful Paint (LCP)',
    shortDefinition: 'Measures loading performance',
    longDefinition: 'Largest Contentful Paint (LCP) measures when the largest content element becomes visible to users. It\'s a Core Web Vital that should occur within 2.5 seconds for a good user experience.',
    impact: 'high',
    learnMoreUrl: 'https://web.dev/lcp/',
    category: 'performance'
  },
  'fid': {
    term: 'First Input Delay (FID)',
    shortDefinition: 'Measures interactivity',
    longDefinition: 'First Input Delay (FID) measures the time from a user\'s first interaction to when the browser responds. It\'s a Core Web Vital that should be less than 100ms for a good user experience.',
    impact: 'high',
    learnMoreUrl: 'https://web.dev/fid/',
    category: 'performance'
  },
  'cls': {
    term: 'Cumulative Layout Shift (CLS)',
    shortDefinition: 'Measures visual stability',
    longDefinition: 'Cumulative Layout Shift (CLS) measures how much elements move around as a page loads. It\'s a Core Web Vital that should be less than 0.1 for a good user experience.',
    impact: 'high',
    learnMoreUrl: 'https://web.dev/cls/',
    category: 'performance'
  },
  'crawl-budget': {
    term: 'Crawl Budget',
    shortDefinition: 'Resources search engines allocate to your site',
    longDefinition: 'Crawl budget is the number of pages search engines will crawl on your site within a certain timeframe. Important for large sites to ensure critical pages are discovered and indexed.',
    impact: 'medium',
    learnMoreUrl: 'https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget',
    category: 'technical'
  },
  'internal-linking': {
    term: 'Internal Linking',
    shortDefinition: 'Links between pages on the same website',
    longDefinition: 'Internal linking connects your content and helps establish information hierarchy. It spreads link equity around your site and helps search engines discover and understand your pages.',
    impact: 'high',
    learnMoreUrl: 'https://moz.com/learn/seo/internal-link',
    category: 'technical'
  },
  'mobile-friendly': {
    term: 'Mobile-Friendly',
    shortDefinition: 'Optimized for mobile devices',
    longDefinition: 'A mobile-friendly website is designed to function well on smartphones and tablets. With mobile-first indexing, Google primarily uses the mobile version of a site for ranking.',
    impact: 'high',
    learnMoreUrl: 'https://developers.google.com/search/mobile-sites',
    category: 'user-experience'
  },
  'bounce-rate': {
    term: 'Bounce Rate',
    shortDefinition: 'Percentage of single-page sessions',
    longDefinition: 'Bounce rate is the percentage of visitors who leave after viewing only one page. A high bounce rate can sometimes indicate content or user experience issues.',
    impact: 'medium',
    learnMoreUrl: 'https://support.google.com/analytics/answer/1009409',
    category: 'analytics'
  },
  'serp': {
    term: 'SERP (Search Engine Results Page)',
    shortDefinition: 'Results page shown by search engines',
    longDefinition: 'A SERP is the page displayed by search engines in response to a query. Understanding SERP features helps optimize content for better visibility and click-through rates.',
    impact: 'medium',
    learnMoreUrl: 'https://moz.com/learn/seo/serp',
    category: 'technical'
  },
  'rich-snippets': {
    term: 'Rich Snippets',
    shortDefinition: 'Enhanced search results with additional data',
    longDefinition: 'Rich snippets are enhanced search results that display additional information beyond the traditional title, URL, and description. They\'re generated using structured data markup.',
    impact: 'medium',
    learnMoreUrl: 'https://developers.google.com/search/docs/guides/search-gallery',
    category: 'technical'
  },
  'backlinks': {
    term: 'Backlinks',
    shortDefinition: 'Links from other websites to yours',
    longDefinition: 'Backlinks are links from other websites to your site. Quality backlinks from reputable sites are a key ranking factor as they signal trustworthiness and authority to search engines.',
    impact: 'high',
    learnMoreUrl: 'https://moz.com/learn/seo/backlinks',
    category: 'technical'
  }
};

// The component that renders the tooltip for SEO terms
export default function SeoTermTooltip({ 
  children, 
  term, 
  tooltipSide = 'top',
  tooltipAlign = 'center'
}: SeoTermTooltipProps) {
  // Look up the term in our dictionary
  const termInfo = seoTermsDictionary[term.toLowerCase()];
  
  // If the term isn't in our dictionary, just render the children
  if (!termInfo) {
    return <>{children}</>;
  }
  
  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };
  
  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-indigo-100 text-indigo-800';
      case 'content': return 'bg-green-100 text-green-800';
      case 'performance': return 'bg-purple-100 text-purple-800';
      case 'user-experience': return 'bg-pink-100 text-pink-800';
      case 'analytics': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className="group inline-flex items-center border-b border-dotted border-gray-400 cursor-help">
            {children}
            <InfoIcon className="h-3.5 w-3.5 ml-0.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side={tooltipSide}
          align={tooltipAlign}
          className="max-w-xs p-0 overflow-hidden rounded-lg border shadow-lg"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-3">
            <h3 className="font-bold text-white">{termInfo.term}</h3>
            <p className="text-xs text-blue-100">{termInfo.shortDefinition}</p>
          </div>
          
          <div className="p-3 bg-white">
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <span className="text-xs font-medium mr-2">Impact:</span>
                <span className={`text-xs font-semibold ${getImpactColor(termInfo.impact)}`}>
                  {termInfo.impact.toUpperCase()}
                </span>
              </div>
              
              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(termInfo.category)}`}>
                {termInfo.category.charAt(0).toUpperCase() + termInfo.category.slice(1)}
              </span>
            </div>
            
            <p className="text-sm text-gray-700">{termInfo.longDefinition}</p>
            
            {termInfo.learnMoreUrl && (
              <div className="mt-2 text-right">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600"
                  onClick={() => window.open(termInfo.learnMoreUrl, '_blank')}
                >
                  <span className="text-xs">Learn more</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}