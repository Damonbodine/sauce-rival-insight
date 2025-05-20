
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface CompetitorDetailedAnalysisProps {
  competitor: CompetitorAttribute;
}

const CompetitorDetailedAnalysis = ({ competitor }: CompetitorDetailedAnalysisProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-blue-50 border-b">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">{competitor.name}</h3>
          <a 
            href={competitor.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
          >
            {competitor.url} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      
      <CardContent className="p-5">
        {competitor.attributes.error ? (
          <div className="text-red-500">Analysis failed: {competitor.attributes.message}</div>
        ) : (
          <div className="grid gap-5">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Product Types</h4>
              <div className="flex flex-wrap gap-2">
                {competitor.attributes.productTypes && competitor.attributes.productTypes.length > 0 ? (
                  competitor.attributes.productTypes.map((product, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {product}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No product information available</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Price Points</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {competitor.attributes.pricePoints || "No pricing information available"}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Unique Selling Points</h4>
              {competitor.attributes.uniqueSellingPropositions && competitor.attributes.uniqueSellingPropositions.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {competitor.attributes.uniqueSellingPropositions.map((usp, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{usp}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No USPs identified</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Brand Tone</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {competitor.attributes.toneBranding || "No branding information available"}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Target Customer</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {competitor.attributes.targetCustomer || "No target customer information available"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompetitorDetailedAnalysis;
