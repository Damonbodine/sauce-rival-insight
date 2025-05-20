
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KeywordsCardProps {
  loading: boolean;
  keywords: string[] | null;
}

const KeywordsCard = ({ loading, keywords }: KeywordsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Keywords</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : keywords && keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-100 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No keywords provided</p>
        )}
      </CardContent>
    </Card>
  );
};

export default KeywordsCard;
