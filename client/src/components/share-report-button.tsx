import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Share2, Mail, Copy, Download, Twitter, Linkedin, Lock, ChevronDown } from 'lucide-react';
import { SeoData } from '@shared/schema';
import { motion } from 'framer-motion';
import { generatePdf } from '@/lib/pdfGenerator';

interface ShareReportButtonProps {
  url: string;
  seoData: SeoData;
  userPlan: string;
  isDisabled?: boolean;
}

export default function ShareReportButton({ url, seoData, userPlan, isDisabled = false }: ShareReportButtonProps) {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('link');
  const [emailTo, setEmailTo] = useState('');
  
  // Controlla se l'utente ha un piano che permette la condivisione
  const canShare = ['premium', 'enterprise'].includes(userPlan.toLowerCase());
  
  // Funzione per generare un ID univoco per il report
  const generateReportId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  
  // Funzione per generare l'URL di condivisione
  const generateShareableLink = async () => {
    if (!canShare) {
      toast({
        title: "Funzionalità Premium",
        description: "La condivisione dei report è disponibile solo per i piani Premium ed Enterprise.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Simula una richiesta API per generare un link condivisibile
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const reportId = generateReportId();
      const shareableUrl = `${window.location.origin}/shared-report/${reportId}`;
      
      // In una implementazione reale, qui salveremmo il report nel database
      // await fetch('/api/save-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reportId, url, seoData, expireAt: Date.now() + 1000 * 60 * 60 * 24 * 30 }) // 30 giorni
      // });
      
      setShareUrl(shareableUrl);
      setIsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Non è stato possibile generare il link di condivisione. Riprova più tardi.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Funzione per copiare l'URL negli appunti
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Copiato!",
      description: "Link copiato negli appunti.",
    });
  };
  
  // Funzione per inviare il report via email
  const sendEmail = async () => {
    if (!emailTo) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email valido.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Simula l'invio di un'email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Email inviata!",
        description: `Il report è stato inviato a ${emailTo}.`,
      });
      
      setEmailTo('');
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Non è stato possibile inviare l'email. Riprova più tardi.",
        variant: "destructive"
      });
    }
  };
  
  // Funzione per scaricare il report come PDF
  const downloadReport = async () => {
    try {
      toast({
        title: "Preparazione PDF",
        description: "Stiamo generando il tuo report di analisi SEO...",
      });
      
      // Utilizziamo la funzione corretta per generare il PDF
      await generatePdf(url, seoData);
      
      toast({
        title: "PDF Generato",
        description: "Il tuo report SEO è stato scaricato con successo.",
      });
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error);
      
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la generazione del PDF. Riprova più tardi.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <>
      {canShare ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-transparent border-gray-700 hover:bg-gray-800 text-white flex items-center gap-2 px-4 py-2 rounded-md transition-all" 
              disabled={isGenerating || isDisabled}
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full mr-2"></div>
                  Preparazione...
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                    <span>push sharing</span>
                  </div>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
            <DropdownMenuItem onClick={generateShareableLink} className="hover:bg-gray-700">
              <Copy className="w-4 h-4 mr-2" />
              Copia link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              generateShareableLink();
              setActiveTab('email');
            }} className="hover:bg-gray-700">
              <Mail className="w-4 h-4 mr-2" />
              Invia via email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadReport} className="hover:bg-gray-700">
              <Download className="w-4 h-4 mr-2" />
              Scarica PDF
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=Ho appena analizzato ${url} con il punteggio SEO di ${seoData.score}/100&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="hover:bg-gray-700"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Condividi su Twitter
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="hover:bg-gray-700"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              Condividi su LinkedIn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          variant="outline" 
          className="bg-transparent border-gray-700 hover:bg-gray-800 text-white flex items-center gap-2 px-4 py-2 rounded-md"
          onClick={() => {
            toast({
              title: "Funzionalità Premium",
              description: "La condivisione dei report è disponibile solo per i piani Premium ed Enterprise.",
              variant: "destructive"
            });
          }}
        >
          <Lock className="w-4 h-4 mr-2" />
          push sharing (Premium)
        </Button>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Condividi il report SEO</DialogTitle>
            <DialogDescription>
              Condividi l'analisi SEO di {url} con colleghi o clienti.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Link</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="py-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mt-5">
                <p className="text-sm text-muted-foreground">Condividi direttamente su:</p>
                <div className="mt-2 flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=Ecco l'analisi SEO di ${url}&url=${encodeURIComponent(shareUrl)}`, '_blank')}
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')}
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="email" className="py-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email">Indirizzo email</Label>
                  <Input
                    id="email"
                    placeholder="colleague@example.com"
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                  />
                </div>
                <Button onClick={sendEmail} className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Invia Report
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="sm:justify-start">
            <div className="w-full text-center text-xs text-muted-foreground">
              Il link scadrà tra 30 giorni e può essere visualizzato da chiunque lo possieda.
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}