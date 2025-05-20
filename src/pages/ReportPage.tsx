
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  
  useEffect(() => {
    // Here we would fetch the business data using the ID from Supabase
    // Since we don't have Supabase connected yet, this is just a placeholder
    console.log(`Fetching report data for business ID: ${id}`);
  }, [id]);
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
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

      <main className="container flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Your Competitor Analysis Report</h1>
            <p className="text-gray-600">
              Report ID: <span className="font-mono text-sm">{id}</span>
            </p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                Note: This is a placeholder. To generate actual reports, you'll need to connect Supabase to store business information and integrate with an AI service for analysis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Competitors</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Market Positioning</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Competitive Advantages</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="container py-6 text-center text-sm text-gray-500 border-t">
        <p>© 2025 CompetitorScope. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ReportPage;
