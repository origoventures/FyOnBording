import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TagCounts, SeoData } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Check, AlertTriangle, X, Link, Tag, Clock, ArrowRight, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import TagStatusIndicator from "./tag-status-indicator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generatePdf } from "@/lib/pdfGenerator";

interface ResultsSummaryProps {
  url: string;
  seoScore: number;
  tagCounts: TagCounts;
  seoData?: SeoData;
}

export default function ResultsSummary({ url, seoScore, tagCounts, seoData }: ResultsSummaryProps) {
  const { toast } = useToast();
  const getScoreBadgeVariant = () => {
    if (seoScore >= 80) return "success";
    if (seoScore >= 50) return "warning";
    return "error";
  };

  const getScoreDescription = () => {
    if (seoScore >= 80) return "Excellent";
    if (seoScore >= 60) return "Good";
    if (seoScore >= 40) return "Needs Improvement";
    return "Poor";
  };

  const getColorBasedOnScore = () => {
    if (seoScore >= 80) return "bg-gradient-to-r from-green-500 to-green-600";
    if (seoScore >= 50) return "bg-gradient-to-r from-yellow-500 to-yellow-600";
    return "bg-gradient-to-r from-red-500 to-red-600";
  };

  const totalTags = Object.keys(tagCounts).reduce(
    (sum, key) => sum + tagCounts[key as keyof TagCounts], 
    0
  );

  const handleExportPdf = async () => {
    if (!seoData) return;
    
    try {
      toast({
        title: "Preparing PDF",
        description: "We're generating your SEO analysis report...",
      });
      
      await generatePdf(url, seoData);
      
      toast({
        title: "Export Complete",
        description: "Your SEO analysis report has been downloaded.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="card-fylle mb-8 overflow-hidden bg-gray-900 relative w-full max-w-full">
      <div className={`h-2 w-full ${getColorBasedOnScore()}`}></div>

      <CardContent className="pt-6 px-3 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Score Circle */}
          <div className="flex flex-col items-center justify-center mx-auto lg:mx-0 mb-6 lg:mb-0">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  className="stroke-gray-200" 
                  cx="50" cy="50" r="40" 
                  strokeWidth="10" 
                  fill="none" 
                />
                <circle 
                  className={`
                    ${seoScore >= 80 ? 'stroke-[#d1f96d]' : seoScore >= 50 ? 'stroke-yellow-500' : 'stroke-red-500'}
                    transition-all duration-1000 ease-in-out
                  `}
                  cx="50" cy="50" r="40" 
                  strokeWidth="10" 
                  fill="none" 
                  strokeLinecap="round"
                  strokeDasharray={`${seoScore * 2.51} 251`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-white">{seoScore}</span>
                <span className="text-xs sm:text-sm text-white">Score</span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <Badge 
                variant={getScoreBadgeVariant()} 
                className="px-3 py-1 font-medium text-xs sm:text-sm"
              >
                {getScoreDescription()}
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full">
            <div className="relative w-full flex justify-between items-center mb-4">
              <div className="flex items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white">SEO Analysis <span className="text-fylle-accent">Results</span></h2>
                {seoData && (
                  <Button 
                    onClick={handleExportPdf}
                    variant="ghost" 
                    size="icon"
                    className="ml-2 text-white hover:text-[#d1f96d] hover:bg-transparent p-1 h-auto"
                    title="Export to PDF"
                    aria-label="Export to PDF"
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="card-fylle p-3 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="flex items-center mb-1">
                  <div className="min-w-8 w-8 h-8 rounded-full bg-[#eafcd1] flex items-center justify-center mr-2">
                    <Check className="h-4 w-4 text-[#03071C]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate">Good</p>
                    <p className="font-bold text-lg text-white">{tagCounts.good}</p>
                  </div>
                </div>
                <Progress value={(tagCounts.good / totalTags) * 100} className="h-1.5 mt-1" indicatorClassName="bg-[#d1f96d]" />
              </div>
              
              <div className="card-fylle p-3 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="flex items-center mb-1">
                  <div className="min-w-8 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate">Needs Improvement</p>
                    <p className="font-bold text-lg text-white">{tagCounts.warning}</p>
                  </div>
                </div>
                <Progress value={(tagCounts.warning / totalTags) * 100} className="h-1.5 mt-1" indicatorClassName="bg-yellow-500" />
              </div>
              
              <div className="card-fylle p-3 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="flex items-center mb-1">
                  <div className="min-w-8 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                    <X className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate">Missing</p>
                    <p className="font-bold text-lg text-white">{tagCounts.error}</p>
                  </div>
                </div>
                <Progress value={(tagCounts.error / totalTags) * 100} className="h-1.5 mt-1" indicatorClassName="bg-red-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-2 sm:mt-4">
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 overflow-hidden">
                <div className="flex items-center mb-1">
                  <Link className="text-[#d1f96d] mr-2 h-3 w-3 flex-shrink-0" />
                  <h3 className="font-semibold text-xs text-white truncate">Analyzed URL</h3>
                </div>
                <p className="text-xs text-white break-words overflow-hidden">{url}</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 overflow-hidden">
                <div className="flex items-center mb-1">
                  <Tag className="text-[#d1f96d] mr-2 h-3 w-3 flex-shrink-0" />
                  <h3 className="font-semibold text-xs text-white truncate">Meta Tags Found</h3>
                </div>
                <p className="text-xs text-white">{totalTags} total tags</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 overflow-hidden">
                <div className="flex items-center mb-1">
                  <Clock className="text-[#d1f96d] mr-2 h-3 w-3 flex-shrink-0" />
                  <h3 className="font-semibold text-xs text-white truncate">Last Analyzed</h3>
                </div>
                <p className="text-xs text-white">{formatDate(new Date())}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 sm:mt-6 text-white font-medium flex items-center justify-center">
          <span className="text-xs sm:text-sm">Scroll down for detailed analysis</span>
          <ArrowRight className="ml-1 h-3 w-3 text-[#d1f96d] animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
