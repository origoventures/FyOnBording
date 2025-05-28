import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { MetricStatus } from '@shared/schema';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface WebVitalsGaugeProps {
  value: number;
  status: MetricStatus;
  title: string;
  unit: string;
  description: string;
  thresholds: {
    good: number;
    needsImprovement: number;
  };
}

export function WebVitalsGauge({ 
  value, 
  status, 
  title, 
  unit, 
  description,
  thresholds
}: WebVitalsGaugeProps) {
  const [progress, setProgress] = useState(0);
  
  // Calculate progress based on thresholds and status
  useEffect(() => {
    // Start with 0 and animate to the final value
    setProgress(0);
    
    const timer = setTimeout(() => {
      // For LCP and FID, lower is better, calculate percentage accordingly
      if (title === 'LCP' || title === 'FID/INP') {
        if (value <= thresholds.good) {
          // Good range: 0 to good threshold maps to 66-100%
          const goodPercentage = 100 - ((value / thresholds.good) * 33);
          setProgress(Math.max(67, goodPercentage));
        } else if (value <= thresholds.needsImprovement) {
          // Needs improvement range: good to needsImprovement maps to 33-66%
          const needsImprovementRange = thresholds.needsImprovement - thresholds.good;
          const valueInRange = value - thresholds.good;
          const percentage = 66 - ((valueInRange / needsImprovementRange) * 33);
          setProgress(Math.max(34, percentage));
        } else {
          // Poor range: > needsImprovement maps to 0-33%
          const percentage = 33 * (1 - Math.min(1, (value - thresholds.needsImprovement) / thresholds.needsImprovement));
          setProgress(Math.max(1, percentage));
        }
      } 
      // For CLS, lower is better, but scale is different
      else if (title === 'CLS') {
        if (value <= thresholds.good) {
          // Good range: 0 to good threshold maps to 66-100%
          const goodPercentage = 100 - ((value / thresholds.good) * 33);
          setProgress(Math.max(67, goodPercentage));
        } else if (value <= thresholds.needsImprovement) {
          // Needs improvement range: good to needsImprovement maps to 33-66%
          const needsImprovementRange = thresholds.needsImprovement - thresholds.good;
          const valueInRange = value - thresholds.good;
          const percentage = 66 - ((valueInRange / needsImprovementRange) * 33);
          setProgress(Math.max(34, percentage));
        } else {
          // Poor range: > needsImprovement maps to 0-33%
          const percentage = 33 * (1 - Math.min(1, (value - thresholds.needsImprovement) / thresholds.needsImprovement));
          setProgress(Math.max(1, percentage));
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [value, title, thresholds]);
  
  // Determine the color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'bg-gradient-to-r from-green-500 to-emerald-400';
      case 'needs-improvement':
        return 'bg-gradient-to-r from-yellow-500 to-amber-400';
      case 'poor':
        return 'bg-gradient-to-r from-red-500 to-rose-400';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Format the value for display
  const formatValue = () => {
    if (title === 'CLS') {
      return value.toFixed(2);
    } else if (title === 'LCP') {
      return `${value.toFixed(1)}${unit}`;
    } else {
      return `${Math.round(value)}${unit}`;
    }
  };
  
  // Get the status text
  const getStatusText = () => {
    switch (status) {
      case 'good':
        return 'Good';
      case 'needs-improvement':
        return 'Needs Improvement';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className="flex flex-col items-center p-3 bg-black/20 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-1">
          <h4 className="font-medium text-white text-sm">{title}</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-3 w-3 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs max-w-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className={`
          text-xs font-medium px-2 py-0.5 rounded-full
          ${status === 'good' ? 'bg-green-900/30 text-green-400' : 
            status === 'needs-improvement' ? 'bg-yellow-900/30 text-yellow-400' : 
            'bg-red-900/30 text-red-400'}
        `}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="w-full h-2 mb-3 rounded-full relative bg-gray-800 overflow-hidden">
        {/* Good Zone (66%-100%) */}
        <div className="absolute inset-y-0 right-0 w-1/3 bg-green-950/30" />
        
        {/* Needs Improvement Zone (33%-66%) */}
        <div className="absolute inset-y-0 right-1/3 w-1/3 bg-yellow-950/30" />
        
        {/* Poor Zone (0%-33%) */}
        <div className="absolute inset-y-0 right-2/3 w-1/3 bg-red-950/30" />
        
        {/* Progress bar */}
        <Progress 
          value={progress} 
          className={`h-full ${getStatusColor()}`}
          indicatorClassName="transition-all duration-1000 ease-out"
        />
      </div>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="text-2xl font-bold text-white"
      >
        {formatValue()}
      </motion.div>
      
      <span className="text-xs text-gray-400 mt-1">{description}</span>
    </div>
  );
}