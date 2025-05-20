
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessSummaryCardProps {
  loading: boolean;
  business: {
    description: string;
    detected_industry: string | null;
  } | null;
}

const BusinessSummaryCard = ({ loading, business }: BusinessSummaryCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Business Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : business ? (
          <div>
            <p className="text-gray-700 mb-2">{business.description}</p>
            {business.detected_industry && (
              <p className="text-sm text-blue-600 font-medium">Industry: {business.detected_industry}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">No business description found</p>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessSummaryCard;
