import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SeoData } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Award, Star, CheckCircle, CheckSquare, XCircle, Gift, Trophy, LucideIcon, Share2, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SeoTermTooltip from '@/components/seo-term-tooltip';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'basic' | 'intermediate' | 'advanced';
  difficulty: 1 | 2 | 3; // 1 = easy, 2 = medium, 3 = hard
  points: number;
  completed: boolean;
  autoChecked: boolean;
  term?: string;
}

interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
  icon: LucideIcon;
}

interface SeoHealthChecklistProps {
  seoData: SeoData;
  url: string;
}

export default function SeoHealthChecklist({ seoData, url }: SeoHealthChecklistProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAchievement, setShowAchievement] = useState<boolean>(false);
  const [lastAchievement, setLastAchievement] = useState<{title: string, description: string}>({
    title: '', 
    description: ''
  });
  
  // Effect to generate and evaluate checklist items based on SEO data
  useEffect(() => {
    const generatedCategories = generateChecklistCategories(seoData);
    setCategories(generatedCategories);
  }, [seoData]);
  
  // Calculate total progress
  const getTotalProgress = () => {
    const allItems = categories.flatMap(category => category.items);
    const completedItems = allItems.filter(item => item.completed);
    
    return allItems.length > 0 ? (completedItems.length / allItems.length) * 100 : 0;
  };
  
  // Calculate total points
  const getTotalPoints = () => {
    return categories
      .flatMap(category => category.items)
      .filter(item => item.completed)
      .reduce((total, item) => total + item.points, 0);
  };
  
  // Get rank based on points
  const getRank = (points: number) => {
    if (points >= 100) return { title: 'SEO Master', color: 'text-amber-500' };
    if (points >= 75) return { title: 'SEO Pro', color: 'text-blue-500' };
    if (points >= 50) return { title: 'SEO Specialist', color: 'text-indigo-500' };
    if (points >= 25) return { title: 'SEO Enthusiast', color: 'text-purple-500' };
    return { title: 'SEO Beginner', color: 'text-gray-500' };
  };
  
  // Toggle completion status of a checklist item
  const toggleItem = (categoryId: string, itemId: string) => {
    setCategories(prev => {
      const newCategories = [...prev];
      const categoryIndex = newCategories.findIndex(c => c.id === categoryId);
      
      if (categoryIndex !== -1) {
        const category = newCategories[categoryIndex];
        const itemIndex = category.items.findIndex(i => i.id === itemId);
        
        if (itemIndex !== -1) {
          // If the item is auto-checked, don't allow unchecking
          if (category.items[itemIndex].autoChecked && category.items[itemIndex].completed) {
            toast({
              title: "Auto-verified item",
              description: "This item was automatically verified and can't be unchecked.",
              variant: "default"
            });
            return prev;
          }
          
          // Toggle the completion status
          const newItems = [...category.items];
          const oldStatus = newItems[itemIndex].completed;
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            completed: !oldStatus
          };
          
          newCategories[categoryIndex] = {
            ...category,
            items: newItems
          };
          
          // Show achievement notification if changing to completed
          if (!oldStatus) {
            const newPoints = getTotalPoints() + newItems[itemIndex].points;
            const nextRank = getRank(newPoints);
            const currentRank = getRank(getTotalPoints());
            
            // If this completion grants a new rank
            if (nextRank.title !== currentRank.title) {
              setLastAchievement({
                title: `New Rank: ${nextRank.title}!`,
                description: `You've reached ${newPoints} points and unlocked a new rank!`
              });
              setShowAchievement(true);
              
              setTimeout(() => {
                setShowAchievement(false);
              }, 3000);
            }
          }
          
          return newCategories;
        }
      }
      
      return prev;
    });
  };
  
  // Filter items based on selected category
  const getFilteredItems = () => {
    if (selectedCategory === 'all') {
      return categories.flatMap(category => 
        category.items.map(item => ({ ...item, categoryId: category.id, categoryName: category.name }))
      );
    } else {
      const category = categories.find(c => c.id === selectedCategory);
      if (!category) return [];
      return category.items.map(item => ({ ...item, categoryId: category.id, categoryName: category.name }));
    }
  };
  
  // Reset manual checks
  const resetChecklist = () => {
    setCategories(prev => {
      return prev.map(category => ({
        ...category,
        items: category.items.map(item => ({
          ...item,
          // Only reset items that aren't auto-checked
          completed: item.autoChecked ? item.completed : false
        }))
      }));
    });
    
    toast({
      title: "Checklist Reset",
      description: "Your manual changes have been reset.",
      variant: "default"
    });
  };
  
  // Share progress
  const shareProgress = () => {
    const totalProgress = Math.round(getTotalProgress());
    const totalPoints = getTotalPoints();
    const rank = getRank(totalPoints).title;
    
    const text = `I've completed ${totalProgress}% of my SEO checklist for ${url} with ${totalPoints} points! Current rank: ${rank} 🏆`;
    
    navigator.clipboard.writeText(text);
    
    toast({
      title: "Progress Copied!",
      description: "Share your progress with others by pasting the text.",
      variant: "default"
    });
  };
  
  // Get style based on difficulty level
  const getDifficultyStyle = (difficulty: number) => {
    switch(difficulty) {
      case 3: return 'text-red-500';
      case 2: return 'text-amber-500';
      case 1: default: return 'text-green-500';
    }
  };
  
  // Get difficulty label
  const getDifficultyLabel = (difficulty: number) => {
    switch(difficulty) {
      case 3: return 'Hard';
      case 2: return 'Medium';
      case 1: default: return 'Easy';
    }
  };
  
  // Get points suffix with star icon
  const getPointsDisplay = (points: number) => {
    return (
      <div className="inline-flex items-center">
        <span>{points}</span>
        <Star className="h-3 w-3 ml-0.5 text-yellow-500 fill-yellow-500" />
      </div>
    );
  };

  const totalProgress = getTotalProgress();
  const totalPoints = getTotalPoints();
  const rank = getRank(totalPoints);
  
  return (
    <Card className="shadow-md border-t-4 border-t-indigo-500">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-xl">
              <CheckSquare className="mr-2 h-5 w-5 text-indigo-500" />
              SEO Health Checklist
            </CardTitle>
            <CardDescription>
              Track and improve your SEO score by completing these best practices
            </CardDescription>
          </div>
          <Badge variant="outline" className={`px-2 py-1 ${rank.color} border-current`}>
            {rank.title}
          </Badge>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Overall progress</span>
            <span className="font-medium">{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Points earned: <span className="font-semibold text-indigo-600">{totalPoints}</span>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={resetChecklist}>
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={shareProgress}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="flex-1 whitespace-nowrap">
                <category.icon className="mr-1 h-4 w-4" />
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={selectedCategory} className="mt-0">
            <div className="space-y-3">
              {getFilteredItems().map(item => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-lg transition-colors ${
                    item.completed ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id={item.id} 
                      checked={item.completed}
                      onCheckedChange={() => toggleItem(item.categoryId, item.id)}
                      className={item.completed ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : ''}
                    />
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <label
                          htmlFor={item.id}
                          className="text-sm font-medium cursor-pointer flex items-center"
                        >
                          {item.term ? (
                            <SeoTermTooltip term={item.term}>
                              {item.label}
                            </SeoTermTooltip>
                          ) : (
                            item.label
                          )}
                          
                          {item.autoChecked && (
                            <Badge variant="outline" className="ml-2 text-xs py-0 bg-blue-50 text-blue-700 border-blue-200">
                              Auto-verified
                            </Badge>
                          )}
                        </label>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${getDifficultyStyle(item.difficulty)}`}>
                            {getDifficultyLabel(item.difficulty)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getPointsDisplay(item.points)}
                          </Badge>
                          {selectedCategory === 'all' && (
                            <Badge variant="outline" className="text-xs bg-gray-50">
                              {item.categoryName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {getFilteredItems().length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <XCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No checklist items found for this category.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-gray-500">
          Complete all items to achieve the highest SEO health score
        </div>
        
        <Button variant="default" className="bg-gradient-to-r from-indigo-600 to-blue-500">
          <Trophy className="h-4 w-4 mr-2" />
          View Achievements
        </Button>
      </CardFooter>
      
      {/* Achievement notification popup */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-4 right-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm"
          >
            <div className="flex items-start gap-3">
              <Award className="h-10 w-10 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-lg">{lastAchievement.title}</h4>
                <p className="text-amber-100">{lastAchievement.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Generate checklist categories and items based on SEO data
function generateChecklistCategories(seoData: SeoData): ChecklistCategory[] {
  const tags = seoData?.tags || {};
  const webVitals = seoData?.webVitals;
  const score = seoData?.score || 0;
  
  return [
    {
      id: 'essentials',
      name: 'SEO Essentials',
      icon: CheckCircle,
      items: [
        {
          id: 'title-tag',
          label: 'Implement optimized title tag',
          description: 'Your page title should be 50-60 characters with primary keywords near the beginning.',
          category: 'basic',
          difficulty: 1,
          points: 5,
          completed: !!(tags.title && tags.title.length >= 10 && tags.title.length <= 60),
          autoChecked: true,
          term: 'meta-title'
        },
        {
          id: 'meta-description',
          label: 'Add compelling meta description',
          description: 'Create a 150-160 character description that includes keywords and a call-to-action.',
          category: 'basic',
          difficulty: 1,
          points: 5,
          completed: !!(tags.description && tags.description.length >= 50 && tags.description.length <= 160),
          autoChecked: true,
          term: 'meta-description'
        },
        {
          id: 'header-tags',
          label: 'Use proper header tag hierarchy',
          description: 'Structure your content with H1, H2, and H3 tags in a logical hierarchy.',
          category: 'basic',
          difficulty: 1,
          points: 5,
          completed: false,
          autoChecked: false
        },
        {
          id: 'canonical-tag',
          label: 'Implement canonical tag',
          description: 'Add a canonical tag to prevent duplicate content issues.',
          category: 'basic',
          difficulty: 1,
          points: 3,
          completed: !!tags.canonical || false,
          autoChecked: true,
          term: 'canonical-tag'
        },
        {
          id: 'robot-tags',
          label: 'Review robots meta tag',
          description: 'Ensure robots meta tag allows search engines to index your page.',
          category: 'basic',
          difficulty: 1,
          points: 3,
          completed: !!(tags.robots ? !tags.robots.includes('noindex') : true),
          autoChecked: true,
          term: 'robots-meta'
        }
      ]
    },
    {
      id: 'content',
      name: 'Content',
      icon: BarChart,
      items: [
        {
          id: 'keyword-placement',
          label: 'Place primary keywords strategically',
          description: 'Include target keywords in title, headers, first paragraph, and naturally throughout content.',
          category: 'intermediate',
          difficulty: 2,
          points: 8,
          completed: false,
          autoChecked: false,
          term: 'keyword-density'
        },
        {
          id: 'content-length',
          label: 'Create comprehensive content',
          description: 'Aim for at least 1,000 words for competitive topics to provide in-depth coverage.',
          category: 'intermediate',
          difficulty: 2,
          points: 8,
          completed: false,
          autoChecked: false
        },
        {
          id: 'content-freshness',
          label: 'Keep content updated',
          description: 'Regularly update your content to maintain relevance and accuracy.',
          category: 'intermediate',
          difficulty: 2,
          points: 5,
          completed: false,
          autoChecked: false
        },
        {
          id: 'internal-linking',
          label: 'Implement internal linking strategy',
          description: 'Link to other relevant pages on your site using descriptive anchor text.',
          category: 'intermediate',
          difficulty: 2,
          points: 8,
          completed: false,
          autoChecked: false,
          term: 'internal-linking'
        },
        {
          id: 'alt-tags',
          label: 'Add alt text to all images',
          description: 'Include descriptive alt text containing relevant keywords for all images.',
          category: 'basic',
          difficulty: 1,
          points: 3,
          completed: false,
          autoChecked: false,
          term: 'alt-text'
        }
      ]
    },
    {
      id: 'technical',
      name: 'Technical SEO',
      icon: Gift,
      items: [
        {
          id: 'mobile-friendly',
          label: 'Ensure mobile responsiveness',
          description: 'Your site should look and function well on all devices and screen sizes.',
          category: 'basic',
          difficulty: 2,
          points: 10,
          completed: !!(tags.viewport && tags.viewport.includes('width=device-width')),
          autoChecked: true,
          term: 'mobile-friendly'
        },
        {
          id: 'page-speed',
          label: 'Optimize page loading speed',
          description: 'Aim for Core Web Vitals in the "good" range for better rankings and user experience.',
          category: 'intermediate',
          difficulty: 2,
          points: 10,
          completed: !!(webVitals && webVitals.lcp && webVitals.lcp.status === 'good'),
          autoChecked: true,
          term: 'lcp'
        },
        {
          id: 'structured-data',
          label: 'Implement Schema markup',
          description: 'Add appropriate structured data to help search engines understand your content.',
          category: 'advanced',
          difficulty: 3,
          points: 15,
          completed: false,
          autoChecked: false,
          term: 'structured-data'
        },
        {
          id: 'ssl-security',
          label: 'Use HTTPS encryption',
          description: 'Secure your site with SSL certificate to protect user data and improve rankings.',
          category: 'basic',
          difficulty: 2,
          points: 8,
          completed: false,
          autoChecked: false
        },
        {
          id: 'xml-sitemap',
          label: 'Create and submit XML sitemap',
          description: 'Help search engines discover and index all important pages on your site.',
          category: 'intermediate',
          difficulty: 2,
          points: 8,
          completed: false,
          autoChecked: false
        }
      ]
    },
    {
      id: 'social',
      name: 'Social & UX',
      icon: Share2,
      items: [
        {
          id: 'og-tags',
          label: 'Add Open Graph meta tags',
          description: 'Implement OG tags to control how your content appears when shared on social media.',
          category: 'intermediate',
          difficulty: 2,
          points: 5,
          completed: !!tags['og:title'] && !!tags['og:description'] && !!tags['og:image'],
          autoChecked: true
        },
        {
          id: 'twitter-cards',
          label: 'Configure Twitter Card markup',
          description: 'Add Twitter Card markup to enhance visibility when shared on Twitter.',
          category: 'intermediate',
          difficulty: 2,
          points: 5,
          completed: !!tags['twitter:card'] && !!tags['twitter:title'],
          autoChecked: true
        },
        {
          id: 'social-profiles',
          label: 'Link to social profiles',
          description: 'Include links to your business social profiles for improved brand visibility.',
          category: 'basic',
          difficulty: 1,
          points: 3,
          completed: false,
          autoChecked: false
        },
        {
          id: 'user-experience',
          label: 'Optimize for user experience',
          description: 'Create a clean, intuitive design with easy navigation and minimal interstitials.',
          category: 'advanced',
          difficulty: 3,
          points: 10,
          completed: !!(webVitals && webVitals.cls && webVitals.cls.status === 'good') || false,
          autoChecked: true,
          term: 'cls'
        },
        {
          id: 'rich-snippets',
          label: 'Optimize for rich snippets',
          description: 'Implement schema markup for rich snippets like reviews, FAQs, or product information.',
          category: 'advanced',
          difficulty: 3,
          points: 12,
          completed: false,
          autoChecked: false,
          term: 'rich-snippets'
        }
      ]
    }
  ];
}