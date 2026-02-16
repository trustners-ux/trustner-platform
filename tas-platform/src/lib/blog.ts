import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  content: string;
  featured?: boolean;
}

/**
 * Read all .mdx blog posts, parse frontmatter, and return sorted by date descending.
 */
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith('.mdx'));

  const posts: BlogPost[] = files.map((filename) => {
    const filePath = path.join(BLOG_DIR, filename);
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContents);

    return {
      slug: data.slug || filename.replace(/\.mdx$/, ''),
      title: data.title || '',
      excerpt: data.excerpt || '',
      category: data.category || 'General',
      date: data.date || '',
      readTime: data.readTime || '5 min',
      author: data.author || 'Trustner Team',
      content,
      featured: data.featured || false,
    };
  });

  // Sort by date descending (most recent first)
  posts.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return posts;
}

/**
 * Read a specific blog post by its slug.
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContents);

  return {
    slug: data.slug || slug,
    title: data.title || '',
    excerpt: data.excerpt || '',
    category: data.category || 'General',
    date: data.date || '',
    readTime: data.readTime || '5 min',
    author: data.author || 'Trustner Team',
    content,
    featured: data.featured || false,
  };
}

/**
 * Return all available slugs for static generation (generateStaticParams).
 */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''));
}
