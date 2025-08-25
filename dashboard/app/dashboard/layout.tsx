'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LayoutDashboard, LogOut, FileText, Plus } from 'lucide-react';
import { AnimatedButton } from '@/components/animated/animated-button';
import { PageTransition } from '@/components/animated/page-transition';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/forms/new', label: 'New Form', icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-64 bg-white border-r border-border flex flex-col"
      >
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
            >
              <FileText className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-bold">FormVault</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="px-4 py-3 mb-3 rounded-lg bg-muted">
            <div className="text-sm font-medium">{user?.email || 'User'}</div>
            {user?.name && (
              <div className="text-xs text-muted-foreground mt-1">{user.name}</div>
            )}
          </div>
          <AnimatedButton
            variant="ghost"
            onClick={logout}
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </AnimatedButton>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-auto">
        <PageTransition>
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </PageTransition>
      </main>
    </div>
  );
}

