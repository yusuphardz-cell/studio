'use client';

import * as React from 'react';
import { getTeams, getMatches, updateMatch as saveMatch, setMatches as saveAllMatches } from '@/lib/data';
import type { Team, Match } from '@/lib/types';
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
import { Calendar, Swords, Trophy, Sparkles } from 'lucide-react';
import { MatchScoreDialog } from '@/components/match-score-dialog';
import { useToast } from '@/hooks/use-toast';

function MatchCard({ match, onRecordScore }: { match: Match; onRecordScore: (match: Match) => void; }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center gap-2 w-1/3 text-center">
            <Avatar className="h-12 w-12">
              <AvatarImage src={match.team1.logoUrl} alt={match.team1.name} />
              <AvatarFallback>{match.team1.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{match.team1.name}</span>
          </div>
          <div className="flex flex-col items-center text-center">
            {match.status === 'played' ? (
              <span className="text-3xl font-bold">
                {match.score1} - {match.score2}
              </span>
            ) : (
              <span className="font-bold text-muted-foreground">VS</span>
            )}
            <span className="text-xs text-muted-foreground mt-1">
              {format(new Date(match.date), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 w-1/3 text-center">
            <Avatar className="h-12 w-12">
              <AvatarImage src={match.team2.logoUrl} alt={match.team2.name} />
              <AvatarFallback>{match.team2.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{match.team2.name}</span>
          </div>
        </div>
        {match.status === 'upcoming' && (
          <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => onRecordScore(match)}>
            Record Score
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function BracketGenerator({ onGenerate }: { onGenerate: (matches: Match[]) => void; }) {
    const { toast } = useToast();
  
    const handleGenerate = () => {
        const teams = getTeams();
        if (teams.length < 2) {
            toast({
                title: "Not enough teams",
                description: "You need at least 2 teams to generate a bracket.",
                variant: "destructive",
            });
            return;
        }

        const shuffled = [...teams].sort(() => 0.5 - Math.random());
        const newMatches: Match[] = [];
        for (let i = 0; i < shuffled.length; i += 2) {
            if (shuffled[i+1]) {
                newMatches.push({
                    id: `gen-match-${i/2}`,
                    team1: shuffled[i],
                    team2: shuffled[i+1],
                    score1: null,
                    score2: null,
                    date: new Date().toISOString(),
                    status: 'upcoming',
                });
            }
        }
        onGenerate(newMatches);
        toast({
            title: "Bracket Generated!",
            description: "A new set of matches has been created.",
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generate Bracket</CardTitle>
                <CardDescription>Randomly create pairings for a new tournament round. This will replace all existing upcoming matches.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleGenerate}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate New Matches
                </Button>
            </CardContent>
        </Card>
    )
}

export default function MatchesPage() {
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setMatches(getMatches());
  }, []);

  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');
  const playedMatches = matches.filter((m) => m.status === 'played');

  const handleRecordScore = (match: Match) => {
    setSelectedMatch(match);
    setDialogOpen(true);
  };

  const handleSaveScore = (match: Match, score1: number, score2: number) => {
    const updatedMatch: Match = { ...match, score1, score2, status: 'played' };
    saveMatch(updatedMatch); // Persist change
    setMatches(getMatches()); // Re-fetch from "DB"
    setDialogOpen(false);
    toast({
        title: "Score Recorded",
        description: `${match.team1.name} ${score1} - ${score2} ${match.team2.name}`,
    });
  };

  const handleGenerateBracket = (newMatches: Match[]) => {
    saveAllMatches(newMatches);
    setMatches(newMatches);
  }

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8">
        <BracketGenerator onGenerate={handleGenerateBracket} />

      <Card>
        <CardHeader>
          <CardTitle>Matches</CardTitle>
          <CardDescription>View upcoming matches and past results.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
              {upcomingMatches.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingMatches.map((match) => (
                    <MatchCard key={match.id} match={match} onRecordScore={handleRecordScore} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border-dashed border-2 rounded-lg">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Upcoming Matches</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    All matches have been played or a new bracket needs to be generated.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              {playedMatches.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {playedMatches.map((match) => (
                    <MatchCard key={match.id} match={match} onRecordScore={handleRecordScore} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border-dashed border-2 rounded-lg">
                  <Swords className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Match History</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Results from played matches will appear here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
