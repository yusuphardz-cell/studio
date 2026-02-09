'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Trophy,
  Swords,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { calculateStandings, LEAGUE_ID } from '@/lib/data';
import type { Team, Match, Standing, StoredMatch } from '@/lib/types';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function DashboardPage() {
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

  const topTeams = standings.slice(0, 3);
  const nextMatch = matches?.find((m) => m.status === 'upcoming');

  const isLoading = teamsLoading || matchesLoading;

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Team</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topTeams.length > 0 ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={topTeams[0].team.logoUrl}
                    alt={topTeams[0].team.name}
                  />
                  <AvatarFallback>
                    {topTeams[0].team.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-2xl font-bold break-words">{topTeams[0].team.name}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No matches played yet.</p>
            )}
            <p className="text-xs text-muted-foreground">
              {topTeams.length > 0 ? `${topTeams[0].points} points` : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Participating in this league
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Matches Played
            </CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches?.filter((m) => m.status === 'played').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              out of {matches?.length || 0} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">League Status</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ongoing</div>
            <p className="text-xs text-muted-foreground">
              2026 Season
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>League Standings</CardTitle>
              <CardDescription>
                Top 3 teams based on points.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/teams">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">W</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">L</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTeams.map((standing) => (
                  <TableRow key={standing.team.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={standing.team.logoUrl}
                            alt={standing.team.name}
                          />
                          <AvatarFallback>
                            {standing.team.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium break-words">{standing.team.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">{standing.win}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell">{standing.loss}</TableCell>
                    <TableCell className="text-right">
                      {standing.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {topTeams.length === 0 && (
              <div className="text-center p-4 text-muted-foreground">
                No matches played yet. Standings will appear here.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next Match</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            {nextMatch ? (
              <div className="flex items-center justify-around gap-2">
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={nextMatch.team1.logoUrl}
                      alt={nextMatch.team1.name}
                    />
                    <AvatarFallback>
                      {nextMatch.team1.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold w-full text-center break-words">{nextMatch.team1.name}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    VS
                  </span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(nextMatch.date), 'PP')}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={nextMatch.team2.logoUrl}
                      alt={nextMatch.team2.name}
                    />
                    <AvatarFallback>
                      {nextMatch.team2.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold w-full text-center break-words">{nextMatch.team2.name}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                <Trophy className="h-10 w-10 mb-2" />
                <p>All matches have been played!</p>
                <p className="text-xs">Congratulations to the champion.</p>
              </div>
            )}
             <Button asChild className="w-full">
                <Link href="/matches">View All Matches</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
