import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, ArrowRight, CheckCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

// Helper function to check if string could be a valid domain
const couldBeDomain = (val: string): boolean => {
  // Basic domain pattern check
  // Matches things like example.com, sub.example.com, example.co.uk
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  
  // Simple check for IP addresses
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  return domainRegex.test(val) || ipRegex.test(val) || val.startsWith('localhost');
};

// Custom URL validation schema with smarter handling
const urlSchema = z.string()
  .min(1, "URL is required")
  .transform((val) => {
    // Trim whitespace
    val = val.trim();
    
    // If URL already has a protocol, leave it as is
    if (val.startsWith('http://') || val.startsWith('https://')) {
      return val;
    }
    
    // Handle cases where user might enter "www.example.com"
    // Add https:// to URLs without protocol
    return `https://${val}`;
  })
  .refine(
    (val) => {
      try {
        // Check if URL is valid after potential transformation
        new URL(val);
        return true;
      } catch (e) {
        // If URL constructor failed, do a more lenient check
        // to see if this could be a domain without protocol
        const withoutProtocol = val.replace(/^https?:\/\//, '');
        return couldBeDomain(withoutProtocol);
      }
    },
    { message: "Please enter a valid URL" }
  );

const formSchema = z.object({
  url: urlSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface UrlFormProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export default function UrlForm({ onAnalyze, isLoading }: UrlFormProps) {
  const [lastValidUrl, setLastValidUrl] = useState("");
  const [displayedUrl, setDisplayedUrl] = useState("");
  const [protocolAdded, setProtocolAdded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  useEffect(() => {
    // Check if form is valid and there's a value
    const value = form.getValues('url');
    const hasNoErrors = Object.keys(form.formState.errors).length === 0;
    
    setIsValid(hasNoErrors && value.length > 0);
  }, [form.formState.errors, form.watch('url')]);

  // Handle real-time preview with protocol addition
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Update the raw input in the form
    form.setValue("url", value);
    
    // Show visual preview of what the URL will be with protocol
    if (value && !value.startsWith("http://") && !value.startsWith("https://")) {
      setDisplayedUrl(`https://${value}`);
      setProtocolAdded(true);
    } else {
      setDisplayedUrl(value);
      setProtocolAdded(false);
    }
    
    // Validate after a short delay to avoid validating on every keystroke
    const timeout = setTimeout(() => {
      form.trigger('url');
    }, 300);
    setTypingTimeout(timeout);
  };

  const handleSubmit = (values: FormValues) => {
    let url = values.url;
    
    // URL should already have https:// from the schema transform
    // but we'll double-check to ensure compatibility
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    setLastValidUrl(url);
    onAnalyze(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="card-fylle mb-8 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#b2f83b] to-[#d1f96d]"></div>
        <CardContent className="pt-8 px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold mb-3 text-[#03071C]">
              Analyze Website <span className="text-fylle-accent bg-clip-text text-transparent bg-gradient-to-r from-[#b2f83b] to-[#d1f96d]">SEO</span>
            </h1>
            <p className="text-white mb-6">Enter any URL to analyze its SEO meta tags and get actionable insights.</p>
          </motion.div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="flex-grow w-full">
                    <div className="relative w-full group">
                      <motion.div 
                        animate={{ 
                          scale: isFocused ? 1.1 : 1,
                          x: isFocused ? -2 : 0
                        }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10"
                      >
                        {isValid && field.value ? (
                          <CheckCircle className="h-5 w-5 text-[#d1f96d]" />
                        ) : (
                          <Globe className={`h-5 w-5 ${isFocused ? 'text-[#d1f96d]' : 'text-gray-400'}`} />
                        )}
                      </motion.div>
                      
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="example.com"
                          className={`pl-10 py-6 w-full input-fylle transition-all duration-300
                            ${isFocused ? 'border-[#d1f96d] shadow-[0_0_0_3px_rgba(209,249,109,0.1)]' : ''}
                            ${isValid && field.value ? 'border-[#d1f96d]' : ''}
                          `}
                          disabled={isLoading}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          onChange={(e) => {
                            field.onChange(e);
                            handleUrlChange(e);
                          }}
                        />
                      </FormControl>
                      
                      <AnimatePresence>
                        {isLoading && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            <Loader2 className="h-5 w-5 animate-spin text-[#d1f96d]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <AnimatePresence>
                      {protocolAdded && displayedUrl && !form.formState.errors.url && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="text-xs text-[#03071C] mt-2 flex items-center bg-[#f9fef0] p-2 rounded-md border border-[#eafcd1]"
                        >
                          <CheckCircle className="h-3 w-3 text-[#d1f96d] mr-1.5" />
                          <span className="font-medium">Will analyze:</span> 
                          <span className="ml-1 font-bold">{displayedUrl}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                      {form.formState.errors.url?.message && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <FormMessage className="mt-2 text-sm" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </FormItem>
                )}
              />
              
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  type="submit" 
                  className="btn-fylle-primary py-6 px-8 sm:whitespace-nowrap sm:self-start rounded-md shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Analyzing...</span>
                    </motion.div>
                  ) : (
                    <motion.div className="flex items-center">
                      <Search className="mr-2 h-4 w-4" />
                      <span>Analyze</span>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
