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
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="hidden text-center md:table-cell">Played</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="hidden text-center md:table-cell">D</TableHead>
                <TableHead className="hidden text-center md:table-cell">L</TableHead>
                <TableHead className="hidden text-center md:table-cell">GF</TableHead>
                <TableHead className="hidden text-center md:table-cell">GA</TableHead>
                <TableHead className="hidden text-center md:table-cell">GD</TableHead>
                <TableHead className="text-right">Points</TableHead>
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
                        <AvatarFallback>{s.team.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate">{s.team.name}</span>
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
