
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CompetitorDetailedAnalysis from './CompetitorDetailedAnalysis';

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

interface CompetitorAnalysis {
  id: string;
  business_id: string;
  attributes_json: CompetitorAttribute[];
  summary_insights: string;
  created_at: string;
}

interface AnalysisResultsCardProps {
  analysis: CompetitorAnalysis;
  formatDate: (dateString: string | null) => string;
}

const AnalysisResultsCard = ({ analysis, formatDate }: AnalysisResultsCardProps) => {
  return (
    <div className="space-y-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>AI-Generated Competitive Insights</span>
            <Badge variant="outline" className="text-xs font-normal">
              Generated {formatDate(analysis.created_at)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-line text-gray-700">
              {analysis.summary_insights}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Competitor Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {analysis.attributes_json.map((competitor) => (
              <CompetitorDetailedAnalysis 
                key={competitor.id} 
                competitor={competitor} 
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResultsCard;
