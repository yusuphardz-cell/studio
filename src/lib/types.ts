export type Team = {
  id: string;
  name: string;
  logoUrl: string;
  dataAiHint: string;
};

// This represents the object in Firestore
export type StoredMatch = {
  id: string;
  team1Id: string;
  team2Id: string;
  score1: number | null;
  score2: number | null;
  date: string;
  status: 'played' | 'upcoming';
};

// This is what we'll use in components, after populating team data
export type Match = Omit<StoredMatch, 'team1Id' | 'team2Id'> & {
  team1: Team;
  team2: Team;
};

export type Standing = {
  rank: number;
  team: Team;
  played: number;
  win: number;
  draw: number;
  loss: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};
