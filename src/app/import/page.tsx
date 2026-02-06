'use client';

import * as React from 'react';
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


export default function ImportPage() {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setStatus('idle');
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        setStatus('error');
        setMessage('Could not read file.');
        return;
      }
      
      try {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            setStatus('error');
            setMessage('CSV file must contain a header and at least one team name.');
            return;
        }

        const header = lines[0].trim().toLowerCase();
        if (header !== 'name') {
            setStatus('error');
            setMessage('Invalid CSV format. The first line must be a header with a single column: "name".');
            return;
        }
        
        const teamNamesFromFile = lines.slice(1).map(line => line.trim()).filter(Boolean);

        if (teamNamesFromFile.length === 0) {
            setStatus('error');
            setMessage('No team names found in the file.');
            return;
        }

        const newTeams: Team[] = teamNamesFromFile.map((name, index) => {
            const id = `team-${Date.now()}-${index}`;
            return {
                id,
                name,
                logoUrl: `https://picsum.photos/seed/${id}/200/200`,
                dataAiHint: name.split(' ')[0].toLowerCase()
            };
        });

        saveTeams(newTeams);
        setMatches([]); // Clear existing matches as they are now invalid
        
        const successMsg = `${newTeams.length} teams imported, replacing all previous data. Existing matches have been cleared.`;
        
        setStatus('success');
        setMessage(successMsg);
        toast({
            title: 'Import Successful',
            description: successMsg,
        });

      } catch (err) {
        setStatus('error');
        setMessage('An error occurred while parsing the file.');
        console.error(err);
      }
    };
    reader.onerror = () => {
        setStatus('error');
        setMessage('Failed to read file.');
    }

    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setFile(null);
  };
  
  const handleDownloadTemplate = () => {
    const headers = ['name'];
    const exampleRow = ['New Team FC'];
    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "teams_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Import Teams</CardTitle>
          <CardDescription>
            Upload a CSV file with team names to add them in bulk. This will replace all existing teams and matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 md:space-y-2 p-4 border rounded-lg flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h4 className="font-semibold">CSV Format Instructions</h4>
              <p className="text-sm text-muted-foreground">
                Your CSV file must have a header row with a single column: <code>name</code>.
              </p>
              <p className="text-sm text-muted-foreground">
                Example row: <code>New Team FC</code>
              </p>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor="csv-upload" className="font-medium text-sm">Upload CSV File</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
              <Button onClick={handleImport} disabled={!file}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </div>

          {status !== 'idle' && (
            <Alert variant={status === 'error' ? 'destructive' : 'default'}>
                {status === 'success' ? <FileCheck2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
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
