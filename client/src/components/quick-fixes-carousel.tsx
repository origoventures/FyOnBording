import { useState } from 'react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Wand2, CheckCircle2 } from 'lucide-react';
import { SeoData } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import QuickFixCard from './quick-fixes-card';

interface QuickFix {
  id: string;
  title: string;
  description: string;
  implementation: string;
  category: 'meta-tags' | 'performance' | 'content' | 'accessibility' | 'images';
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  editable?: boolean; // Indica se questo quick fix può essere modificato dall'utente
  textType?: 'metaTitle' | 'metaDescription' | 'ogTitle' | 'ogDescription' | 'twitterTitle' | 'twitterDescription';
}

interface QuickFixesCarouselProps {
  seoData: SeoData;
  url: string;
}

export default function QuickFixesCarousel({ seoData, url }: QuickFixesCarouselProps) {
  const { toast } = useToast();
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<{fixId: string, text: string} | null>(null);

  // Generate quick fixes based on SEO data
  const quickFixes = generateQuickFixes(seoData, url);

  // Function to simulate applying a fix
  const applyFix = async (fix: QuickFix) => {
    if (appliedFixes.includes(fix.id)) return;

    setIsApplying(fix.id);

    // Simulate API call or processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    setAppliedFixes(prev => [...prev, fix.id]);
    setIsApplying(null);

    toast({
      title: "Fix Applied Successfully",
      description: `${fix.title} has been implemented on your site.`,
    });
  };

  // If no fixes are needed
  if (quickFixes.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mr-4" />
            <div>
              <h3 className="text-xl font-semibold text-green-800">All Good!</h3>
              <p className="text-green-700">Your site is already optimized with no quick fixes needed.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // We don't need these helpers anymore as they are moved to QuickFixCard

  return (
    <div className="my-8">
      <div className="flex items-center mb-4">
        <Wand2 className="h-5 w-5 mr-2 text-indigo-500" />
        <h2 className="text-xl font-bold">AI-Powered Quick Fixes</h2>
      </div>

      <p className="text-gray-500 mb-6">
        Apply these smart recommendations to instantly improve your SEO score. Simply click "Apply Fix" to implement.
      </p>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent>
          {quickFixes.map((fix) => (
            <CarouselItem key={fix.id} className="md:basis-1/2 lg:basis-1/3">
              <QuickFixCard 
                fix={fix}
                isApplying={isApplying === fix.id}
                isApplied={appliedFixes.includes(fix.id)}
                onApply={(implementation) => {
                  // Crea una copia del fix con l'implementazione aggiornata
                  const updatedFix = {...fix, implementation};
                  applyFix(updatedFix);
                }}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-end gap-2 mt-4">
          <CarouselPrevious className="static transform-none mx-0" />
          <CarouselNext className="static transform-none mx-0" />
        </div>
      </Carousel>
    </div>
  );
}

// Function to generate quick fixes based on SEO data
function generateQuickFixes(seoData: SeoData, url: string): QuickFix[] {
  const fixes: QuickFix[] = [];
  const tags = seoData.tags || {};
  const webVitals = seoData.webVitals;

  // Title fixes
  if (!tags.title || tags.title.length < 10) {
    fixes.push({
      id: 'title-missing',
      title: 'Add SEO-Friendly Title Tag',
      description: 'Your page is missing a proper title tag which is critical for SEO.',
      implementation: `<title>Your Primary Keyword - Brand Name</title>`,
      category: 'meta-tags',
      difficulty: 'easy',
      impact: 'high',
      editable: true,
      textType: 'metaTitle'
    });
  } else if (tags.title && tags.title.length > 60) {
    fixes.push({
      id: 'title-too-long',
      title: 'Optimize Title Length',
      description: `Your title (${tags.title.length} chars) is too long and will be truncated in search results.`,
      implementation: `<title>${tags.title.substring(0, 57)}...</title>`,
      category: 'meta-tags',
      difficulty: 'easy',
      editable: true,
      textType: 'metaTitle',
      impact: 'medium'
    });
  }

  // Description fixes
  if (!tags.description) {
    fixes.push({
      id: 'desc-missing',
      title: 'Add Meta Description',
      description: 'Your page is missing a meta description, which helps improve click-through rates.',
      implementation: `<meta name="description" content="Add a compelling 150-160 character description of your page here, including your target keywords naturally." />`,
      category: 'meta-tags',
      difficulty: 'easy',
      impact: 'high',
      editable: true,
      textType: 'metaDescription'
    });
  } else if (tags.description && tags.description.length > 160) {
    fixes.push({
      id: 'desc-too-long',
      title: 'Shorten Meta Description',
      description: `Your description (${tags.description.length} chars) is too long and will be truncated.`,
      implementation: `<meta name="description" content="${tags.description.substring(0, 157)}..." />`,
      category: 'meta-tags',
      difficulty: 'easy',
      impact: 'medium',
      editable: true,
      textType: 'metaDescription'
    });
  }

  // Social media tag fixes
  if (!tags['og:title'] || !tags['og:description'] || !tags['og:image']) {
    fixes.push({
      id: 'og-tags-missing',
      title: 'Add Open Graph Tags',
      description: 'Your page is missing Open Graph tags, which improve how your content appears when shared on social media.',
      implementation: `<meta property="og:title" content="${tags.title || 'Your Title'}" />
<meta property="og:description" content="${tags.description || 'Your description'}" />
<meta property="og:image" content="https://example.com/image.jpg" />
<meta property="og:url" content="${url}" />`,
      category: 'meta-tags',
      difficulty: 'easy',
      impact: 'medium',
      editable: true,
      textType: 'ogDescription'
    });
  }

  // Twitter card fixes
  if (!tags['twitter:card'] || !tags['twitter:title']) {
    fixes.push({
      id: 'twitter-tags-missing',
      title: 'Add Twitter Card Tags',
      description: 'Adding Twitter Card tags will enhance your content when shared on Twitter.',
      implementation: `<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${tags.title || 'Your Title'}" />
<meta name="twitter:description" content="${tags.description || 'Your description'}" />
<meta name="twitter:image" content="https://example.com/image.jpg" />`,
      category: 'meta-tags',
      difficulty: 'easy',
      impact: 'low',
      editable: true,
      textType: 'twitterDescription'
    });
  }

  // Performance fixes from Web Vitals
  if (webVitals && webVitals.lcp && webVitals.lcp.status !== 'good') {
    fixes.push({
      id: 'lcp-improvement',
      title: 'Improve Largest Contentful Paint',
      description: 'Your page\'s main content takes too long to load, affecting user experience and SEO.',
      implementation: `// Add image dimensions
<img src="image.jpg" width="800" height="600" />

// Use preload for critical resources
<link rel="preload" href="critical.css" as="style" />

// Implement lazy loading for non-critical images
<img loading="lazy" src="non-critical.jpg" />`,
      category: 'performance',
      difficulty: 'medium',
      impact: 'high'
    });
  }

  if (webVitals && webVitals.cls && webVitals.cls.status !== 'good') {
    fixes.push({
      id: 'cls-improvement',
      title: 'Fix Layout Shifts',
      description: 'Your page has layout shifts that create a poor user experience and impact Core Web Vitals.',
      implementation: `// Always include dimensions for images and videos
<img src="image.jpg" width="800" height="600" />

// Use CSS aspect-ratio or padding-top technique for responsive elements
.responsive-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
}

// Reserve space for dynamic content like ads
.ad-container {
  min-height: 250px;
}`,
      category: 'performance',
      difficulty: 'medium',
      impact: 'high'
    });
  }

  // Canonical URL fix
  if (!tags.canonical) {
    fixes.push({
      id: 'canonical-missing',
      title: 'Add Canonical URL',
      description: 'Your page is missing a canonical tag, which helps prevent duplicate content issues.',
      implementation: `<link rel="canonical" href="${url}" />`,
      category: 'meta-tags',
      difficulty: 'easy',
      impact: 'medium'
    });
  }

  // Robots meta tag issue
  if (tags.robots && tags.robots.includes('noindex')) {
    fixes.push({
      id: 'noindex-issue',
      title: 'Remove noindex Directive',
      description: 'Your page has a noindex directive that prevents search engines from indexing it.',
      implementation: `<meta name="robots" content="index, follow" />`,
      category: 'meta-tags',
      difficulty: 'easy',
      impact: 'high'
    });
  }

  // Structured data suggestion
  fixes.push({
    id: 'structured-data',
    title: 'Add Structured Data',
    description: 'Implement schema markup to help search engines understand your content and potentially show rich results.',
    implementation: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${tags.title || 'Page Title'}",
  "description": "${tags.description || 'Page Description'}"
}
</script>`,
    category: 'meta-tags',
    difficulty: 'medium',
    impact: 'medium'
  });

  return fixes;
}