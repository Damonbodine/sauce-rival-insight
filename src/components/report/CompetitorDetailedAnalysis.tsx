
import React from 'react';
import { ExternalLink } from 'lucide-react';

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
    <div className="border-b pb-6 last:border-0 last:pb-0">
      <h3 className="text-xl font-semibold mb-2">{competitor.name}</h3>
      <a 
        href={competitor.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-sm text-hotSauce-600 hover:text-hotSauce-800 inline-flex items-center gap-1 mb-4"
      >
        {competitor.url} <ExternalLink className="w-3 h-3" />
      </a>
      
      {competitor.attributes.error ? (
        <div className="text-red-500">Analysis failed: {competitor.attributes.message}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Product Types</h4>
            {competitor.attributes.productTypes && competitor.attributes.productTypes.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {competitor.attributes.productTypes.map((product, idx) => (
                  <li key={idx} className="text-sm text-gray-600">{product}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No product information available</p>
            )}
            
            <h4 className="font-medium text-gray-800 mt-4 mb-1">Price Points</h4>
            <p className="text-sm text-gray-600">{competitor.attributes.pricePoints || "No pricing information available"}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Unique Selling Points</h4>
            {competitor.attributes.uniqueSellingPropositions && competitor.attributes.uniqueSellingPropositions.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {competitor.attributes.uniqueSellingPropositions.map((usp, idx) => (
                  <li key={idx} className="text-sm text-gray-600">{usp}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No USPs identified</p>
            )}
            
            <h4 className="font-medium text-gray-800 mt-4 mb-1">Brand Tone</h4>
            <p className="text-sm text-gray-600">{competitor.attributes.toneBranding || "No branding information available"}</p>
            
            <h4 className="font-medium text-gray-800 mt-4 mb-1">Target Customer</h4>
            <p className="text-sm text-gray-600">{competitor.attributes.targetCustomer || "No target customer information available"}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorDetailedAnalysis;
