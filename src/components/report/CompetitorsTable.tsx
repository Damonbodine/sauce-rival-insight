
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, ExternalLink, X } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  url: string;
  summary: string | null;
  source_rank: number | null;
  firecrawl_id: string | null;
  crawl_status: string | null;
  crawl_error: string | null;
  crawled_at: string | null;
}

interface CompetitorsTableProps {
  competitors: Competitor[];
}

const CompetitorsTable = ({ competitors }: CompetitorsTableProps) => {
  const getCrawlStatusBadge = (competitor: Competitor) => {
    if (!competitor.crawl_status) {
      return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Not crawled</Badge>;
    } else if (competitor.crawl_status === 'success') {
      return <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1"><Check className="h-3 w-3" /> Crawled</Badge>;
    } else {
      return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Failed</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Summary</TableHead>
          <TableHead className="text-right">Relevance</TableHead>
          <TableHead>Crawl Status</TableHead>
          <TableHead className="w-[100px]">Link</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {competitors.map((competitor) => (
          <TableRow key={competitor.id}>
            <TableCell className="font-medium">{competitor.name}</TableCell>
            <TableCell className="max-w-xs">
              <div className="line-clamp-2 text-sm text-gray-600">
                {competitor.summary || 'No description available'}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {competitor.source_rank !== null 
                ? (competitor.source_rank * 100).toFixed(0) + '%' 
                : 'N/A'}
            </TableCell>
            <TableCell>
              {getCrawlStatusBadge(competitor)}
            </TableCell>
            <TableCell>
              <a 
                href={competitor.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-hotSauce-600 hover:text-hotSauce-800"
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CompetitorsTable;
