import React, { useState } from 'react';
import { ComparisonData } from '@shared/schema';
import { useComparison } from '@/hooks/use-comparison';
import ComparisonForm from './comparison-form';
import ComparisonChart from './comparison-chart';
import ComparisonSummary from './comparison-summary';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ComparisonProps {
  primaryUrl: string;
}

export default function Comparison({ primaryUrl }: ComparisonProps) {
  const { 
    comparisonData, 
    isLoading, 
    error, 
    compareUrls, 
    resetComparison 
  } = useComparison();

  const handleCompare = (competitorUrls: string[]) => {
    compareUrls(primaryUrl, competitorUrls);
  };

  if (!primaryUrl) {
    return null;
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        <BarChart className="mr-2 h-5 w-5 text-[#d1f96d]" />
        Competitor Analysis
      </h2>

      {!comparisonData && (
        <div className="max-w-xl">
          <ComparisonForm 
            primaryUrl={primaryUrl} 
            onCompare={handleCompare} 
            isLoading={isLoading} 
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to compare websites. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {comparisonData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              Comparing {comparisonData.competitors.length + 1} Websites
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetComparison}
              className="text-gray-300 border-gray-700"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              New Comparison
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComparisonChart 
              categories={comparisonData.categories}
              primaryUrl={primaryUrl}
              competitorUrls={comparisonData.competitors.map(comp => comp.url || '')}
            />
            
            <ComparisonSummary 
              categories={comparisonData.categories}
              primarySite={comparisonData.primary}
              competitorSites={comparisonData.competitors}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}