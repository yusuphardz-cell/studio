import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Team, Match, Standing } from '@/lib/types';
import { addDays } from 'date-fns';

const defaultTeams: Team[] = PlaceHolderImages.map((img) => ({
  id: img.id,
  name: img.imageHint.replace(' logo', '').replace(/^\w/, (c) => c.toUpperCase()) + 's',
  logoUrl: img.imageUrl,
  dataAiHint: img.imageHint,
}));

function getDefaultMatches(teams: Team[]): Match[] {
    if (teams.length < 8) return [];
    return [
        { id: 'match-1', team1: teams[0], team2: teams[1], score1: 2, score2: 1, date: new Date().toISOString(), status: 'played' },
        { id: 'match-2', team1: teams[2], team2: teams[3], score1: 0, score2: 0, date: new Date().toISOString(), status: 'played' },
        { id: 'match-3', team1: teams[4], team2: teams[5], score1: null, score2: null, date: addDays(new Date(), 2).toISOString(), status: 'upcoming' },
        { id: 'match-4', team1: teams[6], team2: teams[7], score1: null, score2: null, date: addDays(new Date(), 3).toISOString(), status: 'upcoming' },
    ];
}

// Teams
export function getTeams(): Team[] {
  if (typeof window === 'undefined') return defaultTeams;
  const stored = window.localStorage.getItem('ligamanager-teams');
  return stored ? JSON.parse(stored) : defaultTeams;
}

export function saveTeams(teams: Team[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('ligamanager-teams', JSON.stringify(teams));
}

// Matches
export function getMatches(): Match[] {
    if (typeof window === 'undefined') return getDefaultMatches(defaultTeams);
    
    const teams = getTeams();
    const stored = window.localStorage.getItem('ligamanager-matches');
    
    if (stored) {
        const rawMatches = JSON.parse(stored);
        return rawMatches.map((match: any) => ({
            ...match,
            team1: teams.find(t => t.id === match.team1Id),
            team2: teams.find(t => t.id === match.team2Id),
        })).filter((m: { team1: Team, team2: Team }) => m.team1 && m.team2);
    }
    
    // if no matches stored, return defaults only if teams are default
    const storedTeams = window.localStorage.getItem('ligamanager-teams');
    if (!storedTeams) {
        return getDefaultMatches(teams);
    }
    return [];
}

export function updateMatch(updatedMatch: Match): void {
    const allMatches = getMatches();
    const index = allMatches.findIndex((m) => m.id === updatedMatch.id);
    if (index !== -1) {
        allMatches[index] = updatedMatch;
        setMatches(allMatches);
    }
}

export function setMatches(newMatches: Match[]): void {
    if (typeof window === 'undefined') return;
    // When saving, just store team IDs
    const storableMatches = newMatches.map(m => ({
        id: m.id,
        team1Id: m.team1.id,
        team2Id: m.team2.id,
        score1: m.score1,
        score2: m.score2,
        date: m.date,
        status: m.status
    }));
    window.localStorage.setItem('ligamanager-matches', JSON.stringify(storableMatches));
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
      if (!match.team1 || !match.team2) return;
      const { team1, team2, score1, score2 } = match;

      if (!stats[team1.id] || !stats[team2.id]) return;

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
