'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, TrendingUp, Landmark, Layers, BarChart3, Calculator,
  Globe, Building2, GraduationCap, Loader2, ChevronRight,
} from 'lucide-react';
import { ALL_GYAN_CATEGORIES, getGyanStats } from '@/data/mf-gyan';
import { useGyanProgress } from '@/lib/hooks/useGyanProgress';
import { RMNav } from '@/components/rm/RMNav';

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp, Landmark, Layers, BarChart3, Calculator, Globe, Building2,
};

export default function MFGyanHub() {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState('');
  const [user, setUser] = useState<{ name: string; designation: string; entity: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { getCategoryProgress, getTotalProgress } = useGyanProgress(employeeCode);
  const stats = getGyanStats();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/rm/auth');
        if (!res.ok) { router.push('/admin/login'); return; }
        const data = await res.json();
        setEmployeeCode(data.user.employeeCode);
        setUser({ name: data.user.name, designation: data.user.designation, entity: data.user.entity });
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/rm/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  const totalProgress = getTotalProgress(stats.topics);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Tab Navigation */}
      <RMNav
        userName={user?.name}
        designation={user?.designation}
        entity={user?.entity}
        onLogout={handleLogout}
      />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary-700 to-brand-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">MF Gyan Bhandar</h1>
              <p className="text-white/70 text-sm mt-1">
                {stats.categories} categories &middot; {stats.topics} lessons &middot; Learn at your own pace
              </p>
            </div>
          </div>

          {/* Overall progress */}
          <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Your Progress, {user?.name?.split(' ')[0] || 'Team Member'}
              </span>
              <span className="text-sm font-semibold">
                {totalProgress.completed}/{totalProgress.total} lessons
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div
                className="bg-accent h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${totalProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_GYAN_CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || BookOpen;
            const catProgress = getCategoryProgress(cat.id, cat.topics.length);

            return (
              <Link
                key={cat.id}
                href={`/rm/learn/${cat.id}`}
                className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Color bar top */}
                <div className={`h-1.5 bg-gradient-to-r ${cat.gradientFrom} ${cat.gradientTo}`} />

                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`${cat.bgColor} ${cat.color} p-2.5 rounded-xl`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 group-hover:text-primary-700 transition">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cat.topics.length} lessons
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition mt-1" />
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                    {cat.description}
                  </p>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full bg-gradient-to-r ${cat.gradientFrom} ${cat.gradientTo} transition-all duration-500`}
                        style={{ width: `${catProgress.percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                      {catProgress.completed}/{catProgress.total}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
