import { useState, useEffect } from 'react';
import { Check, AlertTriangle, X, Link2, Clock, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { TagCounts } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import ShareReportButton from './share-report-button';
import ExportButton from './export-button';

interface ResultsSummaryProps {
  url: string;
  seoScore: number;
  tagCounts: TagCounts;
  seoData: any;
  userPlan: string;
  analyzedAt?: Date;
}

export default function NewResultsSummary({ 
  url, 
  seoScore, 
  tagCounts, 
  seoData,
  userPlan,
  analyzedAt = new Date()
}: ResultsSummaryProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedScore(prev => {
        if (prev < seoScore) {
          return Math.min(prev + 1, seoScore);
        }
        clearInterval(interval);
        return prev;
      });
    }, 15);
    
    return () => clearInterval(interval);
  }, [seoScore]);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#CCFF00'; // Verde lime
    if (score >= 60) return '#FFC300'; // Giallo
    return '#FF5252'; // Rosso
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Poor';
  };
  
  const scoreColor = getScoreColor(seoScore);
  const scoreLabel = getScoreLabel(seoScore);
  
  // Calcola larghezza delle barre in percentuale del totale
  const totalTags = tagCounts.good + tagCounts.warning + tagCounts.error;
  const goodPercent = totalTags > 0 ? (tagCounts.good / totalTags) * 100 : 0;
  const warningPercent = totalTags > 0 ? (tagCounts.warning / totalTags) * 100 : 0;
  const errorPercent = totalTags > 0 ? (tagCounts.error / totalTags) * 100 : 0;
  
  return (
    <div className="w-full bg-gray-900 rounded-lg border border-gray-800 p-6 relative overflow-hidden">
      {/* Grid di sfondo */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px' 
        }}
      />
      
      {/* Header con titolo e azioni */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-2xl font-bold text-white">
          SEO Analysis <span className="text-lime-400">Results</span>
        </h2>
        
        <div className="flex space-x-3">
          <ShareReportButton 
            url={url} 
            seoData={seoData} 
            userPlan={userPlan} 
          />
          <ExportButton url={url} seoData={seoData} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Punteggio SEO */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="transparent" 
                stroke="rgba(255, 255, 255, 0.1)" 
                strokeWidth="10" 
              />
              {/* Progress circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="transparent" 
                stroke={scoreColor} 
                strokeWidth="10" 
                strokeDasharray={`${2 * Math.PI * 45 * animatedScore / 100} ${2 * Math.PI * 45}`}
                strokeDashoffset={2 * Math.PI * 45 * 0.25}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-4xl font-bold">{animatedScore}</span>
              <span className="text-sm">Score</span>
            </div>
          </div>
          <div 
            className="mt-2 py-1 px-4 rounded-full text-sm font-medium" 
            style={{ backgroundColor: scoreColor, color: '#111' }}
          >
            {scoreLabel}
          </div>
        </div>
        
        {/* Conteggi con barre */}
        <div className="col-span-3 grid grid-cols-3 gap-4">
          {/* Good Count */}
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Check className="h-5 w-5 text-lime-400 mr-2" />
              <span className="text-white font-medium">Good</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{tagCounts.good}</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-lime-400"
                initial={{ width: 0 }}
                animate={{ width: `${goodPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          
          {/* Warning Count */}
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-400 mr-2" />
              <span className="text-white font-medium">Needs Improve...</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{tagCounts.warning}</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${warningPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          
          {/* Error Count */}
          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <X className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-white font-medium">Missing</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{tagCounts.error}</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-red-400"
                initial={{ width: 0 }}
                animate={{ width: `${errorPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Dettagli aggiuntivi */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
          <div className="flex items-center mb-1 text-gray-400">
            <Link2 className="h-4 w-4 mr-2 text-lime-400" />
            <span className="text-sm">Analyzed URL</span>
          </div>
          <div className="text-white break-all text-sm">
            {url}
          </div>
        </div>
        
        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
          <div className="flex items-center mb-1 text-gray-400">
            <Hash className="h-4 w-4 mr-2 text-lime-400" />
            <span className="text-sm">Meta Tags Found</span>
          </div>
          <div className="text-white text-sm">
            {totalTags} total tags
          </div>
        </div>
        
        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
          <div className="flex items-center mb-1 text-gray-400">
            <Clock className="h-4 w-4 mr-2 text-lime-400" />
            <span className="text-sm">Last Analyzed</span>
          </div>
          <div className="text-white text-sm">
            {analyzedAt.toLocaleDateString()} {analyzedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
          </div>
        </div>
      </div>
      
      {/* Messaggio di scroll */}
      <div className="mt-6 text-center text-gray-400">
        <motion.div
          animate={{ 
            y: [0, 5, 0],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "loop"
          }}
          className="flex items-center justify-center"
        >
          <span>Scroll down for detailed analysis →</span>
        </motion.div>
      </div>
    </div>
  );
}