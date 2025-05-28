import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, Activity, BarChart, LineChart } from "lucide-react";
import { GA4Metrics } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getGoogleTokens, isTokenValid } from "@/lib/token-storage";

interface AnalyticsMetricsProps {
  url: string;
}

export default function AnalyticsMetricsCard({ url }: AnalyticsMetricsProps) {
  const [metrics, setMetrics] = useState<GA4Metrics | null>(null);
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
      
      if (!tokens.ga4PropertyId) {
        setError("No GA4 Property ID configured. Please reconnect with a valid property ID.");
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
        
        // Fetch GA4 metrics with a timeout
        const response = await apiRequest<GA4Metrics>({
          url: '/api/google/analytics',
          method: 'GET',
          params: {
            url,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            propertyId: tokens.ga4PropertyId,
            accessToken: tokens.accessToken
          }
        }, undefined, 15000); // 15 second timeout
        
        if (response) {
          setMetrics(response);
        }
      } catch (error: any) {
        console.error("Error fetching GA4 metrics:", error);
        
        // Show more specific error messages
        if (error.message?.includes("does not have access")) {
          setError(`${error.message}`);
        } else if (error.message?.includes("timed out")) {
          setError("Request timed out. The Google Analytics API is taking too long to respond. Please try again later.");
        } else {
          setError("Failed to fetch Google Analytics metrics. Please verify your GA4 Property ID and account permissions.");
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
    return (num * 100).toFixed(1) + '%';
  };

  // Helper for formatting time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Helper to render metric card
  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    value: string | number
  ) => {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-20" /> : value}
              </div>
            </div>
            <div className="rounded-full bg-green-100 p-2 text-green-600">
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
      if (error.includes("No valid Google credentials found") || error.includes("No GA4 Property ID configured")) {
        return (
          <div className="p-6 text-center">
            <div className="bg-green-50 border border-green-200 rounded-md p-5 mb-4">
              <h3 className="text-green-700 font-medium text-base mb-2">Connect to Google Analytics</h3>
              <p className="text-green-600 text-sm mb-4">
                Connect your Google account and configure GA4 Property ID to view Analytics metrics for this URL.
              </p>
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => window.location.href = "/api-test"}
              >
                <LineChart className="mr-2 h-4 w-4" />
                Connect Analytics Account
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
              Per accedere ai dati, devi avere un account Google con accesso a Google Analytics 4 per questo URL.
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
          <p>No Google Analytics data available for this URL.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderMetricCard(
          <Users className="h-5 w-5" />,
          "Users",
          formatNumber(metrics.users)
        )}
        
        {renderMetricCard(
          <BarChart className="h-5 w-5" />,
          "Page Views",
          formatNumber(metrics.pageviews)
        )}
        
        {renderMetricCard(
          <Activity className="h-5 w-5" />,
          "Bounce Rate",
          formatPercentage(metrics.bounceRate)
        )}
        
        {renderMetricCard(
          <Clock className="h-5 w-5" />,
          "Avg. Session Duration",
          formatTime(metrics.avgSessionDuration)
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-3 sm:mb-0">
            <CardTitle className="text-xl font-bold">Google Analytics</CardTitle>
            <CardDescription>
              Traffic data from Google Analytics 4
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
      </CardContent>
    </Card>
  );
}