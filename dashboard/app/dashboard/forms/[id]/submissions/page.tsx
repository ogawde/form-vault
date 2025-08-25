'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, Submission } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/toaster';
import { Trash2, Download, ArrowLeft, Search, Calendar, Globe, MapPin, FileText } from 'lucide-react';
import { AnimatedButton } from '@/components/animated/animated-button';
import { AnimatedCard } from '@/components/animated/animated-card';
import Link from 'next/link';

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

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
    setExporting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/forms/${formId}/export?format=csv`, {
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
    } finally {
      setExporting(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (!search) return true;
    const dataStr = JSON.stringify(sub.data).toLowerCase();
    return dataStr.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div>
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-10 w-40 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-32 w-full" />
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
        className="mb-8"
      >
        <Link href={`/dashboard/forms/${formId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Form
          </Button>
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Submissions</h1>
            <p className="text-muted-foreground">
              {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <AnimatedButton onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </AnimatedButton>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {filteredSubmissions.length === 0 ? (
          <AnimatedCard>
            <Card>
              <CardContent className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  {search ? 'No results found' : 'No submissions yet'}
                </h3>
                <p className="text-muted-foreground">
                  {search ? 'Try a different search term' : 'Submissions will appear here once your form receives data'}
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission, index) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(submission.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(submission.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </motion.button>
                    </div>
                    <div className="bg-muted p-4 rounded-lg border mb-4">
                      <pre className="text-sm font-mono overflow-x-auto">
                        {JSON.stringify(submission.data, null, 2)}
                      </pre>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {submission.ipAddress && (
                        <Badge variant="secondary" className="gap-1">
                          <MapPin className="w-3 h-3" />
                          {submission.ipAddress}
                        </Badge>
                      )}
                      {submission.referrer && (
                        <Badge variant="secondary" className="gap-1">
                          <Globe className="w-3 h-3" />
                          <span className="max-w-[200px] truncate">{submission.referrer}</span>
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

