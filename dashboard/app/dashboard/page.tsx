'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient, Form } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { toast } from '@/components/toaster';
import { Copy, FileText, Plus, Check } from 'lucide-react';
import { AnimatedCard } from '@/components/animated/animated-card';
import { AnimatedButton } from '@/components/animated/animated-button';

export default function DashboardPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, formId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(formId);
    toast({
      title: 'Copied!',
      description: 'Endpoint URL copied to clipboard',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalSubmissions = forms.reduce((sum, form) => sum + form.submissionCount, 0);
  const activeForms = forms.filter((f) => f.isActive).length;

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">Forms</h1>
          <p className="text-muted-foreground">Manage your form endpoints</p>
        </div>
        <Link href="/dashboard/forms/new">
          <AnimatedButton>
            <Plus className="w-4 h-4 mr-2" />
            Create New Form
          </AnimatedButton>
        </Link>
      </motion.div>

      {forms.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 md:grid-cols-3 mb-8"
        >
          <AnimatedCard delay={0.1}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Forms</p>
                    <p className="text-3xl font-bold mt-1">{forms.length}</p>
                  </div>
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Forms</p>
                    <p className="text-3xl font-bold mt-1">{activeForms}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.3}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                    <p className="text-3xl font-bold mt-1">{totalSubmissions}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>
      )}

      {forms.length === 0 ? (
        <AnimatedCard>
          <Card>
            <CardContent className="text-center py-16">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center"
              >
                <FileText className="w-10 h-10 text-muted-foreground" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
              <p className="text-muted-foreground mb-6">Get started by creating your first form endpoint</p>
              <Link href="/dashboard/forms/new">
                <AnimatedButton>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Form
                </AnimatedButton>
              </Link>
            </CardContent>
          </Card>
        </AnimatedCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form, index) => (
            <AnimatedCard key={form.id} delay={index * 0.1}>
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{form.name}</CardTitle>
                    <Badge variant={form.isActive ? 'default' : 'secondary'}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {form.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-medium">Endpoint</div>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                        <code className="text-xs flex-1 truncate font-mono">{form.endpoint}</code>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyToClipboard(form.endpoint, form.id)}
                          className="p-1.5 hover:bg-background rounded transition-colors"
                        >
                          {copiedId === form.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{form.submissionCount}</span>
                      <span className="text-muted-foreground">submissions</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Link href={`/dashboard/forms/${form.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">View</Button>
                    </Link>
                    <Link href={`/dashboard/forms/${form.id}/submissions`} className="flex-1">
                      <Button variant="outline" className="w-full">Submissions</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}

