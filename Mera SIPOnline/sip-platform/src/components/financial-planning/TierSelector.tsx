'use client';

import Link from 'next/link';
import { CheckCircle2, Clock, ArrowRight, Crown, Zap, Star } from 'lucide-react';
import { TIER_CONFIGS } from '@/lib/constants/tier-config';

const BADGE_ICONS: Record<string, typeof Zap> = {
  FREE: Zap,
  RECOMMENDED: Star,
  PREMIUM: Crown,
};

const COLOR_MAP: Record<string, {
  badge: string;
  ring: string;
  button: string;
  iconBg: string;
  check: string;
  glow: string;
}> = {
  emerald: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ring: 'border-emerald-200 hover:border-emerald-300',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20',
    iconBg: 'bg-emerald-50 text-emerald-600',
    check: 'text-emerald-500',
    glow: '',
  },
  brand: {
    badge: 'bg-brand-100 text-brand-700 border-brand-200',
    ring: 'border-brand-300 ring-2 ring-brand-200/50 hover:border-brand-400',
    button: 'bg-brand-700 hover:bg-brand-800 text-white shadow-lg shadow-brand-700/25',
    iconBg: 'bg-brand-50 text-brand-700',
    check: 'text-brand-600',
    glow: 'shadow-glow-brand',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    ring: 'border-amber-200 hover:border-amber-300',
    button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20',
    iconBg: 'bg-amber-50 text-amber-600',
    check: 'text-amber-500',
    glow: '',
  },
};

export default function TierSelector() {
  return (
    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
      {TIER_CONFIGS.map((tier) => {
        const colors = COLOR_MAP[tier.color] || COLOR_MAP.emerald;
        const BadgeIcon = BADGE_ICONS[tier.badge] || Zap;

        return (
          <div
            key={tier.tier}
            className={`relative card-base p-6 lg:p-8 flex flex-col transition-all duration-300 hover-lift ${colors.ring} ${tier.recommended ? colors.glow : ''}`}
          >
            {/* Recommended ribbon */}
            {tier.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 bg-brand-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  <Star className="w-3 h-3" />
                  Most Popular
                </span>
              </div>
            )}

            {/* Badge */}
            <div className="mb-4 pt-1">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${colors.badge}`}>
                <BadgeIcon className="w-3.5 h-3.5" />
                {tier.badge}
              </span>
            </div>

            {/* Tier name & subtitle */}
            <h3 className="text-xl font-extrabold text-primary-700 mb-1">{tier.name}</h3>
            <p className="text-sm font-medium text-slate-400 mb-3">{tier.subtitle}</p>

            {/* Description */}
            <p className="text-sm text-slate-500 leading-relaxed mb-5">{tier.description}</p>

            {/* Duration & Steps */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-surface-300/60">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{tier.duration}</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="text-sm text-slate-500">
                {tier.steps} steps &middot; {tier.fields}
              </div>
            </div>

            {/* Feature list */}
            <ul className="space-y-3 mb-8 flex-1">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  {feature.includes('Everything in') ? (
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                      {feature}
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className={`w-4.5 h-4.5 mt-0.5 shrink-0 ${colors.check}`} />
                      <span className="text-sm text-slate-600 leading-snug">{feature}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* Report pages badge */}
            <div className="mb-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-surface-200 px-3 py-1.5 rounded-full">
                {tier.reportPages}-page PDF report
              </span>
            </div>

            {/* CTA button */}
            <Link
              href={`/financial-planning/${tier.tier}`}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm transition-all ${colors.button}`}
            >
              {tier.tier === 'basic' ? 'Start Free Health Check' : tier.tier === 'standard' ? 'Start Goal Planning' : 'Start Full Blueprint'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
