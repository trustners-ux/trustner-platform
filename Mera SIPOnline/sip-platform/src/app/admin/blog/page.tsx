'use client';

import { useState, useMemo } from 'react';
import {
  FileText, Plus, Trash2, Eye, EyeOff, Star, StarOff,
  ChevronDown, Download, ArrowLeft, GripVertical,
  Type, Heading1, Heading2, List, MessageSquareQuote,
  AlertCircle, Lightbulb, AlertTriangle, Table, Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { blogPosts } from '@/data/blog/posts';
import type { BlogPost, BlogContentBlock, BlogCategory } from '@/types/blog';

/* ─────────────────── Constants ─────────────────── */
const CATEGORIES: BlogCategory[] = ['SIP Strategy', 'Market Analysis', 'Beginner Guides', 'Tax Planning', 'Fund Analysis'];

const GRADIENTS = [
  'from-brand-600 to-brand-800',
  'from-secondary-600 to-amber-700',
  'from-teal-600 to-teal-700',
  'from-amber-600 to-orange-700',
  'from-rose-600 to-red-700',
  'from-cyan-600 to-brand-700',
  'from-purple-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
];

const BLOCK_TYPES: { type: BlogContentBlock['type']; label: string; icon: React.ElementType }[] = [
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'heading', label: 'Heading', icon: Heading1 },
  { type: 'subheading', label: 'Subheading', icon: Heading2 },
  { type: 'list', label: 'List', icon: List },
  { type: 'callout', label: 'Callout', icon: AlertCircle },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'table', label: 'Table', icon: Table },
];

const CALLOUT_ICONS: Record<string, React.ElementType> = {
  info: AlertCircle,
  tip: Lightbulb,
  warning: AlertTriangle,
};

/* ─────────────────── Helpers ─────────────────── */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function createEmptyBlock(type: BlogContentBlock['type']): BlogContentBlock {
  switch (type) {
    case 'list':
      return { type: 'list', items: [''] };
    case 'table':
      return { type: 'table', rows: [['Header 1', 'Header 2'], ['', '']] };
    case 'callout':
      return { type: 'callout', text: '', variant: 'info' };
    default:
      return { type, text: '' };
  }
}

function emptyPost(): Omit<BlogPost, 'id'> {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: [],
    author: { name: 'Trustner Research', role: 'Investment Education Team' },
    date: new Date().toISOString().split('T')[0],
    category: 'Beginner Guides',
    readTime: '5 min read',
    tags: [],
    featured: false,
    coverGradient: GRADIENTS[0],
  };
}

/* ─────────────────── Content Preview ─────────────────── */
function ContentPreview({ blocks }: { blocks: BlogContentBlock[] }) {
  return (
    <div className="prose prose-sm max-w-none">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return <h2 key={i} className="text-lg font-bold text-primary-700 mt-4 mb-2">{block.text || 'Untitled heading'}</h2>;
          case 'subheading':
            return <h3 key={i} className="text-base font-semibold text-primary-600 mt-3 mb-1">{block.text || 'Untitled subheading'}</h3>;
          case 'paragraph':
            return <p key={i} className="text-sm text-slate-600 leading-relaxed mb-3">{block.text || 'Empty paragraph...'}</p>;
          case 'list':
            return (
              <ul key={i} className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-3">
                {(block.items || []).map((item, j) => (
                  <li key={j}>{item || 'Empty item'}</li>
                ))}
              </ul>
            );
          case 'callout': {
            const variant = block.variant || 'info';
            const colors = variant === 'warning' ? 'bg-amber-50 border-amber-300 text-amber-800'
              : variant === 'tip' ? 'bg-brand-50 border-brand-300 text-brand-800'
              : 'bg-blue-50 border-blue-300 text-blue-800';
            return (
              <div key={i} className={cn('border-l-4 p-3 rounded-r-lg text-sm mb-3', colors)}>
                <span className="font-semibold capitalize">{variant}: </span>
                {block.text || 'Empty callout...'}
              </div>
            );
          }
          case 'quote':
            return (
              <blockquote key={i} className="border-l-4 border-slate-300 pl-4 italic text-sm text-slate-500 mb-3">
                {block.text || 'Empty quote...'}
              </blockquote>
            );
          case 'table':
            return (
              <div key={i} className="overflow-x-auto mb-3">
                <table className="w-full text-xs border border-surface-200">
                  <tbody>
                    {(block.rows || []).map((row, ri) => (
                      <tr key={ri} className={ri === 0 ? 'bg-surface-100 font-semibold' : ''}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="border border-surface-200 px-2 py-1">{cell || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
      {blocks.length === 0 && <p className="text-sm text-slate-400 italic">No content blocks yet. Add blocks using the toolbar.</p>}
    </div>
  );
}

/* ─────────────────── Block Editor ─────────────────── */
function BlockEditor({
  block,
  index,
  onChange,
  onRemove,
}: {
  block: BlogContentBlock;
  index: number;
  onChange: (updated: BlogContentBlock) => void;
  onRemove: () => void;
}) {
  const Icon = BLOCK_TYPES.find((b) => b.type === block.type)?.icon || Type;

  return (
    <div className="card-base p-3 group">
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="w-4 h-4 text-slate-300" />
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase">{block.type}</span>
        <span className="text-[10px] text-slate-400 ml-auto">#{index + 1}</span>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 p-0.5">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Text-based blocks */}
      {(block.type === 'paragraph' || block.type === 'heading' || block.type === 'subheading' || block.type === 'quote') && (
        <textarea
          value={block.text || ''}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          rows={block.type === 'paragraph' ? 3 : 1}
          className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
          placeholder={`Enter ${block.type} text...`}
        />
      )}

      {/* Callout */}
      {block.type === 'callout' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {(['info', 'tip', 'warning'] as const).map((v) => {
              const CIcon = CALLOUT_ICONS[v];
              return (
                <button
                  key={v}
                  onClick={() => onChange({ ...block, variant: v })}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all',
                    block.variant === v
                      ? v === 'warning' ? 'bg-amber-100 text-amber-700' : v === 'tip' ? 'bg-brand-100 text-brand-700' : 'bg-blue-100 text-blue-700'
                      : 'bg-surface-100 text-slate-400 hover:text-slate-600'
                  )}
                >
                  <CIcon className="w-3 h-3" />
                  {v}
                </button>
              );
            })}
          </div>
          <textarea
            value={block.text || ''}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={2}
            className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
            placeholder="Enter callout text..."
          />
        </div>
      )}

      {/* List */}
      {block.type === 'list' && (
        <div className="space-y-1">
          {(block.items || []).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
              <input
                value={item}
                onChange={(e) => {
                  const items = [...(block.items || [])];
                  items[i] = e.target.value;
                  onChange({ ...block, items });
                }}
                className="flex-1 border border-surface-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="List item..."
              />
              <button
                onClick={() => {
                  const items = (block.items || []).filter((_, j) => j !== i);
                  onChange({ ...block, items });
                }}
                className="text-red-400 hover:text-red-600 p-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ ...block, items: [...(block.items || []), ''] })}
            className="text-xs text-brand font-semibold hover:underline flex items-center gap-1 mt-1"
          >
            <Plus className="w-3 h-3" /> Add item
          </button>
        </div>
      )}

      {/* Table */}
      {block.type === 'table' && (
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {(block.rows || []).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="p-0.5">
                        <input
                          value={cell}
                          onChange={(e) => {
                            const rows = (block.rows || []).map((r) => [...r]);
                            rows[ri][ci] = e.target.value;
                            onChange({ ...block, rows });
                          }}
                          className={cn(
                            'w-full border border-surface-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand/20 outline-none',
                            ri === 0 && 'font-semibold bg-surface-100'
                          )}
                          placeholder={ri === 0 ? 'Header' : 'Cell'}
                        />
                      </td>
                    ))}
                    <td className="p-0.5 w-6">
                      <button
                        onClick={() => {
                          const rows = (block.rows || []).filter((_, j) => j !== ri);
                          onChange({ ...block, rows });
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const colCount = (block.rows?.[0] || []).length || 2;
                onChange({ ...block, rows: [...(block.rows || []), Array(colCount).fill('')] });
              }}
              className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add row
            </button>
            <button
              onClick={() => {
                const rows = (block.rows || []).map((r) => [...r, '']);
                onChange({ ...block, rows });
              }}
              className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add column
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Main Page ─────────────────── */
export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([...blogPosts]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  /* Filtered posts */
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === 'all' || p.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [posts, searchQuery, filterCategory]);

  /* Start new post */
  function handleNew() {
    const data = emptyPost();
    const newPost: BlogPost = {
      ...data,
      id: `post-${String(posts.length + 1).padStart(3, '0')}`,
    };
    setEditing(newPost);
    setIsNew(true);
    setTagsInput('');
  }

  /* Edit existing */
  function handleEdit(post: BlogPost) {
    setEditing({ ...post, content: post.content.map((b) => ({ ...b })) });
    setIsNew(false);
    setTagsInput(post.tags.join(', '));
  }

  /* Save */
  function handleSave() {
    if (!editing) return;
    const updated = { ...editing, tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean) };
    if (isNew) {
      setPosts((prev) => [updated, ...prev]);
    } else {
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
    setEditing(null);
    setIsNew(false);
  }

  /* Update editing field */
  function updateField<K extends keyof BlogPost>(key: K, value: BlogPost[K]) {
    if (!editing) return;
    const update: Partial<BlogPost> = { [key]: value };
    if (key === 'title') {
      update.slug = slugify(value as string);
    }
    setEditing({ ...editing, ...update });
  }

  /* Update content block */
  function updateBlock(index: number, block: BlogContentBlock) {
    if (!editing) return;
    const content = [...editing.content];
    content[index] = block;
    setEditing({ ...editing, content });
  }

  function removeBlock(index: number) {
    if (!editing) return;
    setEditing({ ...editing, content: editing.content.filter((_, i) => i !== index) });
  }

  function addBlock(type: BlogContentBlock['type']) {
    if (!editing) return;
    setEditing({ ...editing, content: [...editing.content, createEmptyBlock(type)] });
    setAddBlockOpen(false);
  }

  /* Export as TypeScript */
  function handleExport() {
    const ts = `import { BlogPost } from '@/types/blog';\n\nconst AUTHOR = { name: 'Trustner Research', role: 'Investment Education Team' };\n\nexport const blogPosts: BlogPost[] = ${JSON.stringify(posts, null, 2).replace(/"([^"]+)":/g, '$1:')};\n`;
    const blob = new Blob([ts], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts.ts';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Editor view ─── */
  if (editing) {
    return (
      <div className="space-y-6">
        {/* Editor header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => { setEditing(null); setIsNew(false); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to posts
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
            >
              {isNew ? 'Create Post' : 'Update Post'}
            </button>
          </div>
        </div>

        {/* Sticky save bar at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-surface-300 px-6 py-3 flex items-center justify-between lg:left-60">
          <span className="text-xs text-slate-500">
            {isNew ? 'Creating new post' : `Editing: ${editing.title || 'Untitled'}`}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditing(null); setIsNew(false); }}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors shadow-md"
            >
              {isNew ? 'Create Post' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className={cn('grid gap-6 pb-20', showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1')}>
          {/* Left: Editor */}
          <div className="space-y-4">
            {/* Meta fields */}
            <div className="card-base p-5 space-y-4">
              <h3 className="text-sm font-bold text-primary-700">Post Details</h3>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Title</label>
                <input
                  value={editing.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="Enter post title..."
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Slug</label>
                <input
                  value={editing.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Excerpt</label>
                <textarea
                  value={editing.excerpt}
                  onChange={(e) => updateField('excerpt', e.target.value)}
                  rows={2}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
                  placeholder="Short description..."
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
                  <select
                    value={editing.category}
                    onChange={(e) => updateField('category', e.target.value as BlogCategory)}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
                  <input
                    type="date"
                    value={editing.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Tags (comma-separated)</label>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="SIP, compounding, beginners..."
                />
              </div>

              {/* Featured & Gradient */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.featured || false}
                    onChange={(e) => updateField('featured', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <span className="text-xs font-semibold text-slate-600">Featured post</span>
                </label>
              </div>

              {/* Gradient picker */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-2">Cover Gradient</label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g}
                      onClick={() => updateField('coverGradient', g)}
                      className={cn(
                        'w-10 h-10 rounded-lg bg-gradient-to-br transition-all',
                        g,
                        editing.coverGradient === g ? 'ring-2 ring-primary-700 ring-offset-2 scale-110' : 'hover:scale-105'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Content blocks */}
            <div className="card-base p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary-700">Content Blocks</h3>
                <div className="relative">
                  <button
                    onClick={() => setAddBlockOpen(!addBlockOpen)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Block <ChevronDown className="w-3 h-3" />
                  </button>
                  {addBlockOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-dropdown border border-surface-200 py-1 w-44 z-20">
                      {BLOCK_TYPES.map((bt) => (
                        <button
                          key={bt.type}
                          onClick={() => addBlock(bt.type)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-600 hover:bg-surface-100 font-medium"
                        >
                          <bt.icon className="w-3.5 h-3.5 text-slate-400" />
                          {bt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {editing.content.map((block, i) => (
                  <BlockEditor
                    key={i}
                    block={block}
                    index={i}
                    onChange={(b) => updateBlock(i, b)}
                    onRemove={() => removeBlock(i)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          {showPreview && (
            <div className="card-base p-5 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              <h3 className="text-sm font-bold text-primary-700 mb-1">Live Preview</h3>
              <p className="text-[10px] text-slate-400 mb-4">Content will render like this on the blog</p>

              {/* Cover gradient preview */}
              <div className={cn('h-24 rounded-xl bg-gradient-to-br mb-4 flex items-end p-4', editing.coverGradient)}>
                <div>
                  <span className="text-[10px] font-bold text-white/70 uppercase">{editing.category}</span>
                  <h4 className="text-sm font-bold text-white leading-tight">{editing.title || 'Untitled Post'}</h4>
                </div>
              </div>

              <ContentPreview blocks={editing.content} />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── List view ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Blog Manager</h1>
          <p className="text-sm text-slate-500">{posts.length} posts total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
          >
            <Download className="w-3.5 h-3.5" /> Export TS
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Post
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts..."
          className="border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none w-64"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Post cards */}
      <div className="grid gap-4">
        {filteredPosts.map((post) => (
          <div key={post.id} className="card-base p-5 hover:shadow-elevated">
            <div className="flex items-start gap-4">
              {/* Cover gradient thumbnail */}
              <div className={cn('w-16 h-16 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center', post.coverGradient)}>
                <FileText className="w-6 h-6 text-white/80" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand">
                    {post.category}
                  </span>
                  {post.featured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" /> Featured
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{post.date}</span>
                </div>
                <h3 className="text-sm font-bold text-primary-700 truncate">{post.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{post.excerpt}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[10px] text-slate-400 bg-surface-100 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 4 && (
                    <span className="text-[10px] text-slate-400">+{post.tags.length - 4} more</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setPosts((prev) =>
                      prev.map((p) => (p.id === post.id ? { ...p, featured: !p.featured } : p))
                    );
                  }}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    post.featured ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-500'
                  )}
                >
                  {post.featured ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleEdit(post)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand border border-brand/20 hover:bg-brand-50 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400">
            No posts found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
