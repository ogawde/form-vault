'use client';

import { useState, useEffect } from 'react';
import { apiClient, Form } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from '@/components/toaster';
import { Copy } from 'lucide-react';

export default function DashboardPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const response = await apiClient.get<any>('/api/forms');
      setForms(response.forms || []);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-muted-foreground mt-2">Manage your form endpoints</p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button>Create New Form</Button>
        </Link>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No forms yet</p>
            <Link href="/dashboard/forms/new">
              <Button>Create Your First Form</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{form.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {form.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Endpoint</div>
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
                  <div className="text-sm">
                    <span className="font-medium">{form.submissionCount}</span> submissions
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/forms/${form.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">View</Button>
                    </Link>
                    <Link href={`/dashboard/forms/${form.id}/submissions`} className="flex-1">
                      <Button variant="outline" className="w-full">Submissions</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

