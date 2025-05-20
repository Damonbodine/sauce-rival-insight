import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalysis, CompetitorAnalysis, CompetitorAttribute } from './useAnalysis';
import { useToast } from '@/components/ui/use-toast';

interface Business {
  id: string;
  description: string;
  keywords: string[] | null;
  business_category: string | null;
  detected_industry: string | null;
}

interface Competitor {
  id: string;
  name: string;
  url: string;
  summary: string | null;
  source_rank: number | null;
  firecrawl_id: string | null;
  crawl_status: string | null;
  crawl_error: string | null;
  crawled_at: string | null;
}

export const useReport = (id: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  
  const { 
    isCrawling, 
    analysisLoading, 
    handleCrawlCompetitors, 
    handleAnalyzeCompetitors,
    parseAnalysisData
  } = useAnalysis(id);

  // Function to retry fetching data with exponential backoff
  const retryFetch = () => {
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying fetch in ${delay}ms (attempt ${retryCount + 1}/3)`);
      
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchData();
      }, delay);
    } else {
      toast({
        title: "Connection issues",
        description: "We're having trouble connecting to the database. Please check your internet connection.",
        variant: "destructive"
      });
    }
  };

  const fetchData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      console.log("Fetching data for business ID:", id);
      
      // Fetch business details
      const { data: businessData, error: businessError } = await supabase
        .from('business_inputs')
        .select('id, description, keywords, business_category, detected_industry')
        .eq('id', id)
        .single();
        
      if (businessError) {
        console.error("Error fetching business data:", businessError);
        throw new Error(`Failed to fetch business data: ${businessError.message}`);
      }
      
      console.log("Business data fetched:", businessData);
      setBusiness(businessData);
      
      // Fetch competitor details with crawl information
      const { data: competitorsData, error: competitorsError } = await supabase
        .from('competitor_sites')
        .select('id, name, url, summary, source_rank, firecrawl_id, crawl_status, crawl_error, crawled_at')
        .eq('business_id', id)
        .order('source_rank', { ascending: false, nullsFirst: false });
        
      if (competitorsError) {
        console.error("Error fetching competitor data:", competitorsError);
        throw new Error(`Failed to fetch competitor data: ${competitorsError.message}`);
      }
      
      console.log(`Competitors fetched: ${competitorsData?.length || 0}`);
      setCompetitors(competitorsData || []);
      
      // Check if there's an existing analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('competitor_analysis')
        .select('*')
        .eq('business_id', id)
        .order('created_at', { ascending: false })
        .maybeSingle();
        
      if (!analysisError && analysisData) {
        console.log("Analysis data found:", analysisData);
        const typedAnalysis = parseAnalysisData(analysisData);
        setAnalysis(typedAnalysis);
      } else if (analysisError) {
        console.log("No analysis found or error:", analysisError);
      }
      
      // Clear any previous errors if successful
      setError(null);
      
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(err instanceof Error ? err.message : "Failed to load report data");
      
      // Attempt to retry the fetch if we have network issues
      if (err instanceof Error && err.message.includes("Failed to fetch")) {
        retryFetch();
      }
    } finally {
      setLoading(false);
    }
  };
    
  useEffect(() => {
    fetchData();
  }, [id]);

  // Ensure retryLoading always returns a Promise<void> with proper generic type
  const retryLoading = async (): Promise<void> => {
    console.log("Retrying data load...");
    setError(null);
    setRetryCount(0);
    try {
      await fetchData();
      console.log("Data load retry completed successfully");
    } catch (err) {
      console.error("Error during data reload:", err);
      throw err; // Re-throw to ensure Promise rejection
    }
  };

  const refreshCompetitors = async () => {
    console.log("Refreshing competitors...");
    try {
      const refreshedData = await handleCrawlCompetitors();
      if (refreshedData) {
        console.log("Competitors refreshed successfully:", refreshedData.length);
        setCompetitors(refreshedData);
        toast({
          title: "Competitor crawl initiated",
          description: "We've started crawling your competitors' websites. This may take a few minutes."
        });
      }
    } catch (err) {
      console.error("Error refreshing competitors:", err);
      toast({
        title: "Error refreshing competitors",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const analyzeCompetitors = async () => {
    console.log("Analyzing competitors...");
    try {
      const analysisResult = await handleAnalyzeCompetitors();
      if (analysisResult) {
        console.log("Analysis completed successfully");
        setAnalysis(analysisResult);
        toast({
          title: "Analysis complete",
          description: "The competitor analysis has been completed successfully."
        });
      }
    } catch (err) {
      console.error("Error analyzing competitors:", err);
      toast({
        title: "Error analyzing competitors",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return {
    loading,
    business,
    competitors,
    analysis,
    error,
    isCrawling,
    analysisLoading,
    refreshCompetitors,
    analyzeCompetitors,
    formatDate,
    retryLoading
  };
};
