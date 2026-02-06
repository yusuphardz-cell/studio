import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Team, Match, Standing } from '@/lib/types';
import { addDays } from 'date-fns';

const TEAMS: Team[] = PlaceHolderImages.map((img, index) => ({
  id: img.id,
  name: img.imageHint.replace(' logo', '').replace(/^\w/, (c) => c.toUpperCase()) + 's',
  logoUrl: img.imageUrl,
  dataAiHint: img.imageHint,
}));

let MATCHES: Match[] = [
  {
    id: 'match-1',
    team1: TEAMS[0],
    team2: TEAMS[1],
    score1: 2,
    score2: 1,
    date: new Date().toISOString(),
    status: 'played',
  },
  {
    id: 'match-2',
    team1: TEAMS[2],
    team2: TEAMS[3],
    score1: 0,
    score2: 0,
    date: new Date().toISOString(),
    status: 'played',
  },
  {
    id: 'match-3',
    team1: TEAMS[4],
    team2: TEAMS[5],
    score1: null,
    score2: null,
    date: addDays(new Date(), 2).toISOString(),
    status: 'upcoming',
  },
    {
    id: 'match-4',
    team1: TEAMS[6],
    team2: TEAMS[7],
    score1: null,
    score2: null,
    date: addDays(new Date(), 3).toISOString(),
    status: 'upcoming',
  },
];

export function getTeams(): Team[] {
  return TEAMS;
}

export function getMatches(): Match[] {
  return MATCHES;
}

export function updateMatch(updatedMatch: Match): void {
  const index = MATCHES.findIndex((m) => m.id === updatedMatch.id);
  if (index !== -1) {
    MATCHES[index] = updatedMatch;
  }
}

export function setMatches(newMatches: Match[]): void {
    MATCHES = newMatches;
}

export function calculateStandings(teams: Team[], matches: Match[]): Standing[] {
  const stats: { [key: string]: Omit<Standing, 'team' | 'rank'> } = {};

  teams.forEach((team) => {
    stats[team.id] = {
      played: 0,
      win: 0,
      draw: 0,
      loss: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  matches.forEach((match) => {
    if (match.status === 'played' && match.score1 !== null && match.score2 !== null) {
      const { team1, team2, score1, score2 } = match;

      stats[team1.id].played += 1;
      stats[team2.id].played += 1;
      stats[team1.id].goalsFor += score1;
      stats[team2.id].goalsFor += score2;
      stats[team1.id].goalsAgainst += score2;
      stats[team2.id].goalsAgainst += score1;
      stats[team1.id].goalDifference = stats[team1.id].goalsFor - stats[team1.id].goalsAgainst;
      stats[team2.id].goalDifference = stats[team2.id].goalsFor - stats[team2.id].goalsAgainst;

      if (score1 > score2) {
        stats[team1.id].win += 1;
        stats[team1.id].points += 3;
        stats[team2.id].loss += 1;
      } else if (score2 > score1) {
        stats[team2.id].win += 1;
        stats[team2.id].points += 3;
        stats[team1.id].loss += 1;
      } else {
        stats[team1.id].draw += 1;
        stats[team2.id].draw += 1;
        stats[team1.id].points += 1;
        stats[team2.id].points += 1;
      }
    }
  });

  const standings: Omit<Standing, 'rank'>[] = teams.map((team) => ({
    team,
    ...stats[team.id],
  }));

  standings.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    return b.goalsFor - a.goalsFor;
  });

  return standings.map((standing, index) => ({
    ...standing,
    rank: index + 1,
  }));
}
