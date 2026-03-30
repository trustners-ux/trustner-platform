'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3, Plus, Trash2, Download, ArrowLeft, Eye, EyeOff,
  TrendingUp, TrendingDown, Minus, AlertCircle,
  Clock, Users, Landmark, Gem, DollarSign, Zap, Shield,
  PieChart, Scale, Receipt, Lightbulb, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { marketCommentaries } from '@/data/market/commentaries';
import { marketInsights } from '@/data/market/insights';
import type { MarketCommentary, MarketInsight } from '@/types/market';

/* ─────────────────── Constants ─────────────────── */
type Tab = 'commentary' | 'insights';
type Outlook = MarketCommentary['outlook'];
type InsightCategory = MarketInsight['category'];

const OUTLOOKS: Outlook[] = ['Bullish', 'Neutral', 'Bearish', 'Cautiously Optimistic'];
const INSIGHT_CATEGORIES: InsightCategory[] = ['SIP Timing', 'Market Education', 'Industry News', 'Strategy'];

const ICON_MAP: Record<string, React.ElementType> = {
  Clock, TrendingUp, Users, Landmark, Gem, DollarSign, Zap, Shield, PieChart, Scale, Receipt, Lightbulb, AlertCircle,
};
const ICON_NAMES = Object.keys(ICON_MAP);

const GRADIENTS = [
  'from-brand-500 to-brand-700',
  'from-teal-500 to-teal-600',
  'from-amber-500 to-secondary-600',
  'from-amber-500 to-orange-600',
  'from-amber-500 to-yellow-600',
  'from-cyan-500 to-brand-600',
  'from-rose-500 to-pink-600',
  'from-red-500 to-rose-600',
  'from-green-500 to-teal-600',
  'from-teal-500 to-cyan-600',
  'from-purple-500 to-indigo-600',
];

function outlookColor(outlook: Outlook): string {
  switch (outlook) {
    case 'Bullish': return 'bg-green-50 text-green-700';
    case 'Bearish': return 'bg-red-50 text-red-700';
    case 'Cautiously Optimistic': return 'bg-brand-50 text-brand';
    default: return 'bg-amber-50 text-amber-700';
  }
}

function outlookIcon(outlook: Outlook) {
  switch (outlook) {
    case 'Bullish': return TrendingUp;
    case 'Bearish': return TrendingDown;
    default: return Minus;
  }
}

/* ─────────────────── Commentary Preview ─────────────────── */
function CommentaryPreview({ data }: { data: MarketCommentary }) {
  const OutlookIcon = outlookIcon(data.outlook);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1', outlookColor(data.outlook))}>
          <OutlookIcon className="w-3 h-3" />
          {data.outlook}
        </span>
        <span className="text-[10px] text-slate-400">{data.weekRange}</span>
      </div>
      <h4 className="text-sm font-bold text-primary-700">{data.title || 'Untitled Commentary'}</h4>
      <p className="text-xs text-slate-600 leading-relaxed">{data.summary || 'No summary yet...'}</p>
      {data.keyPoints.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-slate-600 mb-1">Key Points</h5>
          <ul className="space-y-1">
            {data.keyPoints.map((kp, i) => (
              <li key={i} className="text-xs text-slate-500 flex gap-2">
                <span className="text-brand font-bold mt-0.5">*</span>
                <span>{kp || 'Empty point'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.sipAdvice && (
        <div className="border-l-4 border-brand-300 bg-brand-50 p-3 rounded-r-lg">
          <h5 className="text-xs font-bold text-brand-700 mb-1">SIP Advice</h5>
          <p className="text-xs text-brand-800 leading-relaxed">{data.sipAdvice}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Insight Preview ─────────────────── */
function InsightPreview({ data }: { data: MarketInsight }) {
  const Icon = ICON_MAP[data.icon] || AlertCircle;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', data.color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{data.category}</span>
          <h4 className="text-sm font-bold text-primary-700">{data.title || 'Untitled Insight'}</h4>
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{data.content || 'No content yet...'}</p>
      <span className="text-[10px] text-slate-400">{data.date}</span>
    </div>
  );
}

/* ─────────────────── Main Page ─────────────────── */
export default function AdminMarketPage() {
  const [activeTab, setActiveTab] = useState<Tab>('commentary');

  /* Commentary state */
  const [commentaries, setCommentaries] = useState<MarketCommentary[]>([...marketCommentaries]);
  const [editingCommentary, setEditingCommentary] = useState<MarketCommentary | null>(null);
  const [isNewCommentary, setIsNewCommentary] = useState(false);
  const [showCommentaryPreview, setShowCommentaryPreview] = useState(true);

  /* Insights state */
  const [insights, setInsights] = useState<MarketInsight[]>([...marketInsights]);
  const [editingInsight, setEditingInsight] = useState<MarketInsight | null>(null);
  const [isNewInsight, setIsNewInsight] = useState(false);
  const [showInsightPreview, setShowInsightPreview] = useState(true);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  /* ─── Commentary handlers ─── */
  function newCommentary() {
    setEditingCommentary({
      id: `week-${new Date().toISOString().split('T')[0]}`,
      title: '',
      date: new Date().toISOString().split('T')[0],
      weekRange: '',
      summary: '',
      keyPoints: [''],
      outlook: 'Neutral',
      sipAdvice: '',
    });
    setIsNewCommentary(true);
  }

  function editCommentary(c: MarketCommentary) {
    setEditingCommentary({ ...c, keyPoints: [...c.keyPoints] });
    setIsNewCommentary(false);
  }

  function saveCommentary() {
    if (!editingCommentary) return;
    const cleaned = {
      ...editingCommentary,
      keyPoints: editingCommentary.keyPoints.filter((kp) => kp.trim()),
    };
    if (isNewCommentary) {
      setCommentaries((prev) => [cleaned, ...prev]);
    } else {
      setCommentaries((prev) => prev.map((c) => (c.id === cleaned.id ? cleaned : c)));
    }
    setEditingCommentary(null);
    setIsNewCommentary(false);
  }

  function updateCommentaryField<K extends keyof MarketCommentary>(key: K, value: MarketCommentary[K]) {
    if (!editingCommentary) return;
    setEditingCommentary({ ...editingCommentary, [key]: value });
  }

  function exportCommentaries() {
    const ts = `import { MarketCommentary } from '@/types/market';\n\nexport const marketCommentaries: MarketCommentary[] = ${JSON.stringify(commentaries, null, 2)};\n`;
    const blob = new Blob([ts], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'commentaries.ts';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Insight handlers ─── */
  function newInsight() {
    setEditingInsight({
      id: `insight-${Date.now()}`,
      title: '',
      category: 'Market Education',
      content: '',
      date: new Date().toISOString().split('T')[0],
      icon: 'Lightbulb',
      color: GRADIENTS[0],
    });
    setIsNewInsight(true);
  }

  function editInsight(ins: MarketInsight) {
    setEditingInsight({ ...ins });
    setIsNewInsight(false);
  }

  function saveInsight() {
    if (!editingInsight) return;
    if (isNewInsight) {
      setInsights((prev) => [editingInsight, ...prev]);
    } else {
      setInsights((prev) => prev.map((i) => (i.id === editingInsight.id ? editingInsight : i)));
    }
    setEditingInsight(null);
    setIsNewInsight(false);
  }

  function updateInsightField<K extends keyof MarketInsight>(key: K, value: MarketInsight[K]) {
    if (!editingInsight) return;
    setEditingInsight({ ...editingInsight, [key]: value });
  }

  function exportInsights() {
    const ts = `import { MarketInsight } from '@/types/market';\n\nexport const marketInsights: MarketInsight[] = ${JSON.stringify(insights, null, 2)};\n`;
    const blob = new Blob([ts], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insights.ts';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Commentary editor view ─── */
  if (editingCommentary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => { setEditingCommentary(null); setIsNewCommentary(false); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to list
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCommentaryPreview(!showCommentaryPreview)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
            >
              {showCommentaryPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showCommentaryPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={saveCommentary}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
            >
              {isNewCommentary ? 'Create Commentary' : 'Update Commentary'}
            </button>
          </div>
        </div>

        <div className={cn('grid gap-6', showCommentaryPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1')}>
          {/* Form */}
          <div className="card-base p-5 space-y-4">
            <h3 className="text-sm font-bold text-primary-700">Commentary Details</h3>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Title</label>
              <input
                value={editingCommentary.title}
                onChange={(e) => updateCommentaryField('title', e.target.value)}
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="Weekly commentary title..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={editingCommentary.date}
                  onChange={(e) => updateCommentaryField('date', e.target.value)}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Week Range</label>
                <input
                  value={editingCommentary.weekRange}
                  onChange={(e) => updateCommentaryField('weekRange', e.target.value)}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="Feb 17 - Feb 21, 2026"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Outlook</label>
              <div className="flex flex-wrap gap-2">
                {OUTLOOKS.map((o) => {
                  const OIcon = outlookIcon(o);
                  return (
                    <button
                      key={o}
                      onClick={() => updateCommentaryField('outlook', o)}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                        editingCommentary.outlook === o ? outlookColor(o) : 'bg-surface-100 text-slate-400 hover:text-slate-600'
                      )}
                    >
                      <OIcon className="w-3 h-3" />
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Summary</label>
              <textarea
                value={editingCommentary.summary}
                onChange={(e) => updateCommentaryField('summary', e.target.value)}
                rows={4}
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
                placeholder="Weekly market summary..."
              />
            </div>

            {/* Key Points */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Key Points</label>
              <div className="space-y-2">
                {editingCommentary.keyPoints.map((kp, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs text-slate-400 mt-2 w-4 flex-shrink-0">{i + 1}.</span>
                    <textarea
                      value={kp}
                      onChange={(e) => {
                        const points = [...editingCommentary.keyPoints];
                        points[i] = e.target.value;
                        updateCommentaryField('keyPoints', points);
                      }}
                      rows={2}
                      className="flex-1 border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
                      placeholder="Key market point..."
                    />
                    <button
                      onClick={() => {
                        const points = editingCommentary.keyPoints.filter((_, j) => j !== i);
                        updateCommentaryField('keyPoints', points);
                      }}
                      className="text-red-400 hover:text-red-600 mt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateCommentaryField('keyPoints', [...editingCommentary.keyPoints, ''])}
                  className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add key point
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">SIP Advice</label>
              <textarea
                value={editingCommentary.sipAdvice}
                onChange={(e) => updateCommentaryField('sipAdvice', e.target.value)}
                rows={3}
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
                placeholder="SIP-focused advice for investors..."
              />
            </div>
          </div>

          {/* Preview */}
          {showCommentaryPreview && (
            <div className="card-base p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="text-sm font-bold text-primary-700 mb-1">Live Preview</h3>
              <p className="text-[10px] text-slate-400 mb-4">How the commentary will appear</p>
              <CommentaryPreview data={editingCommentary} />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── Insight editor view ─── */
  if (editingInsight) {
    const SelectedIcon = ICON_MAP[editingInsight.icon] || AlertCircle;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => { setEditingInsight(null); setIsNewInsight(false); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to list
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInsightPreview(!showInsightPreview)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
            >
              {showInsightPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showInsightPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={saveInsight}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
            >
              {isNewInsight ? 'Create Insight' : 'Update Insight'}
            </button>
          </div>
        </div>

        <div className={cn('grid gap-6', showInsightPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1')}>
          {/* Form */}
          <div className="card-base p-5 space-y-4">
            <h3 className="text-sm font-bold text-primary-700">Insight Details</h3>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Title</label>
              <input
                value={editingInsight.title}
                onChange={(e) => updateInsightField('title', e.target.value)}
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="Insight title..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
                <select
                  value={editingInsight.category}
                  onChange={(e) => updateInsightField('category', e.target.value as InsightCategory)}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
                >
                  {INSIGHT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={editingInsight.date}
                  onChange={(e) => updateInsightField('date', e.target.value)}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Content</label>
              <textarea
                value={editingInsight.content}
                onChange={(e) => updateInsightField('content', e.target.value)}
                rows={6}
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y"
                placeholder="Insight content..."
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-2">Icon</label>
              <div className="relative">
                <button
                  onClick={() => setIconPickerOpen(!iconPickerOpen)}
                  className="flex items-center gap-2 px-3 py-2 border border-surface-200 rounded-lg text-sm hover:bg-surface-100 transition-colors"
                >
                  <SelectedIcon className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-600">{editingInsight.icon}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-auto" />
                </button>
                {iconPickerOpen && (
                  <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-dropdown border border-surface-200 p-2 z-20 grid grid-cols-4 gap-1 w-56">
                    {ICON_NAMES.map((name) => {
                      const IcoComp = ICON_MAP[name];
                      return (
                        <button
                          key={name}
                          onClick={() => { updateInsightField('icon', name); setIconPickerOpen(false); }}
                          className={cn(
                            'flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] transition-all',
                            editingInsight.icon === name
                              ? 'bg-brand-50 text-brand'
                              : 'text-slate-400 hover:bg-surface-100 hover:text-slate-600'
                          )}
                        >
                          <IcoComp className="w-4 h-4" />
                          <span className="truncate w-full text-center">{name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-2">Color Gradient</label>
              <div className="flex flex-wrap gap-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g}
                    onClick={() => updateInsightField('color', g)}
                    className={cn(
                      'w-10 h-10 rounded-lg bg-gradient-to-br transition-all',
                      g,
                      editingInsight.color === g ? 'ring-2 ring-primary-700 ring-offset-2 scale-110' : 'hover:scale-105'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {showInsightPreview && (
            <div className="card-base p-5 lg:sticky lg:top-20 lg:self-start">
              <h3 className="text-sm font-bold text-primary-700 mb-1">Live Preview</h3>
              <p className="text-[10px] text-slate-400 mb-4">How the insight will appear</p>
              <InsightPreview data={editingInsight} />
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
      <div>
        <h1 className="text-2xl font-extrabold text-primary-700">Market Pulse Manager</h1>
        <p className="text-sm text-slate-500">Manage weekly commentaries and market insights</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {(['commentary', 'insights'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize',
              activeTab === tab
                ? 'bg-white text-primary-700 shadow-card'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {tab === 'commentary' ? 'Commentary' : 'Insights'}
          </button>
        ))}
      </div>

      {/* Commentary Tab */}
      {activeTab === 'commentary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-500">{commentaries.length} commentaries</p>
            <div className="flex items-center gap-2">
              <button
                onClick={exportCommentaries}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
              >
                <Download className="w-3.5 h-3.5" /> Export TS
              </button>
              <button
                onClick={newCommentary}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Commentary
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {commentaries.map((c) => {
              const OIcon = outlookIcon(c.outlook);
              return (
                <div key={c.id} className="card-base p-5 hover:shadow-elevated">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1', outlookColor(c.outlook))}>
                          <OIcon className="w-3 h-3" />
                          {c.outlook}
                        </span>
                        <span className="text-[10px] text-slate-400">{c.weekRange}</span>
                      </div>
                      <h3 className="text-sm font-bold text-primary-700 truncate">{c.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.summary}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        <span>{c.keyPoints.length} key points</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{c.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => editCommentary(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand border border-brand/20 hover:bg-brand-50 transition-colors flex-shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-500">{insights.length} insights</p>
            <div className="flex items-center gap-2">
              <button
                onClick={exportInsights}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-200 text-slate-600 hover:bg-surface-100"
              >
                <Download className="w-3.5 h-3.5" /> Export TS
              </button>
              <button
                onClick={newInsight}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Insight
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {insights.map((ins) => {
              const Icon = ICON_MAP[ins.icon] || AlertCircle;
              return (
                <div key={ins.id} className="card-base p-4 hover:shadow-elevated">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', ins.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{ins.category}</span>
                      <h3 className="text-sm font-bold text-primary-700 truncate">{ins.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{ins.content}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{ins.date}</span>
                    </div>
                    <button
                      onClick={() => editInsight(ins)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand border border-brand/20 hover:bg-brand-50 transition-colors flex-shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
