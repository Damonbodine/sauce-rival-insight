
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Business {
  id: string;
  description: string;
  keywords: string[] | null;
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

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch business details
        const { data: businessData, error: businessError } = await supabase
          .from('business_inputs')
          .select('id, description, keywords')
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
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError(err instanceof Error ? err.message : "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleCrawlCompetitors = async () => {
    if (!id) return;

    setIsCrawling(true);
    
    try {
      toast({
        title: "Starting competitor website crawl",
        description: "This may take a few minutes..."
      });
      
      const { data: crawlData, error: crawlError } = await supabase.functions.invoke('crawl_competitors', {
        body: { business_input_id: id }
      });
      
      if (crawlError) {
        console.error("Error crawling competitors:", crawlError);
        toast({
          title: "Error crawling competitors",
          description: crawlError.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Competitor crawling complete",
        description: crawlData.message
      });
      
      // Refresh the competitor data
      const { data: refreshedData } = await supabase
        .from('competitor_sites')
        .select('id, name, url, summary, source_rank, firecrawl_id, crawl_status, crawl_error, crawled_at')
        .eq('business_id', id)
        .order('source_rank', { ascending: false, nullsFirst: false });
        
      if (refreshedData) {
        setCompetitors(refreshedData);
      }
    } catch (error) {
      console.error("Error invoking crawl function:", error);
      toast({
        title: "Error crawling competitors",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsCrawling(false);
    }
  };
  
  const getCrawlStatusBadge = (competitor: Competitor) => {
    if (!competitor.crawl_status) {
      return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Not crawled</Badge>;
    } else if (competitor.crawl_status === 'success') {
      return <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1"><Check className="h-3 w-3" /> Crawled</Badge>;
    } else {
      return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Failed</Badge>;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b bg-white">
        <div className="container py-4 flex justify-between items-center">
          <Logo />
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              New Analysis
            </Button>
          </Link>
        </div>
      </header>

      <main className="container flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Your Competitor Analysis Report</h1>
            {id && (
              <p className="text-gray-600">
                Report ID: <span className="font-mono text-sm">{id}</span>
              </p>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : business ? (
                  <p className="text-gray-700">{business.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No business description found</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : business && business.keywords && business.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {business.keywords.map((keyword, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No keywords provided</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Competitors</CardTitle>
              {!loading && competitors.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCrawlCompetitors}
                  disabled={isCrawling}
                >
                  {isCrawling ? "Crawling..." : "Crawl Competitors"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : competitors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead className="text-right">Relevance</TableHead>
                      <TableHead>Crawl Status</TableHead>
                      <TableHead className="w-[100px]">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.map((competitor) => (
                      <TableRow key={competitor.id}>
                        <TableCell className="font-medium">{competitor.name}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="line-clamp-2 text-sm text-gray-600">
                            {competitor.summary || 'No description available'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {competitor.source_rank !== null 
                            ? (competitor.source_rank * 100).toFixed(0) + '%' 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getCrawlStatusBadge(competitor)}
                        </TableCell>
                        <TableCell>
                          <a 
                            href={competitor.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-hotSauce-600 hover:text-hotSauce-800"
                          >
                            Visit <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No competitor data available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    This could be because the competitor analysis is still in progress or no matches were found.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Competitive Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : competitors.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Based on your business description, we've identified {competitors.length} potential 
                    competitors in your market space. Review their websites to understand their:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Product offerings and pricing strategies</li>
                    <li>Marketing messaging and brand positioning</li>
                    <li>Customer experience and website design</li>
                    <li>Target audience and market segments</li>
                  </ul>
                  <p className="text-gray-700 mt-4">
                    Look for gaps in the market that your business can fill and unique selling 
                    propositions that differentiate you from these competitors.
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Competitor insights will be available once competitor data is loaded.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="container py-6 text-center text-sm text-gray-500 border-t">
        <p>© 2025 CompetitorScope. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ReportPage;
