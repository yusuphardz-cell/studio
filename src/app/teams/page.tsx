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
import { calculateStandings, clearAllMatches, LEAGUE_ID } from '@/lib/data';
import type { Standing, Team, Match, StoredMatch } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function TeamsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const participantsRef = useMemoFirebase(
    () => collection(firestore, 'leagues', LEAGUE_ID, 'participants'),
    [firestore]
  );
  const { data: teams, isLoading: teamsLoading } = useCollection<Omit<Team, 'id'>>(participantsRef);
  
  const matchesRef = useMemoFirebase(
    () => collection(firestore, 'leagues', LEAGUE_ID, 'matches'),
    [firestore]
  );
  const { data: storedMatches, isLoading: matchesLoading } = useCollection<Omit<StoredMatch, 'id'>>(matchesRef);

  const matches = React.useMemo((): Match[] | null => {
    if (!storedMatches || !teams) return null;
    const teamsMap = new Map(teams.map(t => [t.id, t]));
    return storedMatches.map(sm => {
      const team1 = teamsMap.get(sm.team1Id);
      const team2 = teamsMap.get(sm.team2Id);
      if (!team1 || !team2) return null;
      const { team1Id, team2Id, ...rest } = sm;
      return { ...rest, id: sm.id, team1, team2 };
    }).filter((m): m is Match => m !== null);
  }, [storedMatches, teams]);


  const standings = React.useMemo(() => {
    if (!teams || !matches) return [];
    return calculateStandings(teams, matches);
  }, [teams, matches]);

  const isLoading = teamsLoading || matchesLoading;


  const handleReset = async () => {
    await clearAllMatches(firestore);
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
            <CardTitle>Standings</CardTitle>
            <CardDescription>
              Official standings for the 2026 season.
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset All Points
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all match data and reset the standings.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading standings...</p> : (
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
                  <TableHead className="hidden text-center sm:table-cell">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help border-b border-dashed">
                          W
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Menang</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="hidden text-center sm:table-cell">
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
                    <TableCell className="hidden text-center sm:table-cell">{s.win}</TableCell>
                    <TableCell className="hidden text-center sm:table-cell">{s.loss}</TableCell>
                    <TableCell className="text-right font-bold">
                      {s.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && standings.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                No matches played yet. Standings will appear here once results are in.
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
