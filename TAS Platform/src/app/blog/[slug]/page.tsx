import Link from "next/link";
import { ArrowLeft, Clock, User, Calendar, Share2 } from "lucide-react";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  // In production, this would fetch from MDX or CMS
  const post = {
    title: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    category: "Mutual Funds",
    date: "2026-02-10",
    readTime: "5 min",
    author: "Trustner Team",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-4">
          <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-500">
            <ArrowLeft size={16} /> Back to Blog
          </Link>
        </div>
      </div>

      <article className="container-custom py-8">
        <div className="mx-auto max-w-3xl">
          <span className="mb-3 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-500">{post.category}</span>
          <h1 className="mb-4 text-3xl font-extrabold text-gray-900 lg:text-4xl">{post.title}</h1>
          <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><User size={14} />{post.author}</span>
            <span className="flex items-center gap-1"><Calendar size={14} />{new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="flex items-center gap-1"><Clock size={14} />{post.readTime} read</span>
          </div>

          {/* Article Content Placeholder */}
          <div className="prose prose-lg max-w-none rounded-2xl border border-gray-100 bg-white p-8 lg:p-12">
            <p className="text-gray-600 leading-relaxed">
              This blog post is coming soon. We are building a comprehensive knowledge center with expert articles on mutual funds, SIP investments, insurance, tax planning, and financial wellness.
            </p>
            <p className="text-gray-600 leading-relaxed">
              In the meantime, please feel free to explore our mutual fund listings, use our SIP calculator, or contact our team for personalized financial guidance.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/mutual-funds" className="rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600">Explore Funds</Link>
              <Link href="/calculators/sip" className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">SIP Calculator</Link>
            </div>
          </div>

          <div className="mt-6">
            <SEBIDisclaimer variant="inline" />
          </div>
        </div>
      </article>
    </div>
  );
}
