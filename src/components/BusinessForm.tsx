
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";

const BusinessForm: React.FC = () => {
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crawlCompetitors, setCrawlCompetitors] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Required information missing",
        description: "Please describe your business before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save business information to Supabase
      const keywordsArray = keywords.trim() ? keywords.split(',').map(k => k.trim()) : null;
      
      const { data: businessData, error: businessError } = await supabase
        .from('business_inputs')
        .insert({
          description: description.trim(),
          keywords: keywordsArray
        })
        .select()
        .single();
      
      if (businessError) {
        throw new Error(`Failed to save business information: ${businessError.message}`);
      }
      
      // Trigger the fetch_competitors edge function
      const businessId = businessData.id;
      
      toast({
        title: "Business information saved",
        description: "Fetching competitor information..."
      });
      
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
        // Still redirect to report page even if competitor fetching fails
        navigate(`/report/${businessId}`);
        return;
      }
      
      toast({
        title: "Competitor analysis complete",
        description: `Found ${competitorData.competitors} potential competitors.`
      });
      
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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Describe your business in a few sentences
        </label>
        <Textarea
          id="description"
          placeholder="We create artisanal hot sauces with unique flavor profiles using locally sourced ingredients..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px]"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
          Optional: What keywords would you associate with your business?
        </label>
        <Input
          id="keywords"
          placeholder="artisanal, spicy, organic, small-batch, etc."
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <p className="text-xs text-gray-500">Enter keywords separated by commas</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="crawlCompetitors" 
          checked={crawlCompetitors}
          onCheckedChange={(checked) => setCrawlCompetitors(checked as boolean)}
        />
        <label
          htmlFor="crawlCompetitors"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Also crawl competitor websites (may take longer)
        </label>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-hotSauce-600 hover:bg-hotSauce-700 transition-colors"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Generating..." : "Generate Competitor Report"}
      </Button>
    </form>
  );
};

export default BusinessForm;
