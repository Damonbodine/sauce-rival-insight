
import React from 'react';
import { useParams } from 'react-router-dom';
import ReportHeader from '@/components/report/ReportHeader';
import BusinessSummaryCard from '@/components/report/BusinessSummaryCard';
import KeywordsCard from '@/components/report/KeywordsCard';
import CompetitorsCard from '@/components/report/CompetitorsCard';
import AnalysisResultsCard from '@/components/report/AnalysisResultsCard';
import InitialInsightsCard from '@/components/report/InitialInsightsCard';
import { useReport } from '@/hooks/useReport';

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const {
    loading,
    business,
    competitors,
    analysis,
    error,
    isCrawling,
    analysisLoading,
    refreshCompetitors,
    analyzeCompetitors,
    formatDate,
    retryLoading
  } = useReport(id);
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ReportHeader reportId={id} error={error} onRetry={retryLoading} />

      <main className="container flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <BusinessSummaryCard loading={loading} business={business} />
            <KeywordsCard loading={loading} keywords={business?.keywords} />
          </div>

          <CompetitorsCard 
            loading={loading}
            competitors={competitors}
            isCrawling={isCrawling}
            analysisLoading={analysisLoading}
            onCrawl={refreshCompetitors}
            onAnalyze={analyzeCompetitors}
          />
          
          {analysis ? (
            <AnalysisResultsCard analysis={analysis} formatDate={formatDate} />
          ) : (
            <InitialInsightsCard 
              analysisLoading={analysisLoading} 
              competitorsCount={competitors.length}
              canAnalyze={competitors.filter(c => c.crawl_status === 'success').length > 0}
            />
          )}
        </div>
      </main>

      <footer className="container py-6 text-center text-sm text-gray-500 border-t">
        <p>© 2025 CompetitorScope. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ReportPage;
