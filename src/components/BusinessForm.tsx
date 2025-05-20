import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Loader2, LinkIcon, PencilIcon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Revise our form validation schema to ensure at least one field is filled
const formSchema = z.object({
  description: z.string().min(1, "Business description is required for manual input").optional(),
  keywords: z.string().optional(),
  websiteUrl: z.string().url("Please enter a valid URL").optional(),
  crawlCompetitors: z.boolean().default(false),
}).refine((data) => {
  // For manual tab, description is required
  if (!data.websiteUrl) {
    return !!data.description && data.description.trim().length > 0;
  }
  // For URL tab, websiteUrl is required (already validated by z.string().url())
  return true;
}, {
  message: "Please provide a business description when using manual input",
  path: ["description"]
});

type FormValues = z.infer<typeof formSchema>;

const BusinessForm: React.FC = () => {
  const [inputMode, setInputMode] = useState<'manual' | 'url'>('manual');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      keywords: '',
      websiteUrl: '',
      crawlCompetitors: false
    }
  });

  const onTabChange = (value: string) => {
    setInputMode(value as 'manual' | 'url');
    // Clear errors when switching tabs
    if (value === 'manual') {
      form.clearErrors('websiteUrl');
    } else {
      form.clearErrors('description');
    }
    
    // Reset form values based on selected tab
    if (value === 'manual') {
      form.setValue('websiteUrl', '');
    } else {
      form.setValue('description', '');
    }
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // Add debugging
      console.log("Form submitted with values:", values);
      
      setIsSubmitting(true);
      
      // Validate based on input mode
      if (inputMode === 'manual' && (!values.description || values.description.trim() === '')) {
        toast({
          title: "Error",
          description: "Please provide a business description",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      if (inputMode === 'url' && (!values.websiteUrl || values.websiteUrl.trim() === '')) {
        toast({
          title: "Error",
          description: "Please provide a website URL",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Prepare data for submission
      const description = values.description?.trim() || '';
      const keywordsArray = values.keywords?.trim() 
        ? values.keywords.split(',').map(k => k.trim()) 
        : null;
      const websiteUrl = values.websiteUrl?.trim() || null;
      const crawlCompetitors = values.crawlCompetitors;
      
      console.log("Prepared data:", { description, keywordsArray, websiteUrl });
      
      // Save initial business information to Supabase
      const { data: businessData, error: businessError } = await supabase
        .from('business_inputs')
        .insert({
          description: description,
          keywords: keywordsArray,
          website_url: websiteUrl
        })
        .select()
        .single();
      
      if (businessError) {
        console.error("Business save error:", businessError);
        throw new Error(`Failed to save business information: ${businessError.message}`);
      }
      
      console.log("Business data saved:", businessData);
      const businessId = businessData.id;
      console.log("Inserted business id →", businessId); // Added as suggested for debugging
      
      // If URL mode is selected and we have a URL, analyze the website
      if (inputMode === 'url' && websiteUrl) {
        setIsAnalyzing(true);
        toast({
          title: "Analyzing website...",
          description: "Please wait while we crawl and analyze your website."
        });

        try {
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze_business_website', {
            body: { 
              businessId: businessId,
              url: websiteUrl 
            }
          });

          if (analysisError) {
            console.error("Error analyzing website:", analysisError);
            toast({
              title: "Website analysis failed",
              description: analysisError.message,
              variant: "destructive"
            });
          } else if (analysisData.error) {
            console.error("Error from analysis function:", analysisData.error);
            toast({
              title: "Website analysis failed",
              description: analysisData.error,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Website analysis complete",
              description: "We've successfully analyzed your website."
            });

            // Update form values with the generated content
            form.setValue('description', analysisData.description);
            if (analysisData.keywords && analysisData.keywords.length > 0) {
              form.setValue('keywords', analysisData.keywords.join(', '));
            }
          }
        } catch (error) {
          console.error("Error invoking analyze function:", error);
          toast({
            title: "Error analyzing website",
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive"
          });
        } finally {
          setIsAnalyzing(false);
        }
      }
      
      // Fetch competitors
      toast({
        title: "Business information saved",
        description: "Fetching competitor information..."
      });
      
      try {
        const { data: competitorData, error: competitorError } = await supabase.functions.invoke('fetch_competitors', {
          body: { business_input_id: businessId }
        });
        
        if (competitorError) {
          console.error("Error fetching competitors:", competitorError);
          toast({
            title: "Error fetching competitors",
            description: competitorError.message,
            variant: "destructive"
          });
          navigate(`/report/${businessId}`);
          return;
        }
        
        console.log("Competitor data fetched:", competitorData);
        
        toast({
          title: "Competitor analysis complete",
          description: `Found ${competitorData.competitors} potential competitors.`
        });
      } catch (fetchErr) {
        console.error("Error invoking fetch_competitors function:", fetchErr);
        toast({
          title: "Error fetching competitors",
          description: fetchErr instanceof Error ? fetchErr.message : "Failed to fetch competitors",
          variant: "destructive"
        });
      }
      
      // If crawlCompetitors is checked, also trigger the crawl_competitors function
      if (crawlCompetitors) {
        toast({
          title: "Starting competitor website crawl",
          description: "This may take a few minutes..."
        });
        
        try {
          const { data: crawlData, error: crawlError } = await supabase.functions.invoke('crawl_competitors', {
            body: { business_input_id: businessId }
          });
          
          if (crawlError) {
            console.error("Error crawling competitors:", crawlError);
            toast({
              title: "Error crawling competitors",
              description: crawlError.message,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Competitor crawling initiated",
              description: crawlData.message
            });
          }
        } catch (crawlError) {
          console.error("Error invoking crawl function:", crawlError);
        }
      }
      
      // Redirect to the report page
      navigate(`/report/${businessId}`);

    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error submitting form",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="manual" onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <PencilIcon className="h-4 w-4" />
            Manual Input
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Website URL
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <TabsContent value="manual">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe your business in a few sentences</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="We provide innovative solutions with a focus on quality and customer satisfaction..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="url">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter your business website URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://yourbusiness.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        We'll analyze your website to generate a description and keywords
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {isAnalyzing && (
                  <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-100 rounded-md">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                    <p className="text-sm text-blue-700">Analyzing your website...</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Common fields for both tabs */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optional: What keywords would you associate with your business?</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="quality, affordable, innovative, customer-focused, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter keywords separated by commas
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="crawlCompetitors"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Also crawl competitor websites (may take longer)
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={isSubmitting || isAnalyzing}
              >
                {isSubmitting ? "Generating..." : "Generate Competitor Report"}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default BusinessForm;
