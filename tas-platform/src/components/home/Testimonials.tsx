"use client";

import { Star, Quote } from "lucide-react";
import { MOCK_TESTIMONIALS } from "@/data/mock-funds";

export default function Testimonials() {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-yellow-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-yellow-600">
            Testimonials
          </span>
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            What Our Clients Say
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-500">
            Hear from our clients who trust Trustner for their investment and
            insurance needs.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {MOCK_TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="card-hover relative rounded-2xl border border-gray-100 bg-white p-6"
            >
              {/* Quote Icon */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                <Quote size={20} className="text-primary-500" />
              </div>

              {/* Stars */}
              <div className="mb-3 flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    size={14}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote Text */}
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="border-t border-gray-50 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
