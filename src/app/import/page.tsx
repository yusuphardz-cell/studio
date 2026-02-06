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

    // This is a placeholder for the actual CSV parsing and data handling.
    // In a real app, you would read the file content and add new teams.
    console.log('Importing file:', file.name);
    
    // Simulate a successful import
    setTimeout(() => {
        setStatus('success');
        setMessage(`${file.name} has been imported successfully. New teams were added.`);
    }, 1000);

    // To simulate an error:
    // setTimeout(() => {
    //     setStatus('error');
    //     setMessage(`Error in ${file.name} on line 2: Team name cannot be empty.`);
    // }, 1000);


    toast({
      title: 'Import Started',
      description: `Processing ${file.name}...`,
    });
    
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
            Upload a CSV file with team names to add them in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 p-4 border rounded-lg flex justify-between items-start">
            <div>
              <h4 className="font-semibold">CSV Format Instructions</h4>
              <p className="text-sm text-muted-foreground">
                Your CSV file must have a header row with a single column: <code>name</code>.
              </p>
              <p className="text-sm text-muted-foreground">
                Example row: <code>New Team FC</code>
              </p>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor="csv-upload" className="font-medium text-sm">Upload CSV File</label>
            <div className="flex gap-2">
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
                {status === 'success' ? 'Import Successful' : 'Import Failed'}
              </AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
