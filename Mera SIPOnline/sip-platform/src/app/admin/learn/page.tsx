'use client';

import Link from 'next/link';
import {
  BookOpen, TrendingUp, Landmark, Layers, BarChart3, Calculator,
  Globe, Building2, ChevronRight, GraduationCap,
} from 'lucide-react';
import { ALL_GYAN_CATEGORIES, getGyanStats } from '@/data/mf-gyan';

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp, Landmark, Layers, BarChart3, Calculator, Globe, Building2,
};

export default function AdminMFGyanHub() {
  const stats = getGyanStats();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">MF Gyan Bhandar</h1>
            <p className="text-slate-500 text-sm mt-1">
              {stats.categories} categories &middot; {stats.topics} lessons &middot; Financial knowledge for the entire team
            </p>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_GYAN_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || BookOpen;

          return (
            <Link
              key={cat.id}
              href={`/admin/learn/${cat.id}`}
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

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
