"use client";

import { useEffect, useState, useRef } from "react";
import { Shield, Award, Users, BadgeCheck } from "lucide-react";
import { AMC_PARTNERS, INSURANCE_PARTNERS } from "@/data/mock-funds";
import { REGULATORY } from "@/lib/constants/regulatory";

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return (
    <div ref={ref}>
      {prefix}
      {count.toLocaleString("en-IN")}
      {suffix}
    </div>
  );
}

export default function TrustSignals() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Trust Stats */}
        <div className="mb-16">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-500">
              Why Trustner
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Trusted by Thousands Across India
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              {
                icon: Users,
                value: 10000,
                suffix: "+",
                label: "Happy Clients",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: Award,
                value: 40,
                suffix: "+",
                label: "AMC & Insurance Partners",
                color: "bg-green-50 text-green-600",
              },
              {
                icon: Shield,
                value: 98,
                suffix: "%",
                label: "Claim Settlement Rate",
                color: "bg-purple-50 text-purple-600",
              },
              {
                icon: BadgeCheck,
                value: 100,
                suffix: " Cr+",
                prefix: "₹",
                label: "Assets Under Guidance",
                color: "bg-amber-50 text-amber-600",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-100 bg-white p-6 text-center"
              >
                <div
                  className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <stat.icon size={28} />
                </div>
                <div className="mb-1 text-3xl font-extrabold text-gray-900">
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                  />
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Badges */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
          {[
            {
              label: `AMFI Registered | ${REGULATORY.AMFI_ARN}`,
              icon: BadgeCheck,
            },
            { label: "SEBI Compliant", icon: Shield },
            { label: "IRDAI Licensed", icon: Award },
            { label: "ISO 27001 Certified", icon: Shield },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600"
            >
              <badge.icon size={14} className="text-primary-500" />
              {badge.label}
            </div>
          ))}
        </div>

        {/* Partner Logos Marquee */}
        <div className="mb-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Our AMC & Insurance Partners
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white py-6">
          <div className="flex animate-ticker">
            {[...AMC_PARTNERS, ...INSURANCE_PARTNERS, ...AMC_PARTNERS].map(
              (partner, i) => (
                <div
                  key={`${partner}-${i}`}
                  className="flex-shrink-0 px-6 text-sm font-semibold text-gray-400"
                >
                  {partner}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
