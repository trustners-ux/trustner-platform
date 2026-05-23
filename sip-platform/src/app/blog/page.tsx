'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Tag,
  Filter,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getAllPosts, getFeaturedPosts, BLOG_CATEGORIES } from '@/data/blog';
import { BlogCategory } from '@/types/blog';

export default function BlogPage() {
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const [activeCategory, setActiveCategory] = useState<BlogCategory | 'All'>('All');

  const filteredPosts =
    activeCategory === 'All'
      ? allPosts
      : allPosts.filter((p) => p.category === activeCategory);

  const heroFeatured = featuredPosts[0];

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-brand-700 text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="container-custom relative z-10 py-12 sm:py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-5 sm:mb-6 backdrop-blur-sm">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              Mera SIP Online Blog
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6">
              Insights for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-blue-200 to-accent">
                Smarter SIP Investing
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto">
              Expert articles on SIP strategies, market analysis, tax planning, and
              mutual fund selection to help you build long-term wealth.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="#all-posts"
                className="inline-flex items-center gap-2 bg-white text-primary-700 px-5 sm:px-6 py-2.5 sm:py-3 rounded-md font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg"
              >
                <BookOpen className="w-4 h-4" />
                Browse Articles
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#featured"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-md font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20"
              >
                <Sparkles className="w-4 h-4" />
                Featured Posts
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-white border-b border-surface-300/50 py-6 sm:py-8">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {[
              { value: allPosts.length, label: 'Published Articles', icon: BookOpen },
              { value: BLOG_CATEGORIES.length, label: 'Topic Categories', icon: Tag },
              { value: featuredPosts.length, label: 'Featured Posts', icon: Sparkles },
              {
                value: `${allPosts.reduce((acc, p) => acc + parseInt(p.readTime), 0)}+ min`,
                label: 'Total Reading Time',
                icon: Clock,
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary-700">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED POST ===== */}
      {heroFeatured && (
        <section id="featured" className="section-padding-sm bg-surface-100">
          <div className="container-custom">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-700 mb-3">
                Featured Article
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Our top pick for essential reading on SIP investing.
              </p>
            </div>

            <Link
              href={`/blog/${heroFeatured.slug}`}
              className="card-interactive block max-w-4xl mx-auto overflow-hidden group"
            >
              <div className="grid md:grid-cols-2">
                {/* Cover gradient */}
                <div
                  className={cn(
                    'bg-gradient-to-br min-h-[220px] md:min-h-[320px] flex items-end p-6',
                    heroFeatured.coverGradient
                  )}
                >
                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </span>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug">
                      {heroFeatured.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 md:p-8 flex flex-col justify-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand bg-brand-50 px-3 py-1 rounded-full w-fit mb-3 sm:mb-4">
                    <Tag className="w-3 h-3" />
                    {heroFeatured.category}
                  </span>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-3 sm:mb-4 line-clamp-3">
                    {heroFeatured.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(heroFeatured.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {heroFeatured.readTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-brand group-hover:underline">
                    Read Full Article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ===== ALL POSTS WITH CATEGORY FILTER ===== */}
      <section id="all-posts" className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-700 mb-4">
              All Articles
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Browse our complete library of SIP investing insights, strategies, and guides.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="mb-8 sm:mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center sm:justify-center">
              <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1 overflow-x-auto scrollbar-hide scroll-smooth">
                <button
                  onClick={() => setActiveCategory('All')}
                  className={cn(
                    'px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                    activeCategory === 'All'
                      ? 'bg-white text-primary-700 shadow-card'
                      : 'text-slate-500 hover:text-primary-700'
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    All
                  </span>
                </button>
                {BLOG_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                      activeCategory === cat
                        ? 'bg-white text-primary-700 shadow-card'
                        : 'text-slate-500 hover:text-primary-700'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-surface-300 mx-auto mb-4" />
              <p className="text-slate-500">No articles found in this category yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="card-interactive overflow-hidden group"
                >
                  {/* Cover Gradient */}
                  <div
                    className={cn(
                      'bg-gradient-to-br h-36 sm:h-44 flex items-end p-4 sm:p-5 relative',
                      post.coverGradient
                    )}
                  >
                    {post.featured && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        Featured
                      </span>
                    )}
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5">
                    {/* Category Badge */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand bg-brand-50 px-2.5 py-0.5 rounded-full mb-2.5 sm:mb-3">
                      <Tag className="w-2.5 h-2.5" />
                      {post.category}
                    </span>

                    <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed mb-3 sm:mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3 sm:mb-4">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-surface-300/50">
                      <span className="text-sm font-semibold text-brand group-hover:underline">
                        Read Article
                      </span>
                      <ArrowRight className="w-4 h-4 text-brand group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-primary-700 via-brand to-brand-800 text-white">
        <div className="container-custom text-center">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-brand-200" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4">
            Want to Learn SIP Investing Step by Step?
          </h2>
          <p className="text-base sm:text-lg text-brand-100 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Our structured learning modules take you from beginner to advanced SIP strategies
            with interactive quizzes and real-world examples.
          </p>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 bg-white text-brand px-6 sm:px-8 py-3 sm:py-3.5 rounded-md font-semibold hover:bg-slate-100 transition-colors shadow-lg text-sm sm:text-base"
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            Explore Learning Academy
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
