"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, CheckCircle } from "lucide-react";

const ROTATING_WORDS = [
  "Mutual Funds",
  "SIP Investments",
  "Health Insurance",
  "Tax Saving ELSS",
  "Life Insurance",
  "NPS & Retirement",
];

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setIsVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#0F172A]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />

      <div className="container-custom relative py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-primary-200 backdrop-blur-sm">
              <TrendingUp size={16} className="text-green-400" />
              AMFI Registered | ARN-286886
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your Trusted Partner
              <br />
              for{" "}
              <span
                className={`inline-block bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent transition-all duration-300 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
              >
                {ROTATING_WORDS[wordIndex]}
              </span>
            </h1>

            <p className="mb-8 max-w-lg text-lg leading-relaxed text-gray-300">
              One platform for all your financial needs. Compare mutual funds,
              start SIP, get insurance quotes, and plan your financial future
              with expert guidance.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/mutual-funds"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/40"
              >
                Explore Mutual Funds
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/insurance"
                className="flex items-center gap-2 rounded-xl border-2 border-white/20 px-7 py-3.5 text-sm font-bold text-white transition-all hover:border-white/50 hover:bg-white/5"
              >
                <Shield size={18} />
                Get Insurance Quote
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                { value: "40+", label: "AMC Partners" },
                { value: "10,000+", label: "Happy Clients" },
                { value: "₹100 Cr+", label: "Assets Managed" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-extrabold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="hidden lg:block">
            <div className="space-y-4">
              {[
                {
                  icon: TrendingUp,
                  title: "Smart Fund Selection",
                  desc: "Compare 5000+ mutual funds across all categories. Data-driven insights to pick the right fund.",
                  color: "from-blue-500/20 to-blue-600/20",
                  iconColor: "text-blue-400",
                },
                {
                  icon: Shield,
                  title: "Complete Protection",
                  desc: "Health, Life, Motor & Travel insurance from 30+ top insurers. Best coverage, best price.",
                  color: "from-green-500/20 to-green-600/20",
                  iconColor: "text-green-400",
                },
                {
                  icon: CheckCircle,
                  title: "Goal-Based Planning",
                  desc: "SIP calculators, tax-saving tools, and retirement planners to achieve every financial goal.",
                  color: "from-amber-500/20 to-amber-600/20",
                  iconColor: "text-amber-400",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}
                    >
                      <feature.icon size={24} className={feature.iconColor} />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-bold text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-400">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
