'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Loader2,
  Lightbulb, BookOpen,
} from 'lucide-react';
import { getTopicBySlug, getTopicNavigation } from '@/data/mf-gyan';
import { useGyanProgress } from '@/lib/hooks/useGyanProgress';

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.categorySlug as string;
  const topicSlug = params.topicSlug as string;
  const [employeeCode, setEmployeeCode] = useState('');
  const [loading, setLoading] = useState(true);
  const { isComplete, markComplete, markVisited } = useGyanProgress(employeeCode);

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
      {/* Sticky Header */}
      <div className={`sticky top-0 z-10 bg-gradient-to-r ${category.gradientFrom} ${category.gradientTo} text-white shadow-sm`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/rm/learn/${categorySlug}`}
            className="text-white/70 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/60">{category.title}</p>
            <h1 className="text-sm font-semibold truncate">{topic.title}</h1>
          </div>
          {completed && (
            <div className="bg-white/20 rounded-full p-1">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Lesson Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
          {topic.title}
        </h2>
        <p className="text-slate-500 text-sm mb-8">{topic.description}</p>

        {/* Body paragraphs */}
        <div className="prose prose-slate prose-sm sm:prose-base max-w-none">
          {topic.content.map((para, i) => (
            <p key={i} className="text-slate-600 leading-relaxed mb-4 text-[15px]">
              {para}
            </p>
          ))}
        </div>

        {/* Key Takeaways */}
        {topic.keyTakeaways.length > 0 && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
            <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" /> Key Takeaways
            </h3>
            <ul className="space-y-2">
              {topic.keyTakeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-900/80">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {point}
                </li>
              ))}
            </ul>
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
