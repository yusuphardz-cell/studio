'use client';

import * as React from 'react';
import {
  updateMatch as saveMatch,
  setMatches as saveAllMatches,
  LEAGUE_ID,
} from '@/lib/data';
import type { Team, Match, StoredMatch } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, Swords, Sparkles } from 'lucide-react';
import { MatchScoreDialog } from '@/components/match-score-dialog';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

function MatchCard({
  match,
  onRecordScore,
}: {
  match: Match;
  onRecordScore: (match: Match) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center gap-2">
          <div className="flex flex-col items-center gap-2 flex-1 text-center min-w-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={match.team1.logoUrl} alt={match.team1.name} />
              <AvatarFallback>{match.team1.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm w-full break-words text-center">
              {match.team1.name}
            </span>
          </div>
          <div className="flex flex-col items-center text-center px-2">
            {match.status === 'played' ? (
              <span className="text-2xl font-bold sm:text-3xl">
                {match.score1} - {match.score2}
              </span>
            ) : (
              <span className="font-bold text-muted-foreground">VS</span>
            )}
            <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
              {format(new Date(match.date), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1 text-center min-w-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={match.team2.logoUrl} alt={match.team2.name} />
              <AvatarFallback>{match.team2.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm w-full break-words text-center">
              {match.team2.name}
            </span>
          </div>
        </div>
        {match.status === 'upcoming' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => onRecordScore(match)}
          >
            Record Score
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function MatchGenerator({
  teams,
  onGenerate,
}: {
  teams: Team[] | null;
  onGenerate: (matches: Match[]) => void;
}) {
  const { toast } = useToast();
  const [generationType, setGenerationType] = React.useState<
    'bracket' | 'round-robin'
  >('bracket');
  const [selectedTeamIds, setSelectedTeamIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (teams) {
      setSelectedTeamIds(teams.map((t) => t.id));
    }
  }, [teams]);

  const handleTeamSelectionChange = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (teams) {
      setSelectedTeamIds(select ? teams.map((t) => t.id) : []);
    }
  };

  const handleGenerate = () => {
    if (!teams) return;

    const selectedTeams = teams.filter((t) => selectedTeamIds.includes(t.id));

    if (selectedTeams.length < 2) {
      toast({
        title: 'Not enough players selected',
        description: 'You need to select at least 2 players to generate games.',
        variant: 'destructive',
      });
      return;
    }

    let newMatches: Match[] = [];
    if (generationType === 'bracket') {
      const shuffled = [...selectedTeams].sort(() => 0.5 - Math.random());
      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
          newMatches.push({
            id: `match-${Date.now()}-${i / 2}`,
            team1: shuffled[i],
            team2: shuffled[i + 1],
            score1: null,
            score2: null,
            date: new Date().toISOString(),
            status: 'upcoming',
          });
        }
      }
    } else {
      // round-robin
      for (let i = 0; i < selectedTeams.length; i++) {
        for (let j = i + 1; j < selectedTeams.length; j++) {
          newMatches.push({
            id: `match-${Date.now()}-${i}-${j}`,
            team1: selectedTeams[i],
            team2: selectedTeams[j],
            score1: null,
            score2: null,
            date: new Date().toISOString(),
            status: 'upcoming',
          });
        }
      }
    }

    onGenerate(newMatches);
    toast({
      title: 'Games Generated!',
      description: `A new ${generationType} schedule has been created with ${newMatches.length} games.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Games</CardTitle>
        <CardDescription>
          Select players and a format to create a new schedule. This will replace
          all existing upcoming games.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium text-sm mb-2">Game Format</h4>
          <RadioGroup
            value={generationType}
            onValueChange={(value) =>
              setGenerationType(value as 'bracket' | 'round-robin')
            }
            className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bracket" id="bracket" />
              <Label htmlFor="bracket">Single Elimination Bracket</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="round-robin" id="round-robin" />
              <Label htmlFor="round-robin">Round Robin</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm">
              Select Players ({selectedTeamIds.length} / {teams?.length || 0})
            </h4>
            <div className="flex items-center space-x-2">
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => handleSelectAll(true)}
              >
                Select All
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => handleSelectAll(false)}
              >
                Deselect All
              </Button>
            </div>
          </div>

          <ScrollArea className="h-48 rounded-md border p-2">
            <div className="space-y-2">
              {teams && teams.length > 0 ? (
                teams.map((team) => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={selectedTeamIds.includes(team.id)}
                      onCheckedChange={() => handleTeamSelectionChange(team.id)}
                    />
                    <Label
                      htmlFor={`team-${team.id}`}
                      className="font-normal flex-1 cursor-pointer"
                    >
                      {team.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4">
                  No players available. Import players to get started.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={selectedTeamIds.length < 2}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate New Games
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace all existing upcoming games with a new
                schedule. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleGenerate}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function MatchesPage() {
  const firestore = useFirestore();
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const participantsRef = useMemoFirebase(
    () => collection(firestore, 'leagues', LEAGUE_ID, 'participants'),
    [firestore]
  );
  const { data: teams, isLoading: teamsLoading } =
    useCollection<Omit<Team, 'id'>>(participantsRef);

  const matchesRef = useMemoFirebase(
    () => collection(firestore, 'leagues', LEAGUE_ID, 'matches'),
    [firestore]
  );
  const { data: storedMatches, isLoading: matchesLoading } =
    useCollection<Omit<StoredMatch, 'id'>>(matchesRef);

  const matches = React.useMemo((): Match[] | null => {
    if (!storedMatches || !teams) return null;
    const teamsMap = new Map(teams.map((t) => [t.id, t]));
    return storedMatches
      .map((sm) => {
        const team1 = teamsMap.get(sm.team1Id);
        const team2 = teamsMap.get(sm.team2Id);
        if (!team1 || !team2) return null;
        const { team1Id, team2Id, ...rest } = sm;
        return { ...rest, id: sm.id, team1, team2 };
      })
      .filter((m): m is Match => m !== null);
  }, [storedMatches, teams]);

  const upcomingMatches = matches
    ? matches.filter((m) => m.status === 'upcoming')
    : [];
  const playedMatches = matches
    ? matches.filter((m) => m.status === 'played')
    : [];
  const isLoading = teamsLoading || matchesLoading;

  const handleRecordScore = (match: Match) => {
    setSelectedMatch(match);
    setDialogOpen(true);
  };

  const handleSaveScore = (match: Match, score1: number, score2: number) => {
    const updatedMatch: Match = { ...match, score1, score2, status: 'played' };
    saveMatch(firestore, updatedMatch);
    setDialogOpen(false);
    toast({
      title: 'Score Recorded',
      description: `${match.team1.name} ${score1} - ${score2} ${match.team2.name}`,
    });
  };

  const handleGenerateBracket = (newMatches: Match[]) => {
    saveAllMatches(firestore, newMatches);
  };

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8">
      <MatchGenerator teams={teams} onGenerate={handleGenerateBracket} />

      <Card>
        <CardHeader>
          <CardTitle>Games</CardTitle>
          <CardDescription>
            View upcoming games and past results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading games...</p>
          ) : (
            <Tabs defaultValue="upcoming">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mt-4">
                {upcomingMatches.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onRecordScore={handleRecordScore}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border-dashed border-2 rounded-lg">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No Upcoming Games
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      All games have been played or a new bracket needs to be
                      generated.
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                {playedMatches.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {playedMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onRecordScore={handleRecordScore}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border-dashed border-2 rounded-lg">
                    <Swords className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No Game History
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Results from played games will appear here.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {selectedMatch && (
        <MatchScoreDialog
          isOpen={isDialogOpen}
          onOpenChange={setDialogOpen}
          match={selectedMatch}
          onSave={handleSaveScore}
        />
      )}
    </div>
  );
}
