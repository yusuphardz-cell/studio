'use client';

import * as React from 'react';
import { toJpeg } from 'html-to-image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { calculateStandings, getMatches, getTeams } from '@/lib/data';
import type { Standing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function ReportPage() {
  const [standings, setStandings] = React.useState<Standing[]>([]);
  const reportCardRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const refreshData = React.useCallback(() => {
    const teams = getTeams();
    const matches = getMatches();
    setStandings(calculateStandings(teams, matches));
  }, []);

  React.useEffect(() => {
    refreshData();
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('storage', refreshData);
    };
  }, [refreshData]);

  const handleDownloadJpg = React.useCallback(() => {
    if (reportCardRef.current === null) {
      toast({
        title: 'Error generating report',
        description: 'Could not find the report content to download.',
        variant: 'destructive',
      });
      return;
    }

    const filter = (node: Node) => {
      if (node instanceof HTMLElement) {
        return !node.classList.contains('no-export');
      }
      return true;
    };

    toJpeg(reportCardRef.current, {
      cacheBust: true,
      backgroundColor: 'white',
      quality: 0.95,
      filter,
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'standings-report.jpeg';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: 'Download Started',
          description: 'Your report is being downloaded as a JPG file.',
        });
      })
      .catch((err) => {
        console.error('Oops, something went wrong!', err);
        toast({
          title: 'Download Failed',
          description: 'There was an error generating the JPG file.',
          variant: 'destructive',
        });
      });
  }, [reportCardRef, toast]);

  return (
    <div className="flex-1 p-4 md:p-8">
      <Card ref={reportCardRef}>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Standings Report</CardTitle>
            <CardDescription>
              A downloadable report of the official standings for the 2026 season.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={handleDownloadJpg}
            className="no-export"
          >
            <Download className="mr-2 h-4 w-4" />
            Download JPG
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        Rank
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Peringkat</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        W
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Menang</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        L
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Kalah</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        Points
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Total Poin</TooltipContent>
                  </Tooltip>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((s) => (
                <TableRow key={s.team.id}>
                  <TableCell className="font-medium text-center">{s.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={s.team.logoUrl}
                          alt={s.team.name}
                          data-ai-hint={s.team.dataAiHint}
                        />
                        <AvatarFallback>{s.team.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium break-words">{s.team.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{s.win}</TableCell>
                  <TableCell className="text-center">{s.loss}</TableCell>
                  <TableCell className="text-right font-bold">
                    {s.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {standings.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                No matches played yet. Standings will appear here once results are in.
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
