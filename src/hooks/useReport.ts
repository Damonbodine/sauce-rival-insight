
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalysis, CompetitorAnalysis, CompetitorAttribute } from './useAnalysis';

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
  
  const { 
    isCrawling, 
    analysisLoading, 
    handleCrawlCompetitors, 
    handleAnalyzeCompetitors,
    parseAnalysisData
  } = useAnalysis(id);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch business details
        const { data: businessData, error: businessError } = await supabase
          .from('business_inputs')
          .select('id, description, keywords, business_category, detected_industry')
          .eq('id', id)
          .single();
          
        if (businessError) {
          throw new Error(`Failed to fetch business data: ${businessError.message}`);
        }
        
        setBusiness(businessData);
        
        // Fetch competitor details with crawl information
        const { data: competitorsData, error: competitorsError } = await supabase
          .from('competitor_sites')
          .select('id, name, url, summary, source_rank, firecrawl_id, crawl_status, crawl_error, crawled_at')
          .eq('business_id', id)
          .order('source_rank', { ascending: false, nullsFirst: false });
          
        if (competitorsError) {
          throw new Error(`Failed to fetch competitor data: ${competitorsError.message}`);
        }
        
        setCompetitors(competitorsData || []);
        
        // Check if there's an existing analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('competitor_analysis')
          .select('*')
          .eq('business_id', id)
          .order('created_at', { ascending: false })
          .maybeSingle();
          
        if (!analysisError && analysisData) {
          const typedAnalysis = parseAnalysisData(analysisData);
          setAnalysis(typedAnalysis);
        }
        
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError(err instanceof Error ? err.message : "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, parseAnalysisData]);

  const refreshCompetitors = async () => {
    const refreshedData = await handleCrawlCompetitors();
    if (refreshedData) {
      setCompetitors(refreshedData);
    }
  };

  const analyzeCompetitors = async () => {
    const analysisResult = await handleAnalyzeCompetitors();
    if (analysisResult) {
      setAnalysis(analysisResult);
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
    formatDate
  };
};
