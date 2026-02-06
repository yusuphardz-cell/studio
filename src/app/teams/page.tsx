'use client';

import * as React from 'react';
import { getTeams } from '@/lib/data';
import type { Team } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function TeamsPage() {
  const [teams, setTeams] = React.useState<Team[]>([]);

  React.useEffect(() => {
    setTeams(getTeams());
  }, []);

  return (
    <div className="flex-1 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            All teams participating in the 2026 season.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {teams.map((team) => (
                <Card key={team.id} className="text-center">
                  <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={team.logoUrl}
                        alt={team.name}
                        data-ai-hint={team.dataAiHint}
                      />
                      <AvatarFallback>{team.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{team.name}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              No teams found. You can add teams via the Import page.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
