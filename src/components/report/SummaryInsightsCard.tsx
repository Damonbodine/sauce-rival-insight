
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryInsightsCardProps {
  loading: boolean;
  summaryInsights?: string;
}

const SummaryInsightsCard = ({ loading, summaryInsights }: SummaryInsightsCardProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Summary Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : summaryInsights ? (
          <div className="prose max-w-none">
            <div className="whitespace-pre-line text-gray-700">
              {summaryInsights}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">
            Your analysis is still in progress. Please check back soon.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryInsightsCard;
