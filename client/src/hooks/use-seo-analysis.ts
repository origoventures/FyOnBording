import { useState } from "react";
import { SeoData } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

class UsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageLimitError';
  }
}

export function useSeoAnalysis() {
  const [urlParams, setUrlParams] = useState<{ url: string | null, userId?: string | null }>({ url: null });
  const queryClient = useQueryClient();

  // Crea la queryKey in base all'URL e all'ID utente se presente
  const getQueryKey = (url: string, userId?: string | null) => {
    let queryKey = `/api/analyze?url=${encodeURIComponent(url)}`;
    
    if (userId !== undefined && userId !== null) {
      queryKey += `&userId=${userId}`;
    }
    
    return [queryKey];
  };

  const analyzeQuery = useQuery({
    queryKey: urlParams.url ? getQueryKey(urlParams.url, urlParams.userId) : [],
    enabled: !!urlParams.url,
  });

  const analyzeSeo = async (urlToAnalyze: string, userId?: string | null) => {
    // Imposta sia l'URL che l'ID utente
    setUrlParams({ url: urlToAnalyze, userId });
    
    // Invalida la query con i nuovi parametri
    await queryClient.invalidateQueries({ 
      queryKey: getQueryKey(urlToAnalyze, userId) 
    });
    
    return analyzeQuery.data;
  };

  return {
    analyzeSeo,
    seoData: analyzeQuery.data as SeoData | undefined,
    isLoading: analyzeQuery.isLoading,
    error: analyzeQuery.error,
  };
}
