
import React from 'react';
import Logo from '@/components/Logo';
import BusinessForm from '@/components/BusinessForm';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-gray-100">
      <header className="container py-6">
        <Logo />
      </header>

      <main className="container flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-3xl w-full space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              AI-Powered Competitor Analysis for 
              <span className="text-blue-600"> Any Business</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Get actionable insights on your competitors with our advanced AI analysis. 
              Understand market positioning, pricing strategies, and unique selling points.
            </p>
          </div>

          <Card className="border shadow-lg">
            <CardHeader className="pb-4">
              <h2 className="text-xl font-semibold text-center">Tell us about your business</h2>
            </CardHeader>
            <CardContent>
              <BusinessForm />
            </CardContent>
          </Card>
          
          <div className="text-center text-sm text-gray-500">
            <p>Your data is secure and will only be used to generate your competitor report</p>
          </div>
        </div>
      </main>

      <footer className="container py-6 text-center text-sm text-gray-500">
        <p>© 2025 CompetitorScope. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
