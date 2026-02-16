import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, User, Calendar, Share2, ChevronRight, ArrowRight, BookOpen, Linkedin, Twitter } from "lucide-react";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

interface Props {
  params: Promise<{ slug: string }>;
}

const BLOG_META: Record<string, { title: string; category: string; date: string; readTime: string; excerpt: string }> = {
  "complete-guide-to-sip-investing": { title: "Complete Guide to SIP Investing in 2026", category: "Mutual Funds", date: "2026-02-10", readTime: "8 min", excerpt: "Learn how Systematic Investment Plans help you build wealth through regular, disciplined investing in mutual funds." },
  "elss-vs-ppf-vs-nps-tax-saving": { title: "ELSS vs PPF vs NPS: Best Tax Saving Investment", category: "Tax Planning", date: "2026-02-08", readTime: "10 min", excerpt: "A detailed comparison of three popular tax-saving investment options." },
  "understanding-sebi-risk-o-meter": { title: "Understanding SEBI's Risk-O-Meter for Mutual Funds", category: "Mutual Funds", date: "2026-02-05", readTime: "6 min", excerpt: "Learn what each risk level means and how to choose funds matching your risk appetite." },
  "health-insurance-how-much-coverage": { title: "Health Insurance: How Much Coverage Do You Really Need?", category: "Insurance", date: "2026-02-03", readTime: "8 min", excerpt: "How to choose the right health insurance plan." },
  "market-volatility-staying-invested": { title: "Market Volatility: Why Staying Invested Beats Timing", category: "Market Updates", date: "2026-01-30", readTime: "7 min", excerpt: "Historical data proves that time in the market beats timing the market." },
  "financial-planning-salaried-employees": { title: "Financial Planning for Salaried Employees: Step-by-Step", category: "Personal Finance", date: "2026-01-28", readTime: "9 min", excerpt: "A practical guide tailored for salaried professionals in India." },
};

const RELATED_POSTS = [
  { slug: "complete-guide-to-sip-investing", title: "Complete Guide to SIP Investing", category: "Mutual Funds" },
  { slug: "elss-vs-ppf-vs-nps-tax-saving", title: "ELSS vs PPF vs NPS: Best Tax Saver", category: "Tax Planning" },
  { slug: "financial-planning-salaried-employees", title: "Financial Planning for Salaried Employees", category: "Personal Finance" },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = BLOG_META[slug];
  if (!meta) return { title: "Blog Post" };
  return {
    title: meta.title,
    description: meta.excerpt,
    openGraph: { title: meta.title, description: meta.excerpt, type: "article" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const meta = BLOG_META[slug] || {
    title: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    category: "General",
    date: "2026-02-10",
    readTime: "5 min",
    excerpt: "",
  };

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-primary-500">Home</Link>
            <ChevronRight size={13} />
            <Link href="/blog" className="transition hover:text-primary-500">Blog</Link>
            <ChevronRight size={13} />
            <span className="text-gray-600 line-clamp-1">{meta.title}</span>
          </div>
        </div>
      </div>

      <article className="container-custom py-8">
        <div className="mx-auto max-w-3xl">
          {/* Article Header */}
          <div className="mb-8">
            <span className="mb-3 inline-block rounded-full bg-primary-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-primary-500">
              {meta.category}
            </span>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 lg:text-4xl">
              {meta.title}
            </h1>
            {meta.excerpt && (
              <p className="mb-5 text-lg leading-relaxed text-gray-500">{meta.excerpt}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100">
                  <User size={13} className="text-primary-500" />
                </div>
                Trustner Team
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(meta.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {meta.readTime} read
              </span>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg prose-gray max-w-none rounded-2xl border border-gray-100 bg-white p-8 lg:p-12">
            <p className="text-gray-600 leading-relaxed">
              This blog post is coming soon with comprehensive, expert-written content. We are building a knowledge center with in-depth articles on mutual funds, SIP investments, insurance, tax planning, and financial wellness.
            </p>
            <h2>What You Will Learn</h2>
            <ul>
              <li>Core concepts explained in simple language</li>
              <li>Practical examples with Indian context</li>
              <li>Actionable tips you can implement today</li>
              <li>Common mistakes to avoid</li>
              <li>Links to relevant tools and calculators</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              In the meantime, explore our investment tools and resources to start your financial journey.
            </p>
            <div className="not-prose mt-8 flex flex-wrap gap-3">
              <Link href="/mutual-funds" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-600">
                Explore Funds <ArrowRight size={14} />
              </Link>
              <Link href="/calculators/sip" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
                SIP Calculator
              </Link>
              <Link href="/risk-profile" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
                Risk Profile Quiz
              </Link>
            </div>

            <div className="not-prose mt-8 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-xs leading-relaxed text-gray-500">
                <strong className="text-gray-600">Disclaimer:</strong> This article is for educational purposes only and should not be construed as investment advice. Mutual fund investments are subject to market risks. Past performance is not indicative of future results. Please consult a financial advisor before making investment decisions.
              </p>
            </div>
          </div>

          {/* Share Section */}
          <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
            <span className="text-sm font-semibold text-gray-600">Share this article:</span>
            <div className="flex gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0077B5]/10 text-[#0077B5] transition hover:bg-[#0077B5]/20">
                <Linkedin size={16} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] transition hover:bg-[#1DA1F2]/20">
                <Twitter size={16} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600 transition hover:bg-green-500/20">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Related Posts */}
          <div className="mt-10">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Related Articles</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {RELATED_POSTS.filter(p => p.slug !== slug).slice(0, 3).map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group rounded-xl border border-gray-100 bg-white p-4 transition-all hover:shadow-card-hover">
                  <span className="text-[10px] font-bold uppercase text-primary-500">{post.category}</span>
                  <h4 className="mt-1 text-sm font-bold text-gray-900 transition-colors group-hover:text-primary-500 line-clamp-2">{post.title}</h4>
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter CTA */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-600 p-6 text-center text-white">
            <BookOpen size={24} className="mx-auto mb-2 text-white/80" />
            <h3 className="mb-1 text-lg font-bold">Enjoyed this article?</h3>
            <p className="mb-4 text-sm text-white/70">Get more investing insights delivered to your inbox weekly.</p>
            <Link href="/blog" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-500 transition hover:bg-gray-100">
              Read More Articles <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-6">
            <SEBIDisclaimer variant="inline" />
          </div>
        </div>
      </article>
    </div>
  );
}
