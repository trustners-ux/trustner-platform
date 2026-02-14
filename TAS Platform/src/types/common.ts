export interface NavLink {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavLink[];
}

export interface Testimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
  avatar?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  coverImage?: string;
  tags: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  date: string;
  category: string;
  url?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  description: string;
  image?: string;
  linkedin?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}
