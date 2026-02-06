export type Team = {
  id: string;
  name: string;
  logoUrl: string;
  dataAiHint: string;
};

export type Match = {
  id: string;
  team1: Team;
  team2: Team;
  score1: number | null;
  score2: number | null;
  date: string;
  status: 'played' | 'upcoming';
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
