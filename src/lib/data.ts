import type { Team, Match, Standing, StoredMatch } from '@/lib/types';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
  Firestore,
} from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export const LEAGUE_ID = 'default-league';

export async function saveTeams(firestore: Firestore, teams: Team[]) {
  const participantsCollection = collection(firestore, 'leagues', LEAGUE_ID, 'participants');
  
  // Nuke and pave
  const existingDocs = await getDocs(participantsCollection);
  const deleteBatch = writeBatch(firestore);
  existingDocs.forEach(doc => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();

  const addBatch = writeBatch(firestore);
  teams.forEach((team) => {
    const { id, ...teamData } = team;
    const newTeamRef = doc(participantsCollection, id);
    addBatch.set(newTeamRef, teamData);
  });
  await addBatch.commit();
}

export function updateMatch(firestore: Firestore, updatedMatch: Match): void {
    const matchRef = doc(firestore, 'leagues', LEAGUE_ID, 'matches', updatedMatch.id);
    const { team1, team2, ...rest } = updatedMatch;
    const storableMatch: StoredMatch = {
        ...rest,
        team1Id: team1.id,
        team2Id: team2.id,
    };
    updateDocumentNonBlocking(matchRef, storableMatch);
}

export async function setMatches(firestore: Firestore, newMatches: Match[]): Promise<void> {
    const matchesCollection = collection(firestore, 'leagues', LEAGUE_ID, 'matches');
    
    // Delete upcoming
    const q = query(matchesCollection, where('status', '==', 'upcoming'));
    const oldMatches = await getDocs(q);
    const deleteBatch = writeBatch(firestore);
    oldMatches.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    
    // Add new
    if (newMatches.length > 0) {
      const addBatch = writeBatch(firestore);
      newMatches.forEach(match => {
          const { team1, team2, ...rest } = match;
          const storableMatch: StoredMatch = {
              ...rest,
              id: match.id,
              team1Id: team1.id,
              team2Id: team2.id,
          };
          const newMatchRef = doc(matchesCollection, match.id);
          addBatch.set(newMatchRef, storableMatch);
      });
      await addBatch.commit();
    }
}

export async function clearAllMatches(firestore: Firestore): Promise<void> {
  const matchesCollection = collection(firestore, 'leagues', LEAGUE_ID, 'matches');
  const allMatchesSnap = await getDocs(matchesCollection);
  const batch = writeBatch(firestore);
  allMatchesSnap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
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
        stats[team1.id].points += 1;
        stats[team2.id].loss += 1;
      } else if (score2 > score1) {
        stats[team2.id].win += 1;
        stats[team2.id].points += 1;
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
