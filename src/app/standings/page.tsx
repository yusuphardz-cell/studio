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

export default function StandingsPage() {
  const teams = getTeams();
  const matches = getMatches();
  const standings = calculateStandings(teams, matches);

  return (
    <div className="flex-1 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
          <CardDescription>
            Official standings for the 2024 season.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
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
                      <Avatar>
                        <AvatarImage
                          src={s.team.logoUrl}
                          alt={s.team.name}
                          data-ai-hint={s.team.dataAiHint}
                        />
                        <AvatarFallback>{s.team.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{s.team.name}</span>
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
