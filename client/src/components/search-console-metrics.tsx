import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, BarChart3, Search, MousePointerClick, Eye, Shield } from "lucide-react";
import { SearchConsoleMetrics, PerformanceComparison } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getGoogleTokens, isTokenValid } from "@/lib/token-storage";

interface SearchConsoleMetricsProps {
  url: string;
}

export default function SearchConsoleMetricsCard({ url }: SearchConsoleMetricsProps) {
  const [metrics, setMetrics] = useState<SearchConsoleMetrics | null>(null);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const fetchMetrics = async () => {
      const tokens = getGoogleTokens();
      
      if (!tokens || !isTokenValid()) {
        setError("No valid Google credentials found. Please connect your account first.");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate date range based on period
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
        }
        
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        
        // Fetch Search Console metrics with a timeout
        const response = await apiRequest<{ metrics: SearchConsoleMetrics, comparison: PerformanceComparison }>({
          url: '/api/google/search-console',
          method: 'GET',
          params: {
            url,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            accessToken: tokens.accessToken
          }
        }, undefined, 15000); // 15 second timeout
        
        if (response) {
          setMetrics(response.metrics);
          setComparison(response.comparison);
        }
      } catch (error: any) {
        console.error("Error fetching Search Console metrics:", error);
        
        // Show more specific error messages
        if (error.message?.includes("does not have access")) {
          setError(`${error.message}`);
        } else if (error.message?.includes("timed out")) {
          setError("Request timed out. The Google API is taking too long to respond. Please try again later.");
        } else {
          setError("Failed to fetch Search Console metrics. Please verify that your account has access to this domain in Search Console.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (url) {
      fetchMetrics();
    }
  }, [url, period]);

  // Helper for formatting numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toFixed(0);
    }
  };

  // Helper for formatting percentages
  const formatPercentage = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  // Helper for determining badge color
  const getBadgeColor = (value: number, isPositive: boolean): string => {
    // For position, lower is better, so we invert the logic
    if (!isPositive) value = -value;
    
    if (value > 0) {
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    } else if (value < 0) {
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    } else {
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Helper to render comparison badge
  const renderComparisonBadge = (
    value: number | undefined, 
    isPositive: boolean = true
  ) => {
    if (value === undefined) return null;
    
    const formattedValue = value > 0 
      ? `+${formatPercentage(value)}` 
      : formatPercentage(value);
    
    return (
      <Badge className={`ml-2 ${getBadgeColor(value, isPositive)}`}>
        {value > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
        {formattedValue}
      </Badge>
    );
  };

  // Helper to render metric card
  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    value: string | number,
    comparisonValue?: number,
    isPositive: boolean = true
  ) => {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                {comparisonValue !== undefined && renderComparisonBadge(comparisonValue, isPositive)}
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-20" /> : value}
              </div>
            </div>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render loading state or metrics
  const renderContent = () => {
    if (error) {
      // Se l'errore è relativo alla mancanza di credenziali, mostriamo un pulsante per connettersi
      if (error.includes("No valid Google credentials found")) {
        return (
          <div className="p-6 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-5 mb-4">
              <h3 className="text-blue-700 font-medium text-base mb-2">Connect to Google Search Console</h3>
              <p className="text-blue-600 text-sm mb-4">
                Connect your Google account to view performance metrics from Search Console for this URL.
              </p>
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = "/api-test"}
              >
                <Shield className="mr-2 h-4 w-4" />
                Connect Google Account
              </Button>
            </div>
          </div>
        );
      }
      
      // Per altri tipi di errori, mostriamo il messaggio di errore standard
      return (
        <div className="p-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-700 font-medium text-sm">{error}</p>
            <p className="text-red-600 text-xs mt-2">
              Per accedere ai dati, devi avere un account Google con accesso alla Search Console per questo URL.
            </p>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!metrics) {
      return (
        <div className="p-6 text-center">
          <p>No Search Console data available for this URL.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderMetricCard(
          <Eye className="h-5 w-5" />,
          "Impressions",
          formatNumber(metrics.impressions),
          comparison?.impressionsDifference
        )}
        
        {renderMetricCard(
          <MousePointerClick className="h-5 w-5" />,
          "Clicks",
          formatNumber(metrics.clicks)
        )}
        
        {renderMetricCard(
          <BarChart3 className="h-5 w-5" />,
          "Click-Through Rate",
          `${formatPercentage(metrics.ctr * 100)}`,
          comparison?.ctrDifference
        )}
        
        {renderMetricCard(
          <Search className="h-5 w-5" />,
          "Average Position",
          metrics.position.toFixed(1),
          comparison?.positionDifference,
          false // for position, lower is better
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-3 sm:mb-0">
            <CardTitle className="text-xl font-bold">Search Console Metrics</CardTitle>
            <CardDescription>
              Performance data from Google Search Console
            </CardDescription>
          </div>
          <Tabs defaultValue="30d" value={period} onValueChange={(value) => setPeriod(value as '7d' | '30d' | '90d')}>
            <TabsList className="grid grid-cols-3 w-full sm:w-[180px]">
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
              <TabsTrigger value="90d">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        {renderContent()}
        
        {comparison && metrics && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-muted-foreground">
            {comparison.ctrDifference > 5 && (
              <p className="flex items-center text-green-600">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Your CTR is {formatPercentage(comparison.ctrDifference)} higher than the previous period, which likely indicates your optimized title and meta description are working well.
              </p>
            )}
            {comparison.positionDifference < -0.5 && (
              <p className="flex items-center text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Your position improved by {Math.abs(comparison.positionDifference).toFixed(1)} places compared to the previous period.
              </p>
            )}
            {comparison.positionDifference > 0.5 && (
              <p className="flex items-center text-orange-600 mt-1">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                Your position dropped by {comparison.positionDifference.toFixed(1)} places. Consider optimizing your content for better rankings.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}