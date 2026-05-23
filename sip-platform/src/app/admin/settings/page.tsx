'use client';

import { useState } from 'react';
import {
  Settings, BookOpen, Image, Monitor, Plus, Trash2, Download,
  Search, Edit3, X, Check, AlertCircle, CheckCircle2,
  Globe, Shield, Cpu, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { GLOSSARY } from '@/data/glossary';
import type { GlossaryTerm } from '@/types/learning';

/* ─────────────────── Types ─────────────────── */
type Tab = 'glossary' | 'gallery' | 'system';

interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  category: 'team' | 'events' | 'office' | 'milestones';
}

/* ─────────────────── Constants ─────────────────── */
const GALLERY_CATEGORIES: GalleryImage['category'][] = ['team', 'events', 'office', 'milestones'];

const GLOSSARY_CATEGORIES = [
  ...new Set(GLOSSARY.map((t) => t.category)),
].sort();

/* ─────────────────── Main Page ─────────────────── */
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('glossary');

  /* ─── Glossary state ─── */
  const [terms, setTerms] = useState<GlossaryTerm[]>([...GLOSSARY]);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [isNewTerm, setIsNewTerm] = useState(false);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [glossaryFilter, setGlossaryFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [relatedInput, setRelatedInput] = useState('');

  /* ─── Gallery state ─── */
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [newImage, setNewImage] = useState<Omit<GalleryImage, 'id'>>({
    url: '',
    caption: '',
    category: 'team',
  });

  /* ─── Glossary handlers ─── */
  function filteredTerms() {
    return terms.filter((t) => {
      const matchSearch = !glossarySearch ||
        t.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
        t.definition.toLowerCase().includes(glossarySearch.toLowerCase());
      const matchCategory = glossaryFilter === 'all' || t.category === glossaryFilter;
      return matchSearch && matchCategory;
    });
  }

  function startNewTerm() {
    setEditingTerm({
      term: '',
      slug: '',
      definition: '',
      category: GLOSSARY_CATEGORIES[0] || 'Investment',
      relatedTerms: [],
    });
    setIsNewTerm(true);
    setRelatedInput('');
  }

  function startEditTerm(t: GlossaryTerm) {
    setEditingTerm({ ...t, relatedTerms: [...t.relatedTerms] });
    setIsNewTerm(false);
    setRelatedInput(t.relatedTerms.join(', '));
  }

  function saveTerm() {
    if (!editingTerm) return;
    const cleaned = {
      ...editingTerm,
      slug: editingTerm.term.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
      relatedTerms: relatedInput.split(',').map((r) => r.trim()).filter(Boolean),
    };
    if (isNewTerm) {
      setTerms((prev) => [...prev, cleaned].sort((a, b) => a.term.localeCompare(b.term)));
    } else {
      setTerms((prev) => prev.map((t) => (t.slug === cleaned.slug ? cleaned : t)));
    }
    setEditingTerm(null);
    setIsNewTerm(false);
  }

  function deleteTerm(slug: string) {
    setTerms((prev) => prev.filter((t) => t.slug !== slug));
    setDeleteConfirmId(null);
  }

  function exportGlossary() {
    const ts = `import { GlossaryTerm } from '@/types/learning';\n\nexport const GLOSSARY: GlossaryTerm[] = ${JSON.stringify(terms, null, 2)};\n`;
    const blob = new Blob([ts], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glossary.ts';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Gallery handlers ─── */
  function addImage() {
    if (!newImage.url) return;
    const img: GalleryImage = {
      ...newImage,
      id: `img-${Date.now()}`,
    };
    setGallery((prev) => [...prev, img]);
    setNewImage({ url: '', caption: '', category: 'team' });
  }

  function removeImage(id: string) {
    setGallery((prev) => prev.filter((img) => img.id !== id));
  }

  function exportGallery() {
    const ts = `export interface GalleryImage {\n  id: string;\n  url: string;\n  caption: string;\n  category: 'team' | 'events' | 'office' | 'milestones';\n}\n\nexport const galleryImages: GalleryImage[] = ${JSON.stringify(gallery, null, 2)};\n`;
    const blob = new Blob([ts], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gallery.ts';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Tab buttons ─── */
  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'glossary', label: 'Glossary', icon: BookOpen },
    { key: 'gallery', label: 'Gallery', icon: Image },
    { key: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-primary-700">Settings</h1>
        <p className="text-sm text-slate-500">Manage glossary, gallery, and system configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all',
              activeTab === tab.key
                ? 'bg-white text-primary-700 shadow-card'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ───────────── GLOSSARY TAB ───────────── */}
      {activeTab === 'glossary' && (
        <div className="space-y-4">
          {/* Glossary edit form */}
          {editingTerm && (
            <div className="card-base p-5 space-y-4 border-l-4 border-brand">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary-700">
                  {isNewTerm ? 'Add New Term' : `Edit: ${editingTerm.term}`}
                </h3>
                <button
                  onClick={() => { setEditingTerm(null); setIsNewTerm(false); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Term</label>
                  <input
                    value={editingTerm.term}
                    onChange={(e) => setEditingTerm({ ...editingTerm, term: e.target.value })}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                    placeholder="e.g., NAV"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
                  <input
                    value={editingTerm.category}
                    onChange={(e) => setEditingTerm({ ...editingTerm, category: e.target.value })}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                    placeholder="Fund Management"
                    list="glossary-categories"
                  />
                  <datalist id="glossary-categories">
                    {GLOSSARY_CATEGORIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Definition</label>
                <textarea
                  value={editingTerm.definition}
                  onChange={(e) => setEditingTerm({ ...editingTerm, definition: e.target.value })}
                  rows={3}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
                  placeholder="Full definition..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Related Terms (comma-separated slugs)</label>
                <input
                  value={relatedInput}
                  onChange={(e) => setRelatedInput(e.target.value)}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="nav, aum, mutual-fund"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveTerm}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isNewTerm ? 'Add Term' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setEditingTerm(null); setIsNewTerm(false); }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  placeholder="Search terms..."
                  className="border border-surface-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none w-56"
                />
              </div>
              <select
                value={glossaryFilter}
                onChange={(e) => setGlossaryFilter(e.target.value)}
                className="border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
              >
                <option value="all">All Categories</option>
                {GLOSSARY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-xs text-slate-400">{terms.length} terms</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportGlossary}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
              >
                <Download className="w-3.5 h-3.5" /> Export TS
              </button>
              <button
                onClick={startNewTerm}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Term
              </button>
            </div>
          </div>

          {/* Term list */}
          <div className="grid gap-2">
            {filteredTerms().map((t) => (
              <div key={t.slug} className="card-base p-4 hover:shadow-elevated">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h4 className="text-sm font-bold text-primary-700">{t.term}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-100 text-slate-500">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{t.definition}</p>
                    {t.relatedTerms.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">Related:</span>
                        {t.relatedTerms.map((rt) => (
                          <span key={rt} className="text-[10px] text-brand bg-brand-50 px-1.5 py-0.5 rounded">
                            {rt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEditTerm(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand-50 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirmId === t.slug ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteTerm(t.slug)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Confirm delete"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-surface-100 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(t.slug)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredTerms().length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">
                No terms found matching your criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────── GALLERY TAB ───────────── */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {/* Add image form */}
          <div className="card-base p-5 space-y-4">
            <h3 className="text-sm font-bold text-primary-700">Add Gallery Image</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Image URL Path</label>
                <input
                  value={newImage.url}
                  onChange={(e) => setNewImage({ ...newImage, url: e.target.value })}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="/images/gallery/team-01.jpg"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Caption</label>
                <input
                  value={newImage.caption}
                  onChange={(e) => setNewImage({ ...newImage, caption: e.target.value })}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="Image description..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
                <select
                  value={newImage.category}
                  onChange={(e) => setNewImage({ ...newImage, category: e.target.value as GalleryImage['category'] })}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
                >
                  {GALLERY_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={addImage}
              disabled={!newImage.url}
              className={cn(
                'flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-colors',
                newImage.url
                  ? 'bg-brand text-white hover:bg-brand-700'
                  : 'bg-surface-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <Plus className="w-3.5 h-3.5" /> Add Image
            </button>
          </div>

          {/* Gallery export */}
          {gallery.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{gallery.length} images</span>
              <button
                onClick={exportGallery}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
              >
                <Download className="w-3.5 h-3.5" /> Export TS
              </button>
            </div>
          )}

          {/* Gallery grid */}
          {gallery.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((img) => (
                <div key={img.id} className="card-base p-4 space-y-2">
                  <div className="h-32 rounded-lg bg-surface-100 flex items-center justify-center overflow-hidden">
                    {img.url.startsWith('/') || img.url.startsWith('http') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.url}
                        alt={img.caption}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-xs text-slate-400">Image not found</div>';
                        }}
                      />
                    ) : (
                      <div className="text-xs text-slate-400 text-center px-2">{img.url}</div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-primary-700">{img.caption || 'No caption'}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{img.category}</span>
                    </div>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-base p-12 text-center">
              <Image className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No gallery images yet</p>
              <p className="text-xs text-slate-400 mt-1">Add images using the form above to build your gallery</p>
            </div>
          )}
        </div>
      )}

      {/* ───────────── SYSTEM TAB ───────────── */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {/* System info cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card-base p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary-700">Domain</h3>
                  <p className="text-xs text-slate-400">Primary web domain</p>
                </div>
              </div>
              <div className="text-lg font-bold text-primary-700">merasip.com</div>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-green-600 font-semibold">Active</span>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary-700">AMFI Registration</h3>
                  <p className="text-xs text-slate-400">Mutual fund distributor</p>
                </div>
              </div>
              <div className="text-lg font-bold text-primary-700">ARN-286886</div>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-green-600 font-semibold">Registered</span>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary-700">Stack Version</h3>
                  <p className="text-xs text-slate-400">Technology platform</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Framework</span>
                  <span className="text-xs font-bold text-primary-700">Next.js 15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">UI Library</span>
                  <span className="text-xs font-bold text-primary-700">React 19</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Language</span>
                  <span className="text-xs font-bold text-primary-700">TypeScript 5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Styling</span>
                  <span className="text-xs font-bold text-primary-700">Tailwind CSS 3</span>
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary-700">Environment</h3>
                  <p className="text-xs text-slate-400">Runtime status</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Platform</span>
                  <span className="text-xs font-bold text-primary-700">Mera SIP Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Company</span>
                  <span className="text-xs font-bold text-primary-700">Trustner Asset Services</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Admin Panel</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Data Storage</span>
                  <span className="text-xs font-bold text-primary-700">Static TypeScript Files</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data summary */}
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-primary-700 mb-4">Data Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-surface-100 rounded-xl">
                <div className="text-2xl font-extrabold text-primary-700">{terms.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">Glossary Terms</div>
              </div>
              <div className="text-center p-3 bg-surface-100 rounded-xl">
                <div className="text-2xl font-extrabold text-primary-700">{gallery.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">Gallery Images</div>
              </div>
              <div className="text-center p-3 bg-surface-100 rounded-xl">
                <div className="text-2xl font-extrabold text-primary-700">{GLOSSARY_CATEGORIES.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">Term Categories</div>
              </div>
              <div className="text-center p-3 bg-surface-100 rounded-xl">
                <div className="text-2xl font-extrabold text-brand">
                  <CheckCircle2 className="w-6 h-6 mx-auto" />
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">All Systems Go</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
