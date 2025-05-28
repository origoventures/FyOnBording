import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClarityAnalysis } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, MessageCircle, Eye, ChevronLeft, ChevronRight, Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CommunicationClarityProps {
  url: string;
  isPremium?: boolean;
}

export default function CommunicationClarity({ url, isPremium = false }: CommunicationClarityProps) {
  const [clarityData, setClarityData] = useState<ClarityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const { toast } = useToast();
  
  // Helper to determine color based on confidence/priority level
  const getLevelColor = (level: 'high' | 'medium' | 'low') => {
    switch(level) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    }
  };
  
  // Use a mock analysis for development/demo purposes
  const getMockClarityAnalysis = (): ClarityAnalysis => {
    return {
      perceivedPurpose: {
        description: `This website appears to be a corporate website for a professional services company, focusing on technology consulting, innovation, and business transformation services.`,
        confidenceLevel: "high",
        keyTerms: ["consulting", "technology", "innovation", "services", "business"]
      },
      clarityAssessment: {
        score: 8,
        strengths: [
          "Clear and professional visual presentation",
          "Well-structured navigation and information hierarchy",
          "Strong emphasis on expertise and service offerings",
          "Consistent brand messaging throughout"
        ],
        weaknesses: [
          "Some technical jargon might confuse non-specialist visitors",
          "Value proposition could be more clearly articulated above the fold"
        ],
        overallVerdict: "The website communicates professionally with strong clarity, but could improve accessibility for non-technical audiences."
      },
      improvementSuggestions: {
        copywriting: [
          "Add simplified explanations alongside technical terms",
          "Include more concrete examples of client outcomes",
          "Strengthen the unique value proposition statement"
        ],
        structure: [
          "Consider a more prominent call-to-action on the homepage",
          "Streamline the path to contact/inquiry pages",
          "Group related services more intuitively"
        ],
        emphasis: [
          "Highlight client success stories more prominently",
          "Emphasize measurable results and benefits",
          "Showcase team expertise and credentials"
        ],
        priority: "medium"
      }
    };
  };

  // Fetch clarity analysis
  useEffect(() => {
    if (!url) return;
    
    const fetchClarityAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);
                
        console.log("Fetching clarity analysis for URL:", url);
        const response = await fetch(`/api/clarity-analysis?url=${encodeURIComponent(url)}`);
        
        // Check content type to avoid parsing HTML as JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        if (!response.ok) {
          if (isJson) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch clarity analysis');
          } else {
            const text = await response.text();
            console.error("Non-JSON error response:", text.substring(0, 150) + '...');
            throw new Error('Server returned an invalid response format');
          }
        }
        
        if (!isJson) {
          const text = await response.text();
          console.error("Response is not JSON:", text.substring(0, 150) + '...');
          throw new Error('Server returned an invalid response format');
        }
        
        const data = await response.json();
        console.log("Received clarity analysis data:", data);
        
        // Use fallback data if no clarity analysis is returned
        if (!data.clarityAnalysis) {
          console.error("No clarity analysis in response:", data);
          throw new Error('No clarity analysis data returned from server');
        }
        
        setClarityData(data.clarityAnalysis);
      } catch (err) {
        console.error('Error fetching clarity analysis:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: err instanceof Error 
            ? err.message 
            : "Failed to analyze communication clarity. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if user has premium access
    if (isPremium) {
      console.log("User has premium access, fetching clarity analysis");
      fetchClarityAnalysis();
    } else {
      console.log("User does not have premium access");
    }
  }, [url, isPremium, toast]);
  
  // Navigate between cards
  const nextCard = () => setActiveCard((prev) => (prev === 2 ? 0 : prev + 1));
  const prevCard = () => setActiveCard((prev) => (prev === 0 ? 2 : prev - 1));
  
  // If user doesn't have Enterprise plan access, show upgrade prompt
  if (!isPremium) {
    return (
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Communication Analysis
          </CardTitle>
          <CardDescription className="text-gray-100">
            Get AI-powered insights about how your website communicates with visitors
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <div className="mb-4">
            <Brain className="h-16 w-16 mx-auto text-indigo-500 mb-3" />
            <h3 className="text-xl font-semibold">Unlock AI Communication Analysis</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Upgrade to our premium plan to access AI-powered analysis of how clearly your website communicates its purpose.
            </p>
          </div>
          <Button 
            className="mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            onClick={() => window.location.href = '/plans'}
          >
            Upgrade to Premium <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Communication Analysis
          </CardTitle>
          <CardDescription className="text-gray-100">
            Analyzing how your website communicates with visitors...
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-20 w-full mt-4" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800">
        <CardHeader className="bg-gradient-to-r from-red-500 to-orange-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Communication Analysis Failed
          </CardTitle>
          <CardDescription className="text-gray-100">
            We were unable to analyze your website's communication clarity
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {error}
          </p>
          <Button 
            className="mt-4"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // If data is loaded, show the card carousel
  if (!clarityData) return null;
  
  const cards = [
    // Card 1: Perceived Purpose
    <Card key="perceived-purpose" className="h-full">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          How AI Interprets Your Website
        </CardTitle>
        <CardDescription className="text-gray-100">
          An AI's understanding of your website's purpose and message
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4">
          <Badge className={`${getLevelColor(clarityData.perceivedPurpose.confidenceLevel)} mb-2`}>
            {clarityData.perceivedPurpose.confidenceLevel.charAt(0).toUpperCase() + clarityData.perceivedPurpose.confidenceLevel.slice(1)} Confidence
          </Badge>
          <p className="text-lg font-medium mt-2">
            {clarityData.perceivedPurpose.description}
          </p>
        </div>
        
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Key Terms Detected</h4>
          <div className="flex flex-wrap gap-2">
            {clarityData.perceivedPurpose.keyTerms.map((term, index) => (
              <Badge key={index} variant="outline" className="bg-gray-100 dark:bg-gray-800">
                {term}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>,
    
    // Card 2: Clarity Assessment
    <Card key="clarity-assessment" className="h-full">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Clarity & Message Evaluation
        </CardTitle>
        <CardDescription className="text-gray-100">
          How effective your website is at communicating its core message
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="relative w-20 h-20 mr-4">
            <div className="w-20 h-20 rounded-full border-4 border-gray-200 flex items-center justify-center">
              <span className="text-2xl font-bold">
                {clarityData.clarityAssessment.score}/10
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-medium">Clarity Score</h4>
            <p className="text-gray-500 dark:text-gray-400">
              {clarityData.clarityAssessment.score >= 8 ? 'Excellent' : 
               clarityData.clarityAssessment.score >= 6 ? 'Good' : 
               clarityData.clarityAssessment.score >= 4 ? 'Fair' : 'Needs Work'}
            </p>
          </div>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 italic mb-4">
          "{clarityData.clarityAssessment.overallVerdict}"
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="text-sm font-semibold text-green-500 uppercase mb-2">Strengths</h4>
            <ul className="list-disc pl-5 space-y-1">
              {clarityData.clarityAssessment.strengths.map((strength, index) => (
                <li key={index} className="text-sm">{strength}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-red-500 uppercase mb-2">Weaknesses</h4>
            <ul className="list-disc pl-5 space-y-1">
              {clarityData.clarityAssessment.weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm">{weakness}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>,
    
    // Card 3: Improvement Suggestions
    <Card key="improvement-suggestions" className="h-full">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Suggestions to Improve Communication
        </CardTitle>
        <CardDescription className="text-gray-100">
          Recommendations to enhance your website's messaging and clarity
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4">
          <Badge className={`${getLevelColor(clarityData.improvementSuggestions.priority)} mb-3`}>
            {clarityData.improvementSuggestions.priority.charAt(0).toUpperCase() + clarityData.improvementSuggestions.priority.slice(1)} Priority
          </Badge>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-blue-500 uppercase mb-2">Copywriting Improvements</h4>
            <ul className="list-disc pl-5 space-y-2">
              {clarityData.improvementSuggestions.copywriting.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-purple-500 uppercase mb-2">Structural Changes</h4>
            <ul className="list-disc pl-5 space-y-2">
              {clarityData.improvementSuggestions.structure.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-green-500 uppercase mb-2">Elements to Emphasize</h4>
            <ul className="list-disc pl-5 space-y-2">
              {clarityData.improvementSuggestions.emphasis.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  ];
  
  // Define animations
  const cardVariants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 500 : -500,
        opacity: 0
      };
    },
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        x: direction < 0 ? 500 : -500,
        opacity: 0
      };
    }
  };
  
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">How LLMs Understand Your Site</h2>
          <p className="text-sm text-gray-400 mt-1">A Communication Clarity Analysis powered by AI</p>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={prevCard}
            className="rounded-full p-2 h-auto"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={nextCard}
            className="rounded-full p-2 h-auto"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="relative h-[500px] overflow-hidden">
        <motion.div
          key={activeCard}
          custom={activeCard}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute w-full h-full"
        >
          {cards[activeCard]}
        </motion.div>
      </div>
      
      <div className="flex justify-center mt-4 space-x-2">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => setActiveCard(index)}
            className={`w-3 h-3 rounded-full ${
              activeCard === index ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}