'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, CheckCircle, Clock, ChevronRight, Loader2,
  TrendingUp, Landmark, Layers, BarChart3, Calculator, Globe, Building2,
} from 'lucide-react';
import { getCategoryBySlug } from '@/data/mf-gyan';
import { useGyanProgress } from '@/lib/hooks/useGyanProgress';

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp, Landmark, Layers, BarChart3, Calculator, Globe, Building2,
};

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.categorySlug as string;
  const [employeeCode, setEmployeeCode] = useState('');
  const [loading, setLoading] = useState(true);
  const { isComplete, getCategoryProgress } = useGyanProgress(employeeCode);

  const category = getCategoryBySlug(categorySlug);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/rm/auth');
        if (!res.ok) { router.push('/rm/login'); return; }
        const data = await res.json();
        setEmployeeCode(data.user.employeeCode);
      } catch {
        router.push('/rm/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-slate-500">Category not found</p>
        <Link href="/rm/learn" className="text-brand hover:underline text-sm">
          Back to MF Gyan
        </Link>
      </div>
    );
  }

  const Icon = ICON_MAP[category.icon] || BookOpen;
  const progress = getCategoryProgress(category.id, category.topics.length);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${category.gradientFrom} ${category.gradientTo} text-white`}>
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
          <Link
            href="/rm/learn"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" /> All Categories
          </Link>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{category.title}</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {category.topics.length} lessons &middot; {progress.completed} completed
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 bg-white/10 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Topic List */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-2">
          {category.topics.map((topic, idx) => {
            const completed = isComplete(category.id, topic.id);

            return (
              <Link
                key={topic.id}
                href={`/rm/learn/${category.id}/${topic.id}`}
                className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  completed
                    ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Number / Check */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  completed
                    ? 'bg-emerald-100 text-emerald-700'
                    : `${category.bgColor} ${category.color}`
                }`}>
                  {completed ? (
                    <CheckCircle className="w-4.5 h-4.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${
                    completed ? 'text-emerald-800' : 'text-slate-800'
                  } group-hover:text-primary-700 transition`}>
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {topic.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {topic.readTime}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
