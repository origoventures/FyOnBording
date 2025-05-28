import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { SeoData } from '@shared/schema';
import { generatePdf } from '@/lib/pdfGenerator';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  url: string;
  seoData: SeoData;
  className?: string;
}

export default function ExportButton({ url, seoData, className }: ExportButtonProps) {
  const { toast } = useToast();

  const handleExport = async () => {
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
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      <Button
        onClick={handleExport}
        variant="outline"
        className="bg-transparent border-gray-700 hover:bg-gray-800 text-white flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 group"
      >
        <FileDown className="w-5 h-5" />
        <span className="font-medium">Export to PDF</span>
      </Button>
    </motion.div>
  );
}