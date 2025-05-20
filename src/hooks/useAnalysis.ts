
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface CompetitorAttribute {
  id: string;
  name: string;
  url: string;
  attributes: {
    productTypes?: string[];
    pricePoints?: string;
    uniqueSellingPropositions?: string[];
    toneBranding?: string;
    targetCustomer?: string;
    error?: string;
    message?: string;
    raw?: string;
  };
}

export interface CompetitorAnalysis {
  id: string;
  business_id: string;
  attributes_json: CompetitorAttribute[];
  summary_insights: string;
  created_at: string;
}

export const useAnalysis = (businessId: string | undefined) => {
  const [isCrawling, setIsCrawling] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const { toast } = useToast();

  const handleCrawlCompetitors = useCallback(async () => {
    if (!businessId) return;

    setIsCrawling(true);
    
    try {
      toast({
        title: "Starting competitor website crawl",
        description: "This may take a few minutes..."
      });
      
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
        return null;
      }
      
      toast({
        title: "Competitor crawling complete",
        description: crawlData.message
      });
      
      // Return fresh data
      const { data: refreshedData } = await supabase
        .from('competitor_sites')
        .select('id, name, url, summary, source_rank, firecrawl_id, crawl_status, crawl_error, crawled_at')
        .eq('business_id', businessId)
        .order('source_rank', { ascending: false, nullsFirst: false });
        
      return refreshedData || [];
    } catch (error) {
      console.error("Error invoking crawl function:", error);
      toast({
        title: "Error crawling competitors",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCrawling(false);
    }
  }, [businessId, toast]);
  
  const handleAnalyzeCompetitors = useCallback(async () => {
    if (!businessId) return;

    setAnalysisLoading(true);
    
    try {
      toast({
        title: "Starting competitor analysis",
        description: "This may take a few minutes..."
      });
      
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze_competitors', {
        body: { business_input_id: businessId }
      });
      
      if (analysisError) {
        console.error("Error analyzing competitors:", analysisError);
        toast({
          title: "Error analyzing competitors",
          description: analysisError.message,
          variant: "destructive"
        });
        return null;
      }
      
      toast({
        title: "Competitor analysis complete",
        description: `Analyzed ${analysisData.competitorsAnalyzed} competitors successfully.`
      });
      
      // Fetch the newly created analysis
      const { data: newAnalysis, error: fetchError } = await supabase
        .from('competitor_analysis')
        .select('*')
        .eq('id', analysisData.analysisId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching analysis:", fetchError);
        return null;
      } 
      
      if (newAnalysis) {
        // Parse and correctly type the attributes_json field
        const parsedAnalysis = parseAnalysisData(newAnalysis);
        return parsedAnalysis;
      }
      
      return null;
    } catch (error) {
      console.error("Error invoking analysis function:", error);
      toast({
        title: "Error analyzing competitors",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
      return null;
    } finally {
      setAnalysisLoading(false);
    }
  }, [businessId, toast]);

  // Helper function to parse analysis data
  const parseAnalysisData = (analysisData: any): CompetitorAnalysis => {
    // Parse and correctly type the attributes_json field
    let parsedAttributes: CompetitorAttribute[] = [];
    
    try {
      // Check if attributes_json is an array
      if (Array.isArray(analysisData.attributes_json)) {
        parsedAttributes = analysisData.attributes_json.map((item: any) => ({
          id: String(item.id || ''),
          name: String(item.name || ''),
          url: String(item.url || ''),
          attributes: {
            productTypes: Array.isArray(item.attributes?.productTypes) 
              ? item.attributes.productTypes.map(String)
              : [],
            pricePoints: String(item.attributes?.pricePoints || ''),
            uniqueSellingPropositions: Array.isArray(item.attributes?.uniqueSellingPropositions)
              ? item.attributes.uniqueSellingPropositions.map(String)
              : [],
            toneBranding: String(item.attributes?.toneBranding || ''),
            targetCustomer: String(item.attributes?.targetCustomer || ''),
            error: String(item.attributes?.error || ''),
            message: String(item.attributes?.message || '')
          }
        }));
      }
    } catch (e) {
      console.error("Error parsing analysis data:", e);
      // Return empty array if parsing fails
      parsedAttributes = [];
    }
    
    return {
      ...analysisData,
      attributes_json: parsedAttributes
    };
  };
  
  return {
    isCrawling,
    analysisLoading,
    handleCrawlCompetitors,
    handleAnalyzeCompetitors,
    parseAnalysisData
  };
};
