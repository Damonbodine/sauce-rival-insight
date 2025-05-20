
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart } from 'lucide-react';
import CompetitorsTable from './CompetitorsTable';

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

interface CompetitorsCardProps {
  loading: boolean;
  competitors: Competitor[];
  isCrawling: boolean;
  analysisLoading: boolean;
  onCrawl: () => void;
  onAnalyze: () => void;
}

const CompetitorsCard = ({ 
  loading, 
  competitors, 
  isCrawling,
  analysisLoading, 
  onCrawl, 
  onAnalyze 
}: CompetitorsCardProps) => {
  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Competitors</CardTitle>
        <div className="flex gap-2">
          {!loading && competitors.length > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCrawl}
                disabled={isCrawling}
              >
                {isCrawling ? "Crawling..." : "Crawl Competitors"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAnalyze}
                disabled={analysisLoading || competitors.filter(c => c.crawl_status === 'success').length === 0}
                className="flex items-center gap-1"
              >
                {analysisLoading ? "Analyzing..." : "Analyze Competitors"}
                <BarChart className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : competitors.length > 0 ? (
          <CompetitorsTable competitors={competitors} />
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
  );
};

export default CompetitorsCard;
