import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle, BarChart4, PieChart as PieChartIcon, Info } from 'lucide-react';
import { TagCounts } from '@shared/schema';

interface SeoScoreVisualizationProps {
  score: number;
  tagCounts: TagCounts;
  categories?: Record<string, {
    score: number;
    good: number;
    warning: number;
    error: number;
  }>;
}

const defaultCategories = {
  'meta-tags': { label: 'Meta Tags', color: '#4f46e5' },
  'content': { label: 'Contenuto', color: '#0ea5e9' },
  'performance': { label: 'Performance', color: '#8b5cf6' },
  'structure': { label: 'Struttura', color: '#ec4899' },
  'images': { label: 'Immagini', color: '#f59e0b' },
  'social': { label: 'Social Media', color: '#10b981' }
};

export default function SeoScoreVisualization({ score, tagCounts, categories }: SeoScoreVisualizationProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [animatedScore, setAnimatedScore] = useState(0);
  
  // Animazione dello score all'avvio
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedScore(prev => {
        if (prev < score) {
          return Math.min(prev + 1, score);
        }
        clearInterval(interval);
        return prev;
      });
    }, 20);
    
    return () => clearInterval(interval);
  }, [score]);
  
  // Genera colori in base al punteggio
  const getScoreColor = (value: number) => {
    if (value >= 80) return '#22c55e'; // Verde
    if (value >= 60) return '#f59e0b'; // Giallo/Arancione
    return '#ef4444'; // Rosso
  };
  
  // Tag counts for Pie Chart
  const tagCountsData = [
    { name: 'Ottimi', value: tagCounts.good, color: '#22c55e' },
    { name: 'Da migliorare', value: tagCounts.warning, color: '#f59e0b' },
    { name: 'Critici', value: tagCounts.error, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Creare dati delle categorie per i grafici a barre
  let categoryScores: any[] = [];
  
  if (categories) {
    categoryScores = Object.entries(categories).map(([key, value]) => ({
      name: defaultCategories[key as keyof typeof defaultCategories]?.label || key,
      score: value.score,
      color: defaultCategories[key as keyof typeof defaultCategories]?.color || '#6b7280'
    })).sort((a, b) => b.score - a.score);
  } else {
    // Dati di esempio se non sono fornite categorie reali
    categoryScores = [
      { name: 'Meta Tags', score: Math.round(score * (tagCounts.good / Math.max(1, tagCounts.good + tagCounts.warning + tagCounts.error))), color: '#4f46e5' },
      { name: 'Performance', score: Math.round(score * 0.9), color: '#8b5cf6' },
      { name: 'Struttura', score: Math.round(score * 0.85), color: '#ec4899' },
      { name: 'Contenuto', score: Math.round(score * 0.8), color: '#0ea5e9' },
      { name: 'Immagini', score: Math.round(score * 0.75), color: '#f59e0b' },
      { name: 'Social Media', score: Math.round(score * 0.7), color: '#10b981' }
    ].sort((a, b) => b.score - a.score);
  }
  
  // Normalizza i punteggi per il grafico radar
  const radarData = categoryScores.map(cat => ({
    subject: cat.name,
    score: cat.score,
    fullMark: 100
  }));
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl font-bold">
          <BarChart4 className="mr-2 h-5 w-5" />
          Visualizzazione Dettagliata del Punteggio SEO
        </CardTitle>
        <CardDescription>
          Analisi interattiva dei componenti che contribuiscono al punteggio SEO complessivo
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              <PieChartIcon className="w-4 h-4 mr-2" />
              Panoramica
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex-1">
              <AlertCircle className="w-4 h-4 mr-2" />
              Status Tag
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1">
              <BarChart4 className="w-4 h-4 mr-2" />
              Categorie
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="relative flex items-center justify-center mb-4">
                  <div 
                    className="relative w-40 h-40 rounded-full flex items-center justify-center"
                    style={{
                      background: `conic-gradient(${getScoreColor(animatedScore)} ${animatedScore}%, #e5e7eb ${animatedScore}%)`,
                    }}
                  >
                    <div className="absolute inset-3 bg-card rounded-full flex items-center justify-center">
                      <span className="text-4xl font-bold">{animatedScore}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-2 mb-6">
                  <p className="text-lg font-medium">Punteggio SEO complessivo</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {score >= 80 ? (
                      <>
                        <CheckCircle className="inline-block h-4 w-4 text-green-500 mr-1" />
                        Ottimo! Il tuo sito è ben ottimizzato per i motori di ricerca.
                      </>
                    ) : score >= 60 ? (
                      <>
                        <AlertTriangle className="inline-block h-4 w-4 text-amber-500 mr-1" />
                        Buono, ma ci sono aree che potrebbero essere migliorate.
                      </>
                    ) : (
                      <>
                        <AlertCircle className="inline-block h-4 w-4 text-red-500 mr-1" />
                        Necessita di miglioramenti significativi per ottimizzare il posizionamento.
                      </>
                    )}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 w-full mt-4">
                  {categoryScores.slice(0, 3).map((category, index) => (
                    <div key={index} className="flex flex-col items-center p-3 rounded-lg bg-card border">
                      <div className="text-sm font-medium">{category.name}</div>
                      <div className="mt-1 text-2xl font-bold" style={{ color: category.color }}>
                        {category.score}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {activeTab === 'tags' && (
              <motion.div 
                key="tags"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagCountsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {tagCountsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Numero di tag']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-green-100 bg-green-50 text-green-700">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-sm font-medium">Ottimi</p>
                    <p className="text-lg font-bold">{tagCounts.good}</p>
                  </div>
                  
                  <div className="p-3 rounded-lg border border-amber-100 bg-amber-50 text-amber-700">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-sm font-medium">Da migliorare</p>
                    <p className="text-lg font-bold">{tagCounts.warning}</p>
                  </div>
                  
                  <div className="p-3 rounded-lg border border-red-100 bg-red-50 text-red-700">
                    <AlertCircle className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-sm font-medium">Critici</p>
                    <p className="text-lg font-bold">{tagCounts.error}</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'categories' && (
              <motion.div 
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-3">
                  {categoryScores.map((category, index) => (
                    <div key={index} className="relative">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm font-bold">{category.score}</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full"
                          style={{ backgroundColor: category.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${category.score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm">
                        Questi punteggi mostrano come le diverse categorie SEO contribuiscono al punteggio complessivo.
                        Concentrarsi sulle categorie con punteggio più basso può portare ai miglioramenti più significativi.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Tabs>
    </Card>
  );
}