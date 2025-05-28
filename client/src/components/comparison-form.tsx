import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, X, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// URL validation schema - same as the one in url-form.tsx
const urlSchema = z.string()
  .min(1, "URL is required")
  .transform((val) => {
    // Trim whitespace
    val = val.trim();
    
    // Add protocol if missing
    if (!/^https?:\/\//i.test(val)) {
      return `https://${val}`;
    }
    
    return val;
  })
  .refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: "Please enter a valid URL" }
  );

const comparisonFormSchema = z.object({
  competitors: z.array(urlSchema).min(1).max(3),
});

type FormValues = z.infer<typeof comparisonFormSchema>;

interface ComparisonFormProps {
  primaryUrl: string;
  onCompare: (competitors: string[]) => void;
  isLoading: boolean;
}

export default function ComparisonForm({ primaryUrl, onCompare, isLoading }: ComparisonFormProps) {
  const [competitors, setCompetitors] = useState<string[]>(['']);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(comparisonFormSchema),
    defaultValues: {
      competitors: [''],
    },
  });

  // Reset form when primary URL changes
  useEffect(() => {
    if (primaryUrl) {
      setCompetitors(['']);
      form.reset({ competitors: [''] });
    }
  }, [primaryUrl, form]);

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    const validCompetitors = values.competitors.filter(Boolean);
    onCompare(validCompetitors);
  };

  // Add a new competitor field
  const addCompetitor = () => {
    if (competitors.length < 3) {
      const newCompetitors = [...competitors, ''];
      setCompetitors(newCompetitors);
      form.setValue('competitors', newCompetitors);
    }
  };

  // Remove a competitor field
  const removeCompetitor = (index: number) => {
    if (competitors.length > 1) {
      const newCompetitors = competitors.filter((_, i) => i !== index);
      setCompetitors(newCompetitors);
      form.setValue('competitors', newCompetitors);
    }
  };

  return (
    <Card className="bg-[#13151c] border-gray-700 overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Compare with Competitors</h3>
          <p className="text-gray-400 text-sm">
            Add up to 3 competitor websites to compare SEO metrics.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-3">
              {competitors.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`competitors.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`Competitor URL ${index + 1}`}
                            className="bg-black/30 border-gray-700"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {competitors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCompetitor(index)}
                      disabled={isLoading}
                      className="hover:bg-red-900/30 text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompetitor}
                disabled={competitors.length >= 3 || isLoading}
                className="text-gray-300 border-gray-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Competitor
              </Button>

              <Button 
                type="submit" 
                disabled={isLoading || !form.formState.isValid}
                className="bg-gradient-to-r from-[#d1f96d] to-[#b2be96] hover:opacity-90 text-black font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <BarChart className="mr-2 h-4 w-4" />
                    Compare
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}