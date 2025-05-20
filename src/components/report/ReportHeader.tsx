
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ReportHeaderProps {
  reportId?: string;
  error: string | null;
}

const ReportHeader = ({ reportId, error }: ReportHeaderProps) => {
  return (
    <>
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Your Competitor Analysis Report</h1>
        {reportId && (
          <p className="text-gray-600">
            Report ID: <span className="font-mono text-sm">{reportId}</span>
          </p>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportHeader;
