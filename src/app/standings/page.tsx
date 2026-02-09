'use client';

import * as React from 'react';
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
import { calculateStandings, getMatches, getTeams, setMatches } from '@/lib/data';
import type { Standing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function StandingsPage() {
  const [standings, setStandings] = React.useState<Standing[]>([]);
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

  const handleReset = () => {
    setMatches([]);
    toast({
        title: "Standings Reset",
        description: "All matches have been cleared and points are reset."
    });
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>League Standings</CardTitle>
            <CardDescription>
              Official standings for the 2026 season.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset All Points
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
                <TableHead className="hidden text-center md:table-cell">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        Played
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Pertandingan Dimainkan</TooltipContent>
                  </Tooltip>
                </TableHead>
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
                <TableHead className="hidden text-center md:table-cell">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        D
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Seri</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="hidden text-center md:table-cell">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        L
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Kalah</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="hidden text-center md:table-cell">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        GF
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Gol Memasukkan</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="hidden text-center md:table-cell">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        GA
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Gol Kemasukan</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="hidden text-center md:table-cell">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dashed">
                        GD
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Selisih Gol</TooltipContent>
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
                  <TableCell className="hidden text-center md:table-cell">{s.played}</TableCell>
                  <TableCell className="text-center">{s.win}</TableCell>
                  <TableCell className="hidden text-center md:table-cell">{s.draw}</TableCell>
                  <TableCell className="hidden text-center md:table-cell">{s.loss}</TableCell>
                  <TableCell className="hidden text-center md:table-cell">{s.goalsFor}</TableCell>
                  <TableCell className="hidden text-center md:table-cell">{s.goalsAgainst}</TableCell>
                  <TableCell className="hidden text-center md:table-cell">{s.goalDifference}</TableCell>
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
