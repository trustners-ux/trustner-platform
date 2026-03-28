'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Tag,
  ChevronRight,
  Info,
  Lightbulb,
  AlertTriangle,
  Quote,
  Sparkles,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getPostBySlug, getRelatedPosts } from '@/data/blog';
import { BlogContentBlock } from '@/types/blog';

/* ────────────────────────── Callout Icons ────────────────────────── */
const CALLOUT_STYLES: Record<string, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  info: {
    bg: 'bg-brand-50',
    border: 'border-brand-200',
    icon: Info,
    iconColor: 'text-brand',
  },
  tip: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: Lightbulb,
    iconColor: 'text-teal-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
};

/* ────────────────────────── Content Renderer ────────────────────────── */
function renderContentBlock(block: BlogContentBlock, index: number) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p
          key={index}
          className="text-[15px] sm:text-base text-slate-600 leading-[1.8] sm:leading-relaxed mb-5 sm:mb-6"
        >
          {block.text}
        </p>
      );

    case 'heading':
      return (
        <h2
          key={index}
          className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-700 mt-8 sm:mt-10 mb-3 sm:mb-4 leading-snug"
        >
          {block.text}
        </h2>
      );

    case 'subheading':
      return (
        <h3
          key={index}
          className="text-base sm:text-lg font-semibold text-primary-700 mt-6 sm:mt-8 mb-2.5 sm:mb-3 leading-snug"
        >
          {block.text}
        </h3>
      );

    case 'list':
      return (
        <ul key={index} className="space-y-2.5 sm:space-y-2 mb-5 sm:mb-6 pl-1">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 sm:gap-3 text-[15px] sm:text-base text-slate-600 leading-[1.8] sm:leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-[10px] sm:mt-2.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'callout': {
      const variant = block.variant || 'info';
      const style = CALLOUT_STYLES[variant] || CALLOUT_STYLES.info;
      const CalloutIcon = style.icon;
      return (
        <div
          key={index}
          className={cn(
            'rounded-xl border p-4 sm:p-5 mb-5 sm:mb-6 flex items-start gap-3',
            style.bg,
            style.border
          )}
        >
          <CalloutIcon className={cn('w-5 h-5 shrink-0 mt-0.5', style.iconColor)} />
          <p className="text-[14px] sm:text-sm text-slate-700 leading-[1.7] sm:leading-relaxed">
            {block.text}
          </p>
        </div>
      );
    }

    case 'quote':
      return (
        <blockquote
          key={index}
          className="border-l-4 border-brand bg-brand-50/50 rounded-r-xl px-4 sm:px-5 py-4 mb-5 sm:mb-6 italic text-[15px] sm:text-base text-slate-600 leading-[1.8] sm:leading-relaxed"
        >
          <Quote className="w-5 h-5 text-brand-300 mb-2" />
          {block.text}
        </blockquote>
      );

    case 'table':
      if (!block.rows || block.rows.length === 0) return null;
      const headers = block.rows[0];
      const body = block.rows.slice(1);
      return (
        <div key={index} className="mb-5 sm:mb-6">
          {/* Desktop: horizontal table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-surface-300/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-200">
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-4 py-3 font-semibold text-primary-700 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr
                    key={ri}
                    className={cn(
                      'border-t border-surface-300/50',
                      ri % 2 === 1 ? 'bg-surface-100' : 'bg-white'
                    )}
                  >
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked card layout for tables */}
          <div className="sm:hidden space-y-3">
            {body.map((row, ri) => (
              <div
                key={ri}
                className="bg-white rounded-xl border border-surface-300/50 p-4"
              >
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className={cn(
                      'flex justify-between items-start gap-3',
                      ci > 0 ? 'mt-2 pt-2 border-t border-surface-200' : ''
                    )}
                  >
                    <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide shrink-0">
                      {headers[ci]}
                    </span>
                    <span className="text-sm text-slate-600 text-right">
                      {cell}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case 'piechart': {
      if (!block.chartData || block.chartData.length === 0) return null;
      const total = block.chartData.reduce((sum, d) => sum + d.value, 0);
      // Build conic-gradient segments
      let cumulative = 0;
      const segments = block.chartData.map((d) => {
        const start = (cumulative / total) * 360;
        cumulative += d.value;
        const end = (cumulative / total) * 360;
        return `${d.color} ${start}deg ${end}deg`;
      });
      const gradient = `conic-gradient(${segments.join(', ')})`;
      return (
        <div key={index} className="mb-6 sm:mb-8">
          {block.text && (
            <h3 className="text-base sm:text-lg font-semibold text-primary-700 mb-4 text-center">{block.text}</h3>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 justify-center">
            {/* Pie Chart */}
            <div
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-full shadow-lg shrink-0 relative"
              style={{ background: gradient }}
            >
              <div className="absolute inset-[25%] bg-white rounded-full flex items-center justify-center shadow-inner">
                <span className="text-sm font-bold text-primary-700">₹10L</span>
              </div>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-2.5">
              {block.chartData.map((d, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs sm:text-sm text-slate-600">
                    <span className="font-semibold text-primary-700">{Math.round((d.value / total) * 100)}%</span>{' '}
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'summary': {
      if (!block.items || block.items.length === 0) return null;
      return (
        <div key={index} className="mb-6 sm:mb-8 rounded-xl border-2 border-brand/20 bg-gradient-to-br from-brand-50/60 to-teal-50/40 p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-primary-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" />
            {block.summaryTitle || 'Quick Summary'}
          </h3>
          <div className="space-y-2">
            {block.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'cta': {
      return (
        <div key={index} className="mb-6 sm:mb-8 rounded-xl bg-gradient-to-r from-primary-700 via-brand to-brand-800 p-6 sm:p-8 text-center">
          {block.text && (
            <p className="text-base sm:text-lg font-bold text-white mb-3 leading-snug">{block.text}</p>
          )}
          {block.items && block.items.length > 0 && (
            <p className="text-sm text-brand-100 mb-5">{block.items[0]}</p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {block.buttonHref && (
              <a
                href={block.buttonHref}
                className="inline-flex items-center gap-2 bg-white text-brand px-6 py-3 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg"
              >
                {block.buttonText || 'Get Started'}
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      );
    }

    case 'disclaimer': {
      return (
        <div key={index} className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-surface-300/50 mb-5 sm:mb-6">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 sm:p-5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Disclaimer</h4>
                <p className="text-[12px] sm:text-xs text-slate-400 leading-relaxed">{block.text}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

/* ────────────────────────── Page Component ────────────────────────── */
export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = getPostBySlug(slug);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return getRelatedPosts(post, 3);
  }, [post]);

  /* ── Not Found ── */
  if (!post) {
    return (
      <section className="section-padding bg-surface-100">
        <div className="container-custom text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-primary-700 mb-2">Article Not Found</h1>
            <p className="text-slate-500 mb-6">
              The blog post you are looking for does not exist or has been moved.
            </p>
            <Link href="/blog" className="btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const formattedDate = new Date(post.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      {/* ===== BREADCRUMB ===== */}
      <div className="bg-white border-b border-surface-300/50">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <Link href="/" className="hover:text-brand transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blog" className="hover:text-brand transition-colors">
              Blog
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-700 font-medium truncate max-w-[180px] sm:max-w-none">
              {post.title}
            </span>
          </nav>
        </div>
      </div>

      {/* ===== POST HEADER ===== */}
      <section className="relative overflow-hidden">
        <div
          className={cn(
            'bg-gradient-to-br text-white',
            post.coverGradient
          )}
        >
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

          <div className="container-custom relative z-10 py-10 sm:py-12 lg:py-20">
            <div className="max-w-3xl">
              {/* Category & Meta */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                  <Tag className="w-3 h-3" />
                  {post.category}
                </span>
                {post.featured && (
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold leading-tight mb-4 sm:mb-5">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-5 sm:mb-6 max-w-2xl">
                {post.excerpt}
              </p>

              {/* Author & Date */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {post.author.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="py-8 sm:py-12 lg:py-16 bg-surface-100">
        <div className="container-custom">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Article Content */}
            <article className="lg:col-span-8">
              <div className="card-base px-5 py-6 sm:p-8 lg:p-10">
                {post.content.map((block, idx) => renderContentBlock(block, idx))}

                {/* Tags */}
                <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-surface-300/50">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-surface-200 px-3 py-1.5 rounded-full"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Author Box — E-E-A-T optimized */}
                <div className="mt-6 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-brand-50/60 to-teal-50/40 border border-brand/10">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand to-brand-700 flex items-center justify-center shrink-0 shadow-md">
                      <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base sm:text-lg text-primary-700">
                        {post.author.name}
                      </div>
                      <div className="text-xs sm:text-sm text-brand font-medium mb-2">
                        {post.author.role}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        Ram Shah is a FPSB-certified CFP professional and founder of Trustner Asset Services (ARN-286886). With over two decades of experience in wealth management, he specializes in SIP strategies, retirement planning, and goal-based investing for Indian families.
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">FPSB India - CFP</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">ARN-286886</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">AMFI Registered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back to Blog */}
              <div className="mt-5 sm:mt-6">
                <Link
                  href="/blog"
                  className="btn-outline text-sm inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to All Articles
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-5 sm:space-y-6">
                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <div className="card-base p-4 sm:p-5">
                    <h3 className="text-sm font-bold text-primary-700 mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-brand" />
                      Related Articles
                    </h3>
                    <div className="space-y-3">
                      {relatedPosts.map((rp) => (
                        <Link
                          key={rp.id}
                          href={`/blog/${rp.slug}`}
                          className="block p-3 rounded-lg hover:bg-brand-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg bg-gradient-to-br shrink-0 flex items-center justify-center',
                                rp.coverGradient
                              )}
                            >
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-primary-700 group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                                {rp.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                                <span>{rp.category}</span>
                                <span>&middot;</span>
                                <span>{rp.readTime}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Card */}
                <div className="card-base p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-primary-700 mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand" />
                    Post Category
                  </h3>
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand bg-brand-50 px-4 py-2 rounded-full hover:bg-brand-100 transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {post.category}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* CTA Card */}
                <div className="card-base p-4 sm:p-5 bg-gradient-to-br from-brand-50/50 to-brand-50/50">
                  <h3 className="text-sm font-bold text-primary-700 mb-2">
                    Calculate Your SIP Returns
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Use our free SIP calculator to see how your investments can grow over time.
                  </p>
                  <Link
                    href="/calculators/sip"
                    className="btn-primary text-xs w-full justify-center"
                  >
                    Open SIP Calculator
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ===== RELATED POSTS BOTTOM (Mobile-friendly) ===== */}
      {relatedPosts.length > 0 && (
        <section className="py-10 sm:py-14 bg-white lg:hidden">
          <div className="container-custom">
            <h2 className="text-xl sm:text-2xl font-extrabold text-primary-700 mb-5 sm:mb-6">
              You May Also Like
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="card-interactive overflow-hidden group"
                >
                  <div
                    className={cn(
                      'bg-gradient-to-br h-28 sm:h-32 flex items-end p-4',
                      rp.coverGradient
                    )}
                  >
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                      {rp.title}
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
                      <span>{rp.category}</span>
                      <span>&middot;</span>
                      <span>{rp.readTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-brand group-hover:underline">
                      Read Article
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA SECTION ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-primary-700 via-brand to-brand-800 text-white">
        <div className="container-custom text-center">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-brand-200" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4">
            Explore More Articles
          </h2>
          <p className="text-base sm:text-lg text-brand-100 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Dive deeper into SIP investing with our growing library of expert articles,
            guides, and market insights.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-white text-brand px-6 sm:px-8 py-3 sm:py-3.5 rounded-md font-semibold hover:bg-slate-100 transition-colors shadow-lg text-sm sm:text-base"
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            Browse All Articles
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
