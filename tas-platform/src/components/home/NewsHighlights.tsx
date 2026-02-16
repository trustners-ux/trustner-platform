import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { MOCK_NEWS } from "@/data/mock-funds";

export default function NewsHighlights() {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full bg-accent-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent">
              Latest Updates
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Market News & Insights
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden items-center gap-1 text-sm font-bold text-primary-500 transition hover:gap-2 sm:flex"
          >
            Read All Articles <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {MOCK_NEWS.map((news) => (
            <Link
              key={news.id}
              href="/blog"
              className="card-hover group rounded-2xl border border-gray-100 bg-white p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-md bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase text-primary-500">
                  {news.category}
                </span>
              </div>
              <h3 className="mb-2 line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-primary-500">
                {news.title}
              </h3>
              <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">
                {news.excerpt}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Newspaper size={12} />
                  {news.source}
                </span>
                <span>
                  {new Date(news.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary-500"
          >
            Read All Articles <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
