'use client';

import * as React from 'react';
import * as XLSX from 'xlsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileCheck2, AlertCircle, Download } from 'lucide-react';
import { saveTeams, setMatches } from '@/lib/data';
import type { Team } from '@/lib/types';
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
import { useFirestore } from '@/firebase';

export default function ImportPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [message, setMessage] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setStatus('idle');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV or Excel file to import.',
        variant: 'destructive',
      });
      return;
    }

    const processTeamNames = async (teamNames: string[]) => {
      if (!teamNames || teamNames.length === 0) {
        setStatus('error');
        setMessage('No player names found in the file.');
        return;
      }

      try {
        const newTeams: Team[] = teamNames.map((name, index) => {
          const id = `team-${Date.now()}-${index}`;
          return {
            id,
            name,
            logoUrl: `https://picsum.photos/seed/${id}/200/200`,
            dataAiHint: name.split(' ')[0].toLowerCase(),
          };
        });

        await saveTeams(firestore, newTeams);
        await setMatches(firestore, []);

        const successMsg = `${newTeams.length} players imported, replacing all previous data. Existing games have been cleared.`;
        setStatus('success');
        setMessage(successMsg);
        toast({
          title: 'Import Successful',
          description: successMsg,
        });
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred while saving the data.');
        console.error(err);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setFile(null);
      }
    };

    const reader = new FileReader();

    reader.onerror = () => {
      setStatus('error');
      setMessage('Failed to read file.');
    };

    if (file.name.endsWith('.csv')) {
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          const lines = text
            .split(/\r\n|\n/)
            .filter((line) => line.trim() !== '');
          if (lines.length < 2) {
            throw new Error(
              'File must contain a header and at least one player name.'
            );
          }
          const header = lines[0].trim().toLowerCase();
          if (header !== 'name') {
            throw new Error(
              'Invalid format. The first column header must be "name".'
            );
          }
          const teamNames = lines
            .slice(1)
            .map((line) => line.trim())
            .filter(Boolean);
          await processTeamNames(teamNames);
        } catch (err: any) {
          setStatus('error');
          setMessage(
            err.message || 'An error occurred while parsing the CSV file.'
          );
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as string[][];

          if (json.length < 2 || !json[0] || json[0].length === 0) {
            throw new Error(
              'File must contain a header and at least one player name.'
            );
          }
          const header = String(json[0][0]).trim().toLowerCase();
          if (header !== 'name') {
            throw new Error(
              'Invalid format. The first column header must be "name".'
            );
          }
          const teamNames = json
            .slice(1)
            .map((row) => row[0] && String(row[0]).trim())
            .filter(Boolean);
          await processTeamNames(teamNames);
        } catch (err: any) {
          setStatus('error');
          setMessage(
            err.message || 'An error occurred while parsing the Excel file.'
          );
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a CSV or Excel (.xls, .xlsx) file.',
        variant: 'destructive',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      return;
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['name'];
    const exampleRow = ['John Doe'];
    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-f8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'players_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Import Players</CardTitle>
          <CardDescription>
            Upload a CSV or Excel file with player names to add them in bulk.
            This will replace all existing players and games.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 md:space-y-2 p-4 border rounded-lg flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h4 className="font-semibold">File Format Instructions</h4>
              <p className="text-sm text-muted-foreground">
                Your CSV or Excel file must have a header row where the first
                column is titled <code>name</code>. Each subsequent row should
                contain a single player name in that first column.
              </p>
              <p className="text-sm text-muted-foreground">
                Only data in the first column will be imported.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full md:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor="csv-upload" className="font-medium text-sm">
              Upload CSV or Excel File
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={!file}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will replace all existing players and games.
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleImport}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {status !== 'idle' && (
            <Alert variant={status === 'error' ? 'destructive' : 'default'}>
              {status === 'success' ? (
                <FileCheck2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {status === 'success' ? 'Import Complete' : 'Import Failed'}
              </AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
