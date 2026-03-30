export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: BlogContentBlock[];
  author: BlogAuthor;
  date: string;
  category: BlogCategory;
  readTime: string;
  tags: string[];
  featured?: boolean;
  coverGradient: string;
}

export interface BlogContentBlock {
  type: 'paragraph' | 'heading' | 'subheading' | 'list' | 'callout' | 'quote' | 'table' | 'piechart' | 'cta' | 'disclaimer' | 'summary';
  text?: string;
  items?: string[];
  rows?: string[][];
  variant?: 'info' | 'tip' | 'warning';
  /** For piechart: array of { label, value, color } */
  chartData?: { label: string; value: number; color: string }[];
  /** For cta: button label */
  buttonText?: string;
  /** For cta: button link */
  buttonHref?: string;
  /** For summary: title for the summary box */
  summaryTitle?: string;
}

export type BlogCategory = 'SIP Strategy' | 'Market Analysis' | 'Beginner Guides' | 'Tax Planning' | 'Fund Analysis';

export interface BlogAuthor {
  name: string;
  role: string;
}
