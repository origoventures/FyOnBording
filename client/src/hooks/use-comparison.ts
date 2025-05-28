import { useState } from "react";
import { ComparisonData, SeoData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useComparison() {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Function to analyze and compare websites
  const compareUrls = async (primaryUrl: string, competitorUrls: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure we have only up to 3 competitor URLs
      const limitedCompetitors = competitorUrls.filter(Boolean).slice(0, 3);
      
      // Build the comparison request URL
      const url = `/api/compare?primary=${encodeURIComponent(primaryUrl)}&competitors=${limitedCompetitors.map(url => encodeURIComponent(url)).join(',')}`;
      
      // Make the request
      const result = await apiRequest<ComparisonData>(url);
      
      // Update state with the comparison data
      setComparisonData(result);
    } catch (err) {
      console.error('Error comparing URLs:', err);
      setError(err instanceof Error ? err : new Error('Failed to compare websites'));
      toast({
        title: "Comparison Error",
        description: "There was a problem comparing the websites. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset comparison data
  const resetComparison = () => {
    setComparisonData(null);
    setError(null);
  };

  return {
    comparisonData,
    isLoading,
    error,
    compareUrls,
    resetComparison
  };
}