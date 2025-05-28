import React from 'react';
import { ComparisonCategory, SeoData } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal } from 'lucide-react';

interface ComparisonSummaryProps {
  categories: ComparisonCategory[];
  primarySite: SeoData;
  competitorSites: SeoData[];
}

// Function to format URLs for display
const formatUrl = (url: string): string => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
};

export default function ComparisonSummary({ categories, primarySite, competitorSites }: ComparisonSummaryProps) {
  const allSites = [primarySite, ...competitorSites];
  
  return (
    <Card className="bg-[#13151c] border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Category Leaders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">Category</TableHead>
              <TableHead className="text-gray-300">Leader</TableHead>
              <TableHead className="text-gray-300">Score</TableHead>
              <TableHead className="text-gray-300">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const leader = allSites[category.leader];
              const leaderScore = category.scores[category.leader];
              const isPrimarySiteLeader = category.leader === 0;
              
              return (
                <TableRow key={category.key} className="border-gray-700">
                  <TableCell className="font-medium text-white">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isPrimarySiteLeader ? (
                        <Trophy className="h-4 w-4 text-[#d1f96d]" />
                      ) : (
                        <Medal className="h-4 w-4 text-[#ffb700]" />
                      )}
                      <Badge 
                        variant={isPrimarySiteLeader ? "default" : "outline"}
                        className={
                          isPrimarySiteLeader 
                            ? "bg-[#d1f96d] text-black hover:bg-[#c0e85c]" 
                            : "border-gray-600 text-gray-300"
                        }
                      >
                        {leader?.url ? formatUrl(leader.url) : 'Unknown'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    {leaderScore}/100
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm max-w-[250px]">
                    {category.description}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}