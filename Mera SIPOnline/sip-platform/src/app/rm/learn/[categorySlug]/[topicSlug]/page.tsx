'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Loader2,
  Lightbulb, BookOpen, Sparkles, Target,
} from 'lucide-react';
import { getTopicBySlug, getTopicNavigation } from '@/data/mf-gyan';
import { useGyanProgress } from '@/lib/hooks/useGyanProgress';
import { RMNav } from '@/components/rm/RMNav';

/* Slide accent colors — cycles per paragraph */
const SLIDE_ACCENTS = [
  { bg: 'bg-blue-50/60', border: 'border-blue-200/40', num: 'bg-blue-100 text-blue-700', icon: 'text-blue-400' },
  { bg: 'bg-emerald-50/60', border: 'border-emerald-200/40', num: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-400' },
  { bg: 'bg-violet-50/60', border: 'border-violet-200/40', num: 'bg-violet-100 text-violet-700', icon: 'text-violet-400' },
  { bg: 'bg-amber-50/60', border: 'border-amber-200/40', num: 'bg-amber-100 text-amber-700', icon: 'text-amber-400' },
  { bg: 'bg-rose-50/60', border: 'border-rose-200/40', num: 'bg-rose-100 text-rose-700', icon: 'text-rose-400' },
];

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.categorySlug as string;
  const topicSlug = params.topicSlug as string;
  const [employeeCode, setEmployeeCode] = useState('');
  const [user, setUser] = useState<{ name: string; designation: string; entity: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { isComplete, markComplete, markVisited } = useGyanProgress(employeeCode);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/rm/auth');
        if (!res.ok) { router.push('/rm/login'); return; }
        const data = await res.json();
        setEmployeeCode(data.user.employeeCode);
        setUser({ name: data.user.name, designation: data.user.designation, entity: data.user.entity });
      } catch {
        router.push('/rm/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/rm/auth', { method: 'DELETE' });
    router.push('/rm/login');
  };

  // Mark as visited when topic loads
  useEffect(() => {
    if (employeeCode && categorySlug && topicSlug) {
      markVisited(categorySlug, topicSlug);
    }
  }, [employeeCode, categorySlug, topicSlug, markVisited]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  const result = getTopicBySlug(categorySlug, topicSlug);
  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-slate-500">Topic not found</p>
        <Link href="/rm/learn" className="text-brand hover:underline text-sm">
          Back to MF Gyan
        </Link>
      </div>
    );
  }

  const { category, topic } = result;
  const { prev, next } = getTopicNavigation(categorySlug, topicSlug);
  const completed = isComplete(categorySlug, topicSlug);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Tab Navigation */}
      <RMNav
        userName={user?.name}
        designation={user?.designation}
        entity={user?.entity}
        onLogout={handleLogout}
      />

      {/* Presentation Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Title Card */}
        <div className={`relative rounded-2xl bg-gradient-to-br ${category.gradientFrom} ${category.gradientTo} text-white p-6 sm:p-8 mb-6 overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider mb-4 backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              {category.title}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3">
              {topic.title}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">{topic.description}</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-white/60">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {topic.readTime} read</span>
              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {topic.content.length} sections</span>
            </div>
          </div>
        </div>

        {/* Slide-style Content Cards */}
        <div className="space-y-4">
          {topic.content.map((para, i) => {
            const accent = SLIDE_ACCENTS[i % SLIDE_ACCENTS.length];
            return (
              <div
                key={i}
                className={`rounded-xl border ${accent.border} ${accent.bg} p-5 sm:p-6 transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${accent.num} flex items-center justify-center text-xs font-bold`}>
                    {i + 1}
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[15px] flex-1">
                    {para}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slide dots indicator */}
        <div className="flex justify-center gap-1.5 mt-6">
          {topic.content.map((_, i) => {
            const accent = SLIDE_ACCENTS[i % SLIDE_ACCENTS.length];
            return (
              <div key={i} className={`w-2 h-2 rounded-full ${accent.num.split(' ')[0]}`} />
            );
          })}
        </div>

        {/* Key Takeaways — Grid Style */}
        {topic.keyTakeaways.length > 0 && (
          <div className="mt-8 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/30 p-6 sm:p-7">
            <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-base">
              <div className="bg-amber-100 p-1.5 rounded-lg">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              Key Takeaways
            </h3>
            <div className="space-y-3">
              {topic.keyTakeaways.map((point, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/60 rounded-xl p-3.5 border border-amber-100/50">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-amber-900/80 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mark Complete Button */}
        <div className="mt-8 flex justify-center">
          {completed ? (
            <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-6 py-3 text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
              Lesson Completed
            </div>
          ) : (
            <button
              onClick={() => markComplete(categorySlug, topicSlug)}
              className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white rounded-full px-6 py-3 text-sm font-semibold transition cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              Mark as Complete
            </button>
          )}
        </div>

        {/* Prev / Next Navigation */}
        <div className="mt-8 flex gap-3">
          {prev ? (
            <Link
              href={`/rm/learn/${categorySlug}/${prev.id}`}
              className="flex-1 flex items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition text-left"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Previous</p>
                <p className="text-sm font-medium text-slate-700 truncate">{prev.title}</p>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {next ? (
            <Link
              href={`/rm/learn/${categorySlug}/${next.id}`}
              className="flex-1 flex items-center justify-end gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition text-right"
            >
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Next</p>
                <p className="text-sm font-medium text-slate-700 truncate">{next.title}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </Link>
          ) : (
            <Link
              href={`/rm/learn/${categorySlug}`}
              className="flex-1 flex items-center justify-end gap-2 p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:border-emerald-300 transition text-right"
            >
              <div>
                <p className="text-xs text-emerald-500">Finished!</p>
                <p className="text-sm font-medium text-emerald-700">Back to {category.title}</p>
              </div>
              <BookOpen className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
