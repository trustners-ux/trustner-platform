'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, CheckCircle, Clock, ChevronRight,
  TrendingUp, Landmark, Layers, BarChart3, Calculator, Globe, Building2,
} from 'lucide-react';
import { getCategoryBySlug } from '@/data/mf-gyan';

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp, Landmark, Layers, BarChart3, Calculator, Globe, Building2,
};

export default function AdminCategoryPage() {
  const params = useParams();
  const categorySlug = params.categorySlug as string;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-slate-500">Category not found</p>
        <Link href="/admin/learn" className="text-brand hover:underline text-sm">
          Back to MF Gyan
        </Link>
      </div>
    );
  }

  const Icon = ICON_MAP[category.icon] || BookOpen;

  return (
    <div>
      {/* Header */}
      <div className={`bg-gradient-to-r ${category.gradientFrom} ${category.gradientTo} text-white rounded-xl mb-6`}>
        <div className="p-6">
          <Link
            href="/admin/learn"
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
                {category.topics.length} lessons
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Topic List */}
      <div className="space-y-2">
        {category.topics.map((topic, idx) => (
          <Link
            key={topic.id}
            href={`/admin/learn/${category.id}/${topic.id}`}
            className="group flex items-center gap-3 p-4 rounded-xl border bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            {/* Number */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${category.bgColor} ${category.color}`}>
              <span>{idx + 1}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-800 group-hover:text-primary-700 transition">
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
        ))}
      </div>
    </div>
  );
}
