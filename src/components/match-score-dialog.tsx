'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Match } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const scoreSchema = z.object({
  score1: z.coerce.number().int().min(0, 'Score must be non-negative'),
  score2: z.coerce.number().int().min(0, 'Score must be non-negative'),
});

type ScoreFormValues = z.infer<typeof scoreSchema>;

interface MatchScoreDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match;
  onSave: (match: Match, score1: number, score2: number) => void;
}

export function MatchScoreDialog({
  isOpen,
  onOpenChange,
  match,
  onSave,
}: MatchScoreDialogProps) {
  const form = useForm<ScoreFormValues>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      score1: match.score1 ?? 0,
      score2: match.score2 ?? 0,
    },
  });

  const onSubmit = (data: ScoreFormValues) => {
    onSave(match, data.score1, data.score2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Score</DialogTitle>
          <DialogDescription>
            Enter the final score for the match.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="score1"
                render={({ field }) => (
                  <FormItem className="text-center">
                    <FormLabel>{match.team1.name}</FormLabel>
                    <FormControl>
                      <Input type="number" className="text-center text-2xl h-16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="score2"
                render={({ field }) => (
                  <FormItem className="text-center">
                    <FormLabel>{match.team2.name}</FormLabel>
                    <FormControl>
                      <Input type="number" className="text-center text-2xl h-16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Score</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
