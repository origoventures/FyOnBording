import React, { useState } from 'react';
import { ComparisonCategory } from '@shared/schema';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ComparisonChartProps {
  categories: ComparisonCategory[];
  primaryUrl: string;
  competitorUrls: string[];
}

// Custom colors for the websites in the radar chart
const COLORS = ['#d1f96d', '#ff7edb', '#00b3e6', '#ffb700'];

// Function to format URLs for display
const formatUrl = (url: string): string => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
};

export default function ComparisonChart({ categories, primaryUrl, competitorUrls }: ComparisonChartProps) {
  const [activeTab, setActiveTab] = useState('overall');
  
  // Format the data for the radar chart
  const formatDataForRadar = () => {
    // If the active tab is 'overall', show all categories
    if (activeTab === 'overall') {
      return categories.map(category => {
        const dataPoint: any = {
          subject: category.name,
        };
        
        // Add the scores for each website
        dataPoint[formatUrl(primaryUrl)] = category.scores[0];
        
        competitorUrls.forEach((url, index) => {
          if (category.scores[index + 1] !== undefined) {
            dataPoint[formatUrl(url)] = category.scores[index + 1];
          }
        });
        
        return dataPoint;
      });
    } 
    // Otherwise, show the detailed breakdown for a specific category
    else {
      const category = categories.find(c => c.key === activeTab);
      if (!category) return [];
      
      // For a specific category, we'll create dummy subcategories to show in the radar
      // In a real app, you would have actual subcategory data
      const subCategories = [
        { name: 'Implementation', weights: [1, 0.9, 0.8, 0.7] },
        { name: 'Best Practices', weights: [0.9, 1, 0.85, 0.75] },
        { name: 'Completeness', weights: [0.95, 0.85, 1, 0.9] },
        { name: 'Optimization', weights: [0.85, 0.9, 0.95, 1] }
      ];
      
      return subCategories.map(subCat => {
        const dataPoint: any = {
          subject: subCat.name,
        };
        
        // Add scores for each website, weighted by the subcategory
        dataPoint[formatUrl(primaryUrl)] = Math.round(category.scores[0] * subCat.weights[0]);
        
        competitorUrls.forEach((url, index) => {
          if (category.scores[index + 1] !== undefined) {
            dataPoint[formatUrl(url)] = Math.round(category.scores[index + 1] * subCat.weights[index + 1]);
          }
        });
        
        return dataPoint;
      });
    }
  };
  
  const radarData = formatDataForRadar();
  const websites = [primaryUrl, ...competitorUrls].map(formatUrl);
  
  return (
    <Card className="bg-[#13151c] border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">SEO Comparison</CardTitle>
        <CardDescription className="text-gray-400">
          Compare SEO metrics across multiple websites
        </CardDescription>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="bg-black/30 border border-gray-700">
            <TabsTrigger 
              value="overall" 
              className="data-[state=active]:bg-[#d1f96d] data-[state=active]:text-black"
            >
              Overall Score
            </TabsTrigger>
            {categories.filter(c => c.key !== 'overall').map(category => (
              <TabsTrigger 
                key={category.key} 
                value={category.key}
                className="data-[state=active]:bg-[#d1f96d] data-[state=active]:text-black"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#444" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#bbb' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#bbb' }} />
              
              {websites.map((site, index) => (
                <Radar
                  key={site}
                  name={site}
                  dataKey={site}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.2}
                />
              ))}
              
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#555', borderRadius: '6px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              
              <Legend
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: string) => <span style={{ color: '#fff' }}>{value}</span>}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}