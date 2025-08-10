'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, Form, Submission } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/toaster';
import { Copy, Trash2 } from 'lucide-react';

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      const response = await apiClient.get<Form & { recentSubmissions: Submission[] }>(`/api/forms/${formId}`);
      setForm(response as any);
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this form? This will delete all submissions.')) {
      return;
    }

    try {
      await apiClient.delete(`/api/forms/${formId}`);
      toast({
        title: 'Success!',
        description: 'Form deleted successfully',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Endpoint URL copied to clipboard',
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!form) {
    return <div className="text-center py-12">Form not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{form.name}</h1>
          <p className="text-muted-foreground mt-2">{form.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/forms/${formId}/submissions`)}>
            View All Submissions
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Form
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Endpoint URL</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                <code className="text-xs flex-1 truncate">{form.endpoint}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(form.endpoint)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Status</div>
              <div className={`inline-block px-2 py-1 rounded text-sm ${form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {form.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Submissions</div>
              <div className="text-2xl font-bold">{form.submissionCount}</div>
            </div>

            {form.redirectUrl && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Redirect URL</div>
                <div className="text-sm">{form.redirectUrl}</div>
              </div>
            )}

            {form.notificationEmail && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Notification Email</div>
                <div className="text-sm">{form.notificationEmail}</div>
              </div>
            )}

            <div>
              <div className="text-sm text-muted-foreground mb-1">Created</div>
              <div className="text-sm">{new Date(form.createdAt).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Last 5 submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {(form as any).recentSubmissions && (form as any).recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {(form as any).recentSubmissions.map((submission: Submission, idx: number) => (
                  <div key={submission.id} className="border-b pb-3 last:border-b-0">
                    <div className="text-xs text-muted-foreground mb-1">
                      {new Date(submission.createdAt).toLocaleString()}
                    </div>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(submission.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No submissions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

