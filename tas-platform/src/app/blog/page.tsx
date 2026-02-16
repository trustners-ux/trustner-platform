import { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight, User, ChevronRight, Search, BookOpen, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - Financial Knowledge & Market Insights",
  description: "Expert articles on mutual funds, SIP, insurance, tax planning, and financial wellness. Learn to make smarter financial decisions with Trustner.",
};

const BLOG_POSTS = [
  { slug: "complete-guide-to-sip-investing", title: "Complete Guide to SIP Investing in 2026", excerpt: "Learn how Systematic Investment Plans help you build wealth through regular, disciplined investing in mutual funds. Everything from basics to advanced strategies.", category: "Mutual Funds", date: "2026-02-10", readTime: "8 min", author: "Trustner Team", featured: true },
  { slug: "elss-vs-ppf-vs-nps-tax-saving", title: "ELSS vs PPF vs NPS: Best Tax Saving Investment", excerpt: "A detailed comparison of three popular tax-saving investment options. Returns, lock-in, tax treatment, and suitability analysis for every investor profile.", category: "Tax Planning", date: "2026-02-08", readTime: "10 min", author: "Trustner Team", featured: false },
  { slug: "understanding-sebi-risk-o-meter", title: "Understanding SEBI's Risk-O-Meter for Mutual Funds", excerpt: "SEBI mandates a risk-o-meter for all mutual funds. Learn what each risk level means and how to choose funds matching your risk appetite.", category: "Mutual Funds", date: "2026-02-05", readTime: "6 min", author: "Trustner Team", featured: false },
  { slug: "health-insurance-how-much-coverage", title: "Health Insurance: How Much Coverage Do You Really Need?", excerpt: "How to choose the right health insurance plan. Coverage, premium factors, cashless hospitals, and common mistakes to avoid.", category: "Insurance", date: "2026-02-03", readTime: "8 min", author: "Trustner Team", featured: false },
  { slug: "market-volatility-staying-invested", title: "Market Volatility: Why Staying Invested Beats Timing", excerpt: "Historical data proves that time in the market beats timing the market. Learn why panic selling destroys wealth and how SIPs protect you.", category: "Market Updates", date: "2026-01-30", readTime: "7 min", author: "Trustner Team", featured: false },
  { slug: "financial-planning-salaried-employees", title: "Financial Planning for Salaried Employees: Step-by-Step", excerpt: "A practical guide covering emergency funds, insurance, SIP investments, tax planning, and retirement — tailored for salaried professionals in India.", category: "Personal Finance", date: "2026-01-28", readTime: "9 min", author: "Trustner Team", featured: false },
];

const CATEGORIES = ["All", "Mutual Funds", "Insurance", "Tax Planning", "Market Updates", "Personal Finance"];

export default function BlogPage() {
  const featured = BLOG_POSTS.find(p => p.featured);
  const rest = BLOG_POSTS.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-10 lg:py-14">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white">Blog</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <BookOpen size={20} />
            </div>
            <h1 className="text-3xl font-extrabold lg:text-4xl">Learn to Invest Smarter</h1>
          </div>
          <p className="max-w-xl text-gray-400">
            Expert insights on mutual funds, insurance, tax planning, and building long-term wealth. Written by financial professionals.
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                i === 0
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                  : "bg-white text-gray-600 shadow-card hover:bg-gray-50 hover:text-primary-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-8 grid overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:shadow-card-hover md:grid-cols-2"
          >
            <div className="flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50 p-8 md:p-12">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-3 text-primary-300" />
                <span className="text-sm font-bold text-primary-400">Featured Article</span>
              </div>
            </div>
            <div className="flex flex-col justify-center p-6 md:p-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-[10px] font-bold uppercase text-primary-500">{featured.category}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} />{featured.readTime}</span>
              </div>
              <h2 className="mb-3 text-xl font-extrabold text-gray-900 transition-colors group-hover:text-primary-500 lg:text-2xl">
                {featured.title}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-gray-500">{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <User size={12} />{featured.author} &bull; {new Date(featured.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-primary-500 transition-all group-hover:gap-2">
                  Read <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Blog Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50">
                <span className="text-5xl font-extrabold text-primary-100">{post.title.charAt(0)}</span>
              </div>
              <div className="p-5">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="rounded-md bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-500">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} />{post.readTime}
                  </span>
                </div>
                <h2 className="mb-2 font-bold leading-tight text-gray-900 transition-colors group-hover:text-primary-500 line-clamp-2">
                  {post.title}
                </h2>
                <p className="mb-3 text-sm leading-relaxed text-gray-500 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <User size={11} />{post.author}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-600 p-8 text-center text-white">
          <h3 className="mb-2 text-xl font-extrabold">Get Weekly Market Insights</h3>
          <p className="mb-5 text-sm text-white/80">Join 1,000+ investors who receive our free weekly newsletter on markets, investing tips, and financial planning.</p>
          <div className="mx-auto flex max-w-md gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-xl border-0 bg-white/15 px-4 py-3 text-sm text-white placeholder-white/50 outline-none backdrop-blur transition focus:bg-white/20 focus:ring-2 focus:ring-white/30"
            />
            <button className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-500 transition hover:bg-gray-100">
              Subscribe
            </button>
          </div>
          <p className="mt-3 text-[11px] text-white/50">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </div>
  );
}
