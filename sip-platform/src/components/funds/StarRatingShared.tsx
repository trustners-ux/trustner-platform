'use client';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, size = 'sm' }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`${sizeClass} text-yellow-500`}>
      {'\u2605'.repeat(Math.round(rating))}
      {'\u2606'.repeat(5 - Math.round(rating))}
    </span>
  );
}
