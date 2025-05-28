import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeoData } from '@shared/schema';
import { motion } from 'framer-motion';

interface SeoMoodIndicatorProps {
  seoData: SeoData;
}

interface MoodState {
  emoji: string;
  label: string;
  color: string;
  description: string;
  animation: string;
}

export default function SeoMoodIndicator({ seoData }: SeoMoodIndicatorProps) {
  // Calculate the mood based on SEO score and other factors
  const getMoodState = (): MoodState => {
    const score = seoData.score || 0;
    const tagCounts = seoData.tagCounts || { good: 0, warning: 0, error: 0 };
    const webVitals = seoData.webVitals;
    
    // Calculate critical issues
    const criticalIssues = tagCounts.error || 0;
    const warningIssues = tagCounts.warning || 0;
    
    // Performance issues
    const hasPerformanceIssues = webVitals && (
      (webVitals.lcp && webVitals.lcp.status === 'poor') ||
      (webVitals.cls && webVitals.cls.status === 'poor') ||
      (webVitals.fid && webVitals.fid.status === 'poor')
    );
    
    // Excellent state (90-100)
    if (score >= 90 && criticalIssues === 0 && warningIssues <= 1) {
      return {
        emoji: '🥳',
        label: 'Ecstatic',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        description: 'Your SEO is outstanding! Your page is perfectly optimized.',
        animation: 'bounce'
      };
    }
    
    // Very good state (80-89)
    if (score >= 80 && criticalIssues === 0 && warningIssues <= 3) {
      return {
        emoji: '😄',
        label: 'Very Happy',
        color: 'bg-gradient-to-r from-green-500 to-teal-500',
        description: 'Great job! Your SEO is performing very well with minimal issues.',
        animation: 'pulse'
      };
    }
    
    // Good state (70-79)
    if (score >= 70 && criticalIssues <= 1) {
      return {
        emoji: '😊',
        label: 'Happy',
        color: 'bg-gradient-to-r from-green-400 to-cyan-500',
        description: 'Your SEO is in good shape. A few tweaks will make it even better!',
        animation: 'wiggle'
      };
    }
    
    // Okay state (60-69)
    if (score >= 60 && criticalIssues <= 2) {
      return {
        emoji: '🙂',
        label: 'Satisfied',
        color: 'bg-gradient-to-r from-blue-400 to-cyan-400',
        description: 'Your SEO is decent, but there\'s definitely room for improvement.',
        animation: 'none'
      };
    }
    
    // Concerned state (50-59)
    if (score >= 50 && criticalIssues <= 3) {
      return {
        emoji: '😐',
        label: 'Neutral',
        color: 'bg-gradient-to-r from-yellow-400 to-amber-400',
        description: 'Your SEO needs attention. Address the issues to improve rankings.',
        animation: 'none'
      };
    }
    
    // Worried state (40-49 or performance issues)
    if (score >= 40 || hasPerformanceIssues) {
      return {
        emoji: '😕',
        label: 'Concerned',
        color: 'bg-gradient-to-r from-amber-500 to-orange-500',
        description: 'Your SEO is struggling. Focus on fixing critical issues first.',
        animation: 'shake'
      };
    }
    
    // Sad state (30-39)
    if (score >= 30) {
      return {
        emoji: '😞',
        label: 'Sad',
        color: 'bg-gradient-to-r from-orange-500 to-red-500',
        description: 'Your SEO performance is poor. Immediate action is recommended.',
        animation: 'shake'
      };
    }
    
    // Very sad state (20-29)
    if (score >= 20) {
      return {
        emoji: '😫',
        label: 'Distressed',
        color: 'bg-gradient-to-r from-red-500 to-rose-500',
        description: 'Your SEO has serious problems that need urgent attention.',
        animation: 'shake'
      };
    }
    
    // Critical state (0-19)
    return {
      emoji: '😱',
      label: 'Critical',
      color: 'bg-gradient-to-r from-rose-600 to-red-700',
      description: 'Your SEO is severely underperforming. Major improvements needed!',
      animation: 'bounce'
    };
  };
  
  const mood = getMoodState();
  
  // Get appropriate animation
  const getAnimationProps = (type: string) => {
    switch (type) {
      case 'bounce':
        return {
          animate: { 
            y: [0, -10, 0],
            transition: { 
              repeat: Infinity, 
              duration: 1.5,
              repeatType: 'loop' as const
            }
          }
        };
      case 'pulse':
        return {
          animate: { 
            scale: [1, 1.1, 1],
            transition: { 
              repeat: Infinity, 
              duration: 2,
              repeatType: 'loop' as const
            }
          }
        };
      case 'wiggle':
        return {
          animate: { 
            rotate: [0, 5, 0, -5, 0],
            transition: { 
              repeat: Infinity, 
              duration: 1.5,
              repeatType: 'loop' as const
            }
          }
        };
      case 'shake':
        return {
          animate: { 
            x: [0, -3, 0, 3, 0],
            transition: { 
              repeat: Infinity, 
              duration: 0.5,
              repeatType: 'loop' as const
            }
          }
        };
      default:
        return {};
    }
  };
  
  // Generate specific suggestions based on the mood
  const getSuggestions = (): string[] => {
    const score = seoData.score || 0;
    const tags = seoData.tags || {};
    const webVitals = seoData.webVitals;
    const suggestions: string[] = [];
    
    // Title suggestions
    if (!tags.title) {
      suggestions.push('Add a title tag to your page');
    } else if (tags.title.length < 30) {
      suggestions.push('Your title is too short. Aim for 50-60 characters');
    } else if (tags.title.length > 60) {
      suggestions.push('Shorten your title to under 60 characters');
    }
    
    // Description suggestions
    if (!tags.description) {
      suggestions.push('Add a meta description to your page');
    } else if (tags.description.length < 70) {
      suggestions.push('Extend your meta description to 150-160 characters');
    } else if (tags.description.length > 160) {
      suggestions.push('Trim your meta description to under 160 characters');
    }
    
    // Social media tag suggestions
    if (!tags['og:title'] || !tags['og:description'] || !tags['og:image']) {
      suggestions.push('Add Open Graph tags for better social media sharing');
    }
    
    // Performance suggestions
    if (webVitals && webVitals.lcp && webVitals.lcp.status !== 'good') {
      suggestions.push('Improve page loading speed (LCP)');
    }
    
    if (webVitals && webVitals.cls && webVitals.cls.status !== 'good') {
      suggestions.push('Fix layout shifts (CLS) for better user experience');
    }
    
    // Canonical tag suggestion
    if (!tags.canonical) {
      suggestions.push('Add a canonical tag to prevent duplicate content issues');
    }
    
    // Return top 3 suggestions or default suggestions if none are generated
    if (suggestions.length > 0) {
      return suggestions.slice(0, 3);
    }
    
    return ['Keep your content fresh and updated', 'Build quality backlinks', 'Monitor your rankings regularly'];
  };
  
  const topSuggestions = getSuggestions();
  
  return (
    <Card className={`overflow-hidden ${mood.color} text-white shadow-lg`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          SEO Mood Indicator
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-6 py-2">
          <motion.div 
            className="text-5xl sm:text-6xl"
            {...getAnimationProps(mood.animation)}
          >
            {mood.emoji}
          </motion.div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{mood.label}</h3>
            <p className="text-sm opacity-90">{mood.description}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          <h4 className="text-sm font-semibold mb-2">Top Suggestions:</h4>
          <ul className="text-sm space-y-1">
            {topSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-xs bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center">
                  {index + 1}
                </span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}