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
import { calculateStandings, getMatches, getTeams } from '@/lib/data';
import type { Standing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function ReportPage() {
  const [standings, setStandings] = React.useState<Standing[]>([]);

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

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Standings Report</CardTitle>
            <CardDescription>
              A printable report of the official standings for the 2026 season.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">Played</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">GF</TableHead>
                <TableHead className="text-center">GA</TableHead>
                <TableHead className="text-center">GD</TableHead>
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
                        <AvatarFallback>{s.team.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium break-words">{s.team.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{s.played}</TableCell>
                  <TableCell className="text-center">{s.win}</TableCell>
                  <TableCell className="text-center">{s.draw}</TableCell>
                  <TableCell className="text-center">{s.loss}</TableCell>
                  <TableCell className="text-center">{s.goalsFor}</TableCell>
                  <TableCell className="text-center">{s.goalsAgainst}</TableCell>
                  <TableCell className="text-center">{s.goalDifference}</TableCell>
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
