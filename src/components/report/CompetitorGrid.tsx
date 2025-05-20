
import React from 'react';
import CompetitorDetailedAnalysis from './CompetitorDetailedAnalysis';
import { Skeleton } from '@/components/ui/skeleton';

interface CompetitorAttribute {
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

interface CompetitorGridProps {
  loading: boolean;
  competitors: CompetitorAttribute[];
}

const CompetitorGrid = ({ loading, competitors }: CompetitorGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(index => (
          <Skeleton key={index} className="h-[400px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-medium text-gray-700">No competitor data available</h3>
        <p className="text-gray-500 mt-2">
          Your analysis is still in progress. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {competitors.map(competitor => (
        <CompetitorDetailedAnalysis 
          key={competitor.id} 
          competitor={competitor} 
        />
      ))}
    </div>
  );
};

export default CompetitorGrid;
