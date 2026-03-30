import { blogPosts } from './posts';
import { BlogPost, BlogCategory } from '@/types/blog';

export { blogPosts } from './posts';

export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(p => p.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter(p => p.featured);
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return blogPosts.filter(p => p.category === category);
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  return blogPosts
    .filter(p => p.id !== post.id && (p.category === post.category || p.tags.some(t => post.tags.includes(t))))
    .slice(0, limit);
}

export const BLOG_CATEGORIES: BlogCategory[] = ['SIP Strategy', 'Market Analysis', 'Beginner Guides', 'Tax Planning', 'Fund Analysis'];
