
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCcw, FileText } from 'lucide-react';

interface ReportHeaderProps {
  reportId?: string;
  error: string | null;
  onRetry?: () => Promise<void>; // Properly typed as Promise<void>
  businessName?: string;
  onExportPDF?: () => void;
}

const ReportHeader = ({ reportId, error, onRetry, businessName, onExportPDF }: ReportHeaderProps) => {
  return (
    <div>
      <header className="border-b bg-white">
        <div className="container py-4 flex justify-between items-center">
          <Logo />
          <div className="flex gap-2">
            {onExportPDF && (
              <Button 
                onClick={onExportPDF} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Export to PDF
              </Button>
            )}
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                New Analysis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">
          {businessName 
            ? `Competitor Analysis for ${businessName}` 
            : "Your Competitor Analysis Report"
          }
        </h1>
        {reportId && (
          <p className="text-gray-600">
            Report ID: <span className="font-mono text-sm">{reportId}</span>
          </p>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex justify-between items-center">
              <p className="text-red-800 text-sm">{error}</p>
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  className="text-red-800 border-red-300 hover:bg-red-100 flex items-center gap-1"
                >
                  <RefreshCcw className="h-3 w-3" />
                  Retry Connection
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportHeader;
