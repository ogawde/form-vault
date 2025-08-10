'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient, Submission } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/toaster';
import { Trash2, Download } from 'lucide-react';

export default function SubmissionsPage() {
  const params = useParams();
  const formId = params.id as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [formId]);

  const loadSubmissions = async () => {
    try {
      const response = await apiClient.get<any>('/api/forms/' + formId + '/submissions?limit=100');
      setSubmissions(response.submissions || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/forms/${formId}/submissions/${submissionId}`);
      toast({
        title: 'Success!',
        description: 'Submission deleted successfully',
      });
      loadSubmissions();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/forms/${formId}/export?format=csv`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form-${formId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success!',
        description: 'Submissions exported successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (!search) return true;
    const dataStr = JSON.stringify(sub.data).toLowerCase();
    return dataStr.includes(search.toLowerCase());
  });

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Submissions</h1>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search submissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No submissions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm text-muted-foreground">
                    {new Date(submission.createdAt).toLocaleString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(submission.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-sm bg-gray-50 p-4 rounded border overflow-x-auto">
                  {JSON.stringify(submission.data, null, 2)}
                </pre>
                <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                  {submission.ipAddress && <div>IP: {submission.ipAddress}</div>}
                  {submission.referrer && <div>Referrer: {submission.referrer}</div>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

