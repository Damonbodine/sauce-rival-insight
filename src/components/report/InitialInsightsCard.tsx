
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface InitialInsightsCardProps {
  analysisLoading: boolean;
  competitorsCount: number;
  canAnalyze: boolean;
}

const InitialInsightsCard = ({ analysisLoading, competitorsCount, canAnalyze }: InitialInsightsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitive Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {analysisLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-8 w-2/3 mt-6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : competitorsCount > 0 ? (
          <div className="space-y-4">
            <p className="text-gray-700">
              Based on your business description, we've identified {competitorsCount} potential 
              competitors in your market space. Review their websites to understand their:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Product offerings and pricing strategies</li>
              <li>Marketing messaging and brand positioning</li>
              <li>Customer experience and website design</li>
              <li>Target audience and market segments</li>
            </ul>
            
            {canAnalyze ? (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="font-medium text-amber-800">Ready for AI Analysis</p>
                <p className="text-sm text-amber-700 mt-1">
                  Click the "Analyze Competitors" button above to generate detailed competitive insights 
                  using AI. This will analyze competitor websites and provide strategic recommendations.
                </p>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="font-medium text-blue-800">Crawl Competitors First</p>
                <p className="text-sm text-blue-700 mt-1">
                  Click the "Crawl Competitors" button above to gather website data. 
                  Once the crawl is complete, you'll be able to generate AI-powered insights.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            Competitor insights will be available once competitor data is loaded.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default InitialInsightsCard;
