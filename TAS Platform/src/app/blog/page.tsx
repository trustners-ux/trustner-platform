import { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight, User } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - Financial Knowledge & Market Insights",
  description: "Expert articles on mutual funds, SIP, insurance, tax planning, and financial wellness. Learn to make smarter financial decisions with Trustner.",
};

const BLOG_POSTS = [
  { slug: "what-is-sip", title: "What is SIP and How Does It Work?", excerpt: "Learn how Systematic Investment Plans help you build wealth through regular, disciplined investing in mutual funds.", category: "Mutual Funds", date: "2026-02-10", readTime: "5 min", author: "Trustner Team" },
  { slug: "elss-tax-saving", title: "ELSS: Save Tax While Building Wealth", excerpt: "Everything you need to know about Equity Linked Savings Scheme — the only mutual fund category that offers tax deduction under Section 80C.", category: "Tax Planning", date: "2026-02-08", readTime: "7 min", author: "Trustner Team" },
  { slug: "risk-o-meter-guide", title: "Understanding the Risk-o-Meter in Mutual Funds", excerpt: "SEBI mandates a risk-o-meter for all mutual funds. Learn what each risk level means and how to choose funds matching your risk appetite.", category: "Mutual Funds", date: "2026-02-05", readTime: "6 min", author: "Trustner Team" },
  { slug: "health-insurance-guide", title: "Health Insurance: A Complete Guide for 2026", excerpt: "How to choose the right health insurance plan. Coverage, premium factors, cashless hospitals, and common mistakes to avoid.", category: "Insurance", date: "2026-02-03", readTime: "8 min", author: "Trustner Team" },
  { slug: "nps-vs-ppf-vs-elss", title: "NPS vs PPF vs ELSS: Which Tax Saver Is Right?", excerpt: "A detailed comparison of three popular tax-saving investment options. Returns, lock-in, tax treatment, and suitability analysis.", category: "Tax Planning", date: "2026-01-30", readTime: "10 min", author: "Trustner Team" },
  { slug: "debt-mutual-funds-guide", title: "Debt Mutual Funds: Better Than Fixed Deposits?", excerpt: "Why more investors are moving from FDs to debt mutual funds. Tax efficiency, liquidity, and return comparison.", category: "Mutual Funds", date: "2026-01-28", readTime: "6 min", author: "Trustner Team" },
];

const CATEGORIES = ["All", "Mutual Funds", "Insurance", "Tax Planning", "Market Updates"];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">Knowledge Center</h1>
          <p className="text-gray-500">Expert insights on investing, insurance, and financial planning.</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary-300 hover:text-primary-500">
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card-hover group overflow-hidden rounded-2xl border border-gray-100 bg-white">
              {/* Placeholder Cover */}
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                <span className="text-4xl font-extrabold text-primary-200">{post.title.charAt(0)}</span>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase text-primary-500">{post.category}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} />{post.readTime} read</span>
                </div>
                <h2 className="mb-2 line-clamp-2 font-bold text-gray-900 group-hover:text-primary-500">{post.title}</h2>
                <p className="mb-3 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="flex items-center gap-1 text-xs text-gray-400"><User size={12} />{post.author}</span>
                  <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
