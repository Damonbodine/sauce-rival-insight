
import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import ReportHeader from '@/components/report/ReportHeader';
import BusinessSummaryCard from '@/components/report/BusinessSummaryCard';
import KeywordsCard from '@/components/report/KeywordsCard';
import SummaryInsightsCard from '@/components/report/SummaryInsightsCard';
import CompetitorGrid from '@/components/report/CompetitorGrid';
import CompetitorsCard from '@/components/report/CompetitorsCard';
import { useReport } from '@/hooks/useReport';
import { useToast } from '@/components/ui/use-toast';

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const {
    loading,
    business,
    competitors,
    analysis,
    error,
    retryLoading,
    isCrawling,
    analysisLoading,
    refreshCompetitors,
    analyzeCompetitors
  } = useReport(id);

  // Handle PDF export
  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    documentTitle: `Competitor Analysis - ${business?.description?.substring(0, 30) || 'Report'}`,
    onBeforePrint: () => {
      document.body.classList.add('printing');
    },
    onAfterPrint: () => {
      document.body.classList.remove('printing');
      toast({
        title: "Export successful",
        description: "Your report has been exported to PDF"
      });
    },
  });

  // Ensure onRetry returns a Promise to match the type expected by ReportHeader
  const handleRetry = async (): Promise<void> => {
    if (retryLoading) {
      try {
        console.log("Retrying data loading...");
        await retryLoading();
        console.log("Retry completed successfully");
        return Promise.resolve();
      } catch (err) {
        console.error("Error during retry:", err);
        return Promise.reject(err);
      }
    }
    return Promise.resolve();
  };

  // Get a short business name from description
  const getBusinessName = () => {
    if (!business?.description) return '';
    
    // Try to extract a business name from the beginning of the description
    const words = business.description.split(' ');
    if (words.length <= 3) return business.description;
    
    // Get first few words as the "name"
    return words.slice(0, 3).join(' ') + '...';
  };

  const businessName = getBusinessName();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ReportHeader 
        reportId={id} 
        error={error} 
        onRetry={handleRetry} // Now uses our wrapper function that returns a Promise
        businessName={businessName}
        onExportPDF={handlePrint}
      />

      <main className="container flex-1 py-8 px-4" ref={contentRef}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <BusinessSummaryCard loading={loading} business={business} />
            <KeywordsCard loading={loading} keywords={business?.keywords} />
          </div>

          {!loading && competitors && competitors.length > 0 && (
            <CompetitorsCard 
              loading={loading}
              competitors={competitors}
              isCrawling={isCrawling}
              analysisLoading={analysisLoading}
              onCrawl={refreshCompetitors}
              onAnalyze={analyzeCompetitors}
            />
          )}
          
          <SummaryInsightsCard 
            loading={loading} 
            summaryInsights={analysis?.summary_insights} 
          />
          
          <h2 className="text-2xl font-bold mb-6">Competitor Grid</h2>
          
          {!loading && !analysis && (
            <div className="text-center py-10 bg-blue-50 rounded-xl mb-8">
              <h3 className="text-xl font-medium text-blue-800">Your analysis is still in progress</h3>
              <p className="text-blue-600 mt-2">
                Please check back soon. We're analyzing the competitors data.
              </p>
            </div>
          )}
          
          {analysis && (
            <CompetitorGrid 
              loading={loading} 
              competitors={analysis.attributes_json || []} 
            />
          )}
        </div>
      </main>

      <footer className="container py-6 text-center text-sm text-gray-500 border-t print:hidden">
        <p>© 2025 CompetitorScope. All rights reserved.</p>
      </footer>

      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }
            
            .print\\:hidden {
              display: none !important;
            }
            
            .container {
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ReportPage;
