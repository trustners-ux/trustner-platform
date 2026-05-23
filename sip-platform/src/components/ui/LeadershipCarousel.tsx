'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  experience: string;
  initials: string;
  photo?: string;
  color: string;
}

interface LeadershipCarouselProps {
  members: TeamMember[];
  /** How many cards to show at once on desktop (default 4). Tablet shows 3, mobile shows 2. */
  visibleCount?: number;
  /** Auto-scroll interval in milliseconds (default 3500ms) */
  interval?: number;
}

export default function LeadershipCarousel({
  members,
  visibleCount = 4,
  interval = 3500,
}: LeadershipCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const totalMembers = members.length;

  // Triple the array for seamless infinite scrolling
  const extendedMembers = [...members, ...members, ...members];
  const offsetBase = totalMembers; // Middle copy starts here

  const next = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [isTransitioning]);

  const prev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [isTransitioning]);

  // After transition completes, silently snap back to the equivalent canonical position
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
    setCurrentIndex((prev) => {
      let n = prev % totalMembers;
      if (n < 0) n += totalMembers;
      return n;
    });
  }, [totalMembers]);

  // Auto-scroll
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [next, interval, isHovered]);

  // The track renders all 3×N cards. Each card has width = (100/visible)%.
  // We use padding inside each card wrapper to create spacing (avoids gap math issues).
  const renderTrack = (visible: number, padPx: number) => {
    const cardWidthPercent = 100 / visible;
    const shiftIndex = offsetBase + currentIndex;
    // translateX = -(shiftIndex × cardWidth%)
    const tx = -(shiftIndex * cardWidthPercent);

    return (
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(${tx}%)`,
            transition: isTransitioning ? 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedMembers.map((member, i) => (
            <div
              key={i}
              className="shrink-0"
              style={{
                width: `${cardWidthPercent}%`,
                padding: `0 ${padPx}px`,
              }}
            >
              <MemberCard member={member} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Normalized index for dot highlighting
  let normalizedIdx = currentIndex % totalMembers;
  if (normalizedIdx < 0) normalizedIdx += totalMembers;

  return (
    <div
      className="relative max-w-5xl mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute -left-3 lg:-left-6 top-1/2 -translate-y-1/2 z-10 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white shadow-lg border border-surface-300/50 flex items-center justify-center text-slate-500 hover:text-brand hover:border-brand-300 transition-all hover:shadow-xl"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute -right-3 lg:-right-6 top-1/2 -translate-y-1/2 z-10 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white shadow-lg border border-surface-300/50 flex items-center justify-center text-slate-500 hover:text-brand hover:border-brand-300 transition-all hover:shadow-xl"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Desktop (lg+): show visibleCount cards */}
      <div className="hidden lg:block mx-2">
        {renderTrack(visibleCount, 12)}
      </div>

      {/* Tablet (sm–lg): show 3 cards */}
      <div className="hidden sm:block lg:hidden mx-2">
        {renderTrack(3, 10)}
      </div>

      {/* Mobile (<sm): show 2 cards */}
      <div className="block sm:hidden mx-1">
        {renderTrack(2, 8)}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-6">
        {members.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (isTransitioning) return;
              setIsTransitioning(true);
              const diff = idx - normalizedIdx;
              setCurrentIndex((prev) => prev + diff);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === normalizedIdx
                ? 'w-6 bg-brand'
                : 'w-2 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Go to member ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Individual Member Card ── */
function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="card-base p-5 lg:p-6 text-center h-full">
      <div className="relative mx-auto mb-3 lg:mb-4">
        <div
          className={`w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center mx-auto overflow-hidden shadow-lg ring-4 ring-white`}
        >
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name}
              width={96}
              height={96}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="text-xl lg:text-2xl font-bold text-white">{member.initials}</span>
          )}
        </div>
      </div>
      <h3 className="font-bold text-primary-700 text-sm lg:text-base leading-tight">{member.name}</h3>
      <p className="text-[11px] text-brand font-medium mt-0.5">{member.role}</p>
      <p className="text-[10px] text-slate-400 mt-1">{member.experience} Experience</p>
    </div>
  );
}
