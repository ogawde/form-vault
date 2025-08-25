'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiClient, Form, Submission } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/toaster';
import { Copy, Trash2, ArrowLeft, Check, FileText, Calendar, Mail, ExternalLink } from 'lucide-react';
import { AnimatedCard } from '@/components/animated/animated-card';
import { AnimatedButton } from '@/components/animated/animated-button';
import Link from 'next/link';

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Endpoint URL copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Form not found</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{form.name}</h1>
            <p className="text-muted-foreground text-lg">{form.description || 'No description'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/forms/${formId}/submissions`)}>
              View All Submissions
            </Button>
            <AnimatedButton variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Form
            </AnimatedButton>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <AnimatedCard delay={0.1}>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Form Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Endpoint URL</div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                  <code className="text-xs flex-1 truncate font-mono">{form.endpoint}</code>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => copyToClipboard(form.endpoint)}
                    className="p-1.5 hover:bg-background rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Status</div>
                  <Badge variant={form.isActive ? 'default' : 'secondary'} className="mt-1">
                    {form.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Submissions</div>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold mt-1"
                  >
                    {form.submissionCount}
                  </motion.div>
                </div>
              </div>

              {form.redirectUrl && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Redirect URL
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">{form.redirectUrl}</div>
                </div>
              )}

              {form.notificationEmail && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Notification Email
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">{form.notificationEmail}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Created
                </div>
                <div className="text-sm">{new Date(form.createdAt).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Recent Submissions</CardTitle>
              <CardDescription>Last 5 submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {(form as any).recentSubmissions && (form as any).recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {(form as any).recentSubmissions.map((submission: Submission, idx: number) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(submission.createdAt).toLocaleString()}
                      </div>
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto border">
                        {JSON.stringify(submission.data, null, 2)}
                      </pre>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No submissions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    </div>
  );
}

