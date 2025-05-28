import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Settings2 } from "lucide-react";
import { getGoogleTokens } from "@/lib/token-storage";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import GoogleOAuth from "./google-oauth";
import SearchConsoleMetricsCard from "./search-console-metrics";
import AnalyticsMetricsCard from "./analytics-metrics";
import PerformanceBadge from "./performance-badge";
import { SearchConsoleMetrics, PerformanceComparison } from "@shared/schema";

interface GoogleIntegrationsProps {
  url: string;
  titleTag?: string;
  performanceComparison?: PerformanceComparison;
}

export default function GoogleIntegrations({ 
  url, 
  titleTag,
  performanceComparison
}: GoogleIntegrationsProps) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Check if Google account is connected
    const tokens = getGoogleTokens();
    setIsConnected(!!tokens);
  }, []);
  
  const handleConnected = () => {
    setIsConnected(true);
  };
  
  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Google Performance</h2>
          {/* Rimosso pulsante API Test per ragioni di sicurezza */}
        </div>
        {isConnected && titleTag && performanceComparison && (
          <PerformanceBadge 
            comparison={performanceComparison} 
            titleTag={titleTag} 
          />
        )}
      </div>
      
      {!isConnected ? (
        <GoogleOAuth onConnect={handleConnected} />
      ) : (
        <Tabs defaultValue="search-console" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="search-console">Search Console</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search-console" className="mt-0">
            <SearchConsoleMetricsCard url={url} />
            
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="search-console-tips">
                <AccordionTrigger>Search Console Tips</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>
                      <strong>Click-Through Rate (CTR):</strong> A high CTR indicates that your title 
                      and meta description are effective at attracting clicks from search results.
                    </li>
                    <li>
                      <strong>Average Position:</strong> This shows where your page typically ranks in search results. 
                      Positions 1-10 appear on the first page of Google.
                    </li>
                    <li>
                      <strong>Impressions:</strong> The number of times your page appeared in search results.
                      Low impressions could indicate ranking or indexing issues.
                    </li>
                    <li>
                      <strong>Clicks:</strong> The number of times users clicked through to your page from search results.
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-0">
            <AnalyticsMetricsCard url={url} />
            
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="analytics-tips">
                <AccordionTrigger>Analytics Tips</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>
                      <strong>Users:</strong> The number of unique visitors to your page. 
                      Growing this number indicates increasing popularity.
                    </li>
                    <li>
                      <strong>Page Views:</strong> Total number of times your page was viewed. 
                      Higher than users indicates some visitors viewed the page multiple times.
                    </li>
                    <li>
                      <strong>Bounce Rate:</strong> The percentage of visitors who leave without interacting. 
                      Lower rates generally indicate more engaging content.
                    </li>
                    <li>
                      <strong>Avg. Session Duration:</strong> How long visitors spend on your site. 
                      Longer durations usually suggest more engaging content.
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      )}
      
      {isConnected && (
        <Alert className="mt-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Privacy Note</AlertTitle>
          <AlertDescription className="text-blue-700">
            Your Google credentials are encrypted and stored locally in your browser. 
            No data is sent to our servers except when making authorized API requests 
            to Google on your behalf.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}