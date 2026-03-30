import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Rent vs Buy Calculator | Should You Rent or Buy a House in India?',
  description: 'Compare the total cost of renting vs buying a house over your time horizon. Find the break-even year, factor in appreciation, rent increases, and opportunity cost.',
  path: '/calculators/rent-vs-buy',
  keywords: ['rent vs buy calculator', 'should I buy a house', 'rent or buy India', 'house buying calculator', 'real estate vs rent', 'property investment calculator', 'home buying decision'],
});

export default function RentVsBuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
