import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2, Zap, ArrowRight, CheckCircle2, Edit, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import SmartTextChecker from './smart-text-checker';

interface QuickFixCardProps {
  fix: {
    id: string;
    title: string;
    description: string;
    implementation: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    impact: 'low' | 'medium' | 'high';
    editable?: boolean;
    textType?: 'metaTitle' | 'metaDescription' | 'ogTitle' | 'ogDescription' | 'twitterTitle' | 'twitterDescription';
  };
  isApplying: boolean;
  isApplied: boolean;
  onApply: (implementation: string) => void;
}

export default function QuickFixCard({ fix, isApplying, isApplied, onApply }: QuickFixCardProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [implementation, setImplementation] = useState(fix.implementation);
  const [editedText, setEditedText] = useState(() => {
    // Estrai il testo dal tag content
    const contentMatch = fix.implementation.match(/content="([^"]+)"/);
    return contentMatch ? contentMatch[1] : '';
  });

  // Aggiorna l'implementazione quando il testo cambia
  useEffect(() => {
    if (fix.editable && editedText) {
      const updatedImplementation = fix.implementation.replace(
        /(content=")([^"]+)(")/,
        `$1${editedText}$3`
      );
      setImplementation(updatedImplementation);
    }
  }, [editedText, fix.implementation, fix.editable]);

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Get difficulty icon
  const getDifficultyDots = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '●○○';
      case 'medium': return '●●○';
      case 'hard': return '●●●';
      default: return '○○○';
    }
  };
  
  // Handle chiusura modalità editing
  const handleCloseEdit = () => {
    // Quando si chiude l'editor, assicuriamoci che l'implementazione conservi il testo modificato
    if (fix.editable) {
      // Aggiorna l'implementazione con il testo modificato
      const updatedImpl = fix.implementation.replace(
        /(content=")([^"]+)(")/,
        `$1${editedText}$3`
      );
      
      // Comunica la modifica al componente parent
      // Anche se non applicheremo più il fix, questa funzione può
      // essere utilizzata per tenere traccia delle modifiche
      onApply(updatedImpl);
    }
    
    // Disattiva la modalità editing
    setEditMode(false);
  };

  return (
    <Card className="h-full border-l-4 shadow-sm transition-all hover:shadow-md" 
          style={{ borderLeftColor: fix.impact === 'high' ? '#dc2626' : fix.impact === 'medium' ? '#d97706' : '#2563eb' }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{fix.title}</CardTitle>
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(fix.impact)} bg-opacity-10`}>
              <Zap className="h-3 w-3 mr-1" />
              {fix.impact.charAt(0).toUpperCase() + fix.impact.slice(1)} Impact
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Difficoltà: <span className="font-mono">{getDifficultyDots(fix.difficulty)}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">{fix.description}</p>
        
        {fix.editable && editMode ? (
          // Modalità modifica con Smart Text Check
          <div className="mb-3">
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="edit" className="text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Editor Testo
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs">
                  <Code className="h-3 w-3 mr-1" />
                  Codice HTML
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-0">
                <SmartTextChecker
                  text={editedText}
                  textType={fix.textType || 'metaDescription'}
                  onChange={setEditedText}
                  keywords={['seo', 'ottimizzazione', 'marketing', 'ricerca']} // Keywords di esempio
                />
              </TabsContent>
              <TabsContent value="code" className="mt-0">
                <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                  {implementation}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // Visualizzazione normale del codice
          <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700 overflow-x-auto">
            {implementation}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2">
        <div className="flex justify-between w-full">
          {fix.editable && (
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1"
              onClick={() => editMode ? handleCloseEdit() : setEditMode(true)}
              disabled={isApplied}
            >
              {editMode ? (
                <>Chiudi Editor</>
              ) : (
                <><Edit className="h-3 w-3" /> Modifica Testo</>
              )}
            </Button>
          )}
          
          <Button 
            onClick={() => {
              // Assicurati di utilizzare sempre l'implementazione più aggiornata
              // che contiene il testo modificato anche se non sei in modalità editing
              navigator.clipboard.writeText(implementation);
              toast({
                title: "Codice copiato",
                description: "Il codice è stato copiato negli appunti",
              });
            }}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Copia Codice
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}