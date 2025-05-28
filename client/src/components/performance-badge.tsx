import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, HelpCircle } from 'lucide-react';
import { SearchConsoleMetrics, PerformanceComparison } from '@shared/schema';

interface PerformanceBadgeProps {
  comparison?: PerformanceComparison;
  titleTag?: string;
}

export default function PerformanceBadge({ comparison, titleTag }: PerformanceBadgeProps) {
  // Return null if no comparison data is available
  if (!comparison || !titleTag) {
    return null;
  }
  
  // Only show badge if CTR difference is significant (above 2% change)
  const showBadge = Math.abs(comparison.ctrDifference) >= 2;
  
  if (!showBadge) {
    return null;
  }
  
  const isPositive = comparison.ctrDifference > 0;
  const absoluteDifference = Math.abs(comparison.ctrDifference).toFixed(1);
  
  const getBadgeColor = () => {
    if (isPositive) {
      return 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600';
    } else {
      return 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600';
    }
  };
  
  const getMessage = () => {
    if (isPositive) {
      if (comparison.ctrDifference > 10) {
        return `Title performing extremely well with +${absoluteDifference}% higher CTR`;
      } else {
        return `+${absoluteDifference}% CTR with current title`;
      }
    } else {
      return `${absoluteDifference}% lower CTR - consider optimizing title`;
    }
  };
  
  const getTooltipMessage = () => {
    if (isPositive) {
      return (
        <div className="max-w-xs">
          <p className="font-medium mb-1">Strong Title Performance</p>
          <p className="text-sm">
            Your title is performing well with a click-through rate {absoluteDifference}% higher 
            than the previous period. The current title appears to be resonating with users.
          </p>
        </div>
      );
    } else {
      return (
        <div className="max-w-xs">
          <p className="font-medium mb-1">Title Optimization Needed</p>
          <p className="text-sm">
            Your title has a {absoluteDifference}% lower click-through rate compared to the previous period.
            Consider testing a new title that includes relevant keywords and creates more curiosity.
          </p>
          <p className="text-sm mt-2">
            Current title: <span className="font-medium">{titleTag}</span>
          </p>
        </div>
      );
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${getBadgeColor()} cursor-pointer px-3 py-1.5`}>
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-sm">{getMessage()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="p-4">
          {getTooltipMessage()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}