import React from 'react';
import { CoreWebVitalsData } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Laptop, MousePointer, Layers, InfoIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { WebVitalsGauge } from './web-vitals-gauge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';

interface CoreWebVitalsProps {
  data: CoreWebVitalsData;
}

export default function CoreWebVitals({ data }: CoreWebVitalsProps) {
  return (
    <Card className="bg-[#13151c] border-gray-700 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-white">Core Web Vitals</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <p>Core Web Vitals are a set of metrics that measure real-world user experience for loading performance, interactivity, and visual stability.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge variant="outline" className="border-gray-600 text-xs text-gray-300">
            {formatDate(data.fetchTime)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WebVitalsGauge
            value={data.lcp.value}
            status={data.lcp.status}
            title="LCP"
            unit="s"
            description="Largest Contentful Paint"
            thresholds={{ good: 2.5, needsImprovement: 4.0 }}
          />
          
          <WebVitalsGauge
            value={data.fid.value}
            status={data.fid.status}
            title="FID/INP"
            unit="ms"
            description="Interaction to Next Paint"
            thresholds={{ good: 100, needsImprovement: 300 }}
          />
          
          <WebVitalsGauge
            value={data.cls.value}
            status={data.cls.status}
            title="CLS"
            unit=""
            description="Cumulative Layout Shift"
            thresholds={{ good: 0.1, needsImprovement: 0.25 }}
          />
        </div>
        
        <Separator className="my-4 bg-gray-700" />
        
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 pt-1">
              <Laptop className="h-4 w-4 text-blue-400" />
            </span>
            <div>
              <h4 className="text-sm font-medium text-white">Largest Contentful Paint (LCP)</h4>
              <p className="text-xs text-gray-400">{data.lcp.description}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 pt-1">
              <MousePointer className="h-4 w-4 text-purple-400" />
            </span>
            <div>
              <h4 className="text-sm font-medium text-white">First Input Delay (FID) / INP</h4>
              <p className="text-xs text-gray-400">{data.fid.description}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 pt-1">
              <Layers className="h-4 w-4 text-amber-400" />
            </span>
            <div>
              <h4 className="text-sm font-medium text-white">Cumulative Layout Shift (CLS)</h4>
              <p className="text-xs text-gray-400">{data.cls.description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}