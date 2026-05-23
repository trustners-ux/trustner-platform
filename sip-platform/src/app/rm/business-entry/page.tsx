'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, ArrowLeft, Loader2, CheckCircle, Trash2, IndianRupee,
  Target, TrendingUp, FileText, AlertCircle, LogOut, Menu, X,
  Calendar, Package, Building2, User, Hash,
} from 'lucide-react';
import { PRODUCTS } from '@/lib/mis/employee-data';
import { formatINR } from '@/lib/mis/incentive-engine';
import type { MonthlyBusinessEntry } from '@/lib/mis/types';
import { RMNav } from '@/components/rm/RMNav';

interface UserInfo {
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  entity: string;
  segment: string;
}

export default function BusinessEntryPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [entries, setEntries] = useState<MonthlyBusinessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Form state
  const [productId, setProductId] = useState(0);
  const [rawAmount, setRawAmount] = useState('');
  const [clientName, setClientName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [insurer, setInsurer] = useState('');
  const [channelPayoutPct, setChannelPayoutPct] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const authRes = await fetch('/api/rm/auth');
        if (!authRes.ok) { router.push('/admin/login'); return; }
        const { user: u } = await authRes.json();
        setUser(u);

        const entryRes = await fetch('/api/mis/business-entries');
        if (entryRes.ok) {
          const { entries: e } = await entryRes.json();
          setEntries(e);
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const groups: Record<string, typeof PRODUCTS> = {};
    for (const p of PRODUCTS) {
      if (!groups[p.productCategory]) groups[p.productCategory] = [];
      groups[p.productCategory].push(p);
    }
    return groups;
  }, []);

  const selectedProduct = PRODUCTS.find(p => p.id === productId);
  const isChannelRM = user?.segment === 'CDM/POSP RM' || user?.segment === 'Area Manager';

  // Summary calculations
  const totalRaw = entries.reduce((s, e) => s + e.rawAmount, 0);
  const totalWeighted = entries.reduce((s, e) => s + e.weightedAmount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !rawAmount) return;

    setSaving(true);
    setSuccess('');

    try {
      const res = await fetch('/api/mis/business-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rawAmount: parseFloat(rawAmount),
          clientName: clientName || undefined,
          policyNumber: policyNumber || undefined,
          insurer: insurer || undefined,
          channelPayoutPct: isChannelRM ? channelPayoutPct : 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const { entry } = await res.json();
      setEntries(prev => [...prev, entry]);
      setSuccess(`Entry saved! Weighted: ${formatINR(entry.weightedAmount)}`);

      // Reset form
      setProductId(0);
      setRawAmount('');
      setClientName('');
      setPolicyNumber('');
      setInsurer('');
      setChannelPayoutPct(0);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/rm/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Tab Navigation */}
      <RMNav
        userName={user?.name}
        designation={user?.designation}
        entity={user?.entity}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Month Summary Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Entries</p>
              <p className="text-lg font-bold text-slate-700">{entries.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Raw Business</p>
              <p className="text-lg font-bold text-slate-700">{formatINR(totalRaw)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Weighted Business</p>
              <p className="text-lg font-bold text-emerald-600">{formatINR(totalWeighted)}</p>
            </div>
            <div className="ml-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                <Calendar className="w-3 h-3 inline mr-1" />
                April 2026
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                New Entry
              </h2>

              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">{success}</p>
                </div>
              )}

              <div className="space-y-3">
                {/* Product */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <Package className="w-3 h-3 inline mr-1" />Product
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value={0}>Select product...</option>
                    {Object.entries(productsByCategory).map(([cat, prods]) => (
                      <optgroup key={cat} label={cat}>
                        {prods.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.productName} (Credit: {p.creditPct}%)
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {selectedProduct && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tier {selectedProduct.tier} | Credit: {selectedProduct.creditPct}% | Multiplier: {selectedProduct.tier === 1 ? '100%' : selectedProduct.tier === 2 ? '75%' : selectedProduct.tier === 3 ? '50%' : '25%'}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <IndianRupee className="w-3 h-3 inline mr-1" />Premium / Amount
                  </label>
                  <input
                    type="number"
                    value={rawAmount}
                    onChange={(e) => setRawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    min={1}
                  />
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <User className="w-3 h-3 inline mr-1" />Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Client name"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Policy Number */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <Hash className="w-3 h-3 inline mr-1" />Policy / Folio Number
                  </label>
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="Policy number"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Insurer */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <Building2 className="w-3 h-3 inline mr-1" />Insurer / AMC
                  </label>
                  <input
                    type="text"
                    value={insurer}
                    onChange={(e) => setInsurer(e.target.value)}
                    placeholder="e.g. TATA AIA, Star Health, SBI MF"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Channel Payout (for CDM/POSP RM) */}
                {isChannelRM && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Channel Payout %
                    </label>
                    <select
                      value={channelPayoutPct}
                      onChange={(e) => setChannelPayoutPct(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value={0}>Direct (0% payout)</option>
                      <option value={60}>Sub-broker (60%)</option>
                      <option value={70}>POSP Normal (70%)</option>
                      <option value={80}>POSP Higher Pay / Digital (80%)</option>
                      <option value={85}>Franchise (85%)</option>
                    </select>
                    {channelPayoutPct > 0 && (
                      <p className="text-[10px] text-amber-600 mt-1">
                        Company margin: {100 - channelPayoutPct}% | Your credit reduced proportionally
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || !productId || !rawAmount}
                  className="w-full py-2.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add Entry</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Entries Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  This Month&apos;s Entries ({entries.length})
                </h2>
              </div>

              {entries.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No entries yet for this month</p>
                  <p className="text-xs text-slate-400 mt-1">Use the form to log your business</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">#</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Product</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Client</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Insurer</th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Raw Amt</th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Credit %</th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Weighted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, i) => {
                        const product = PRODUCTS.find(p => p.id === entry.productId);
                        return (
                          <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 last:border-0">
                            <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                            <td className="px-3 py-2.5">
                              <p className="text-xs font-medium text-slate-700">{product?.productName || '—'}</p>
                              <p className="text-[10px] text-slate-400">
                                Tier {product?.tier}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-600">{entry.clientName || '—'}</td>
                            <td className="px-3 py-2.5 text-xs text-slate-600">{entry.insurer || '—'}</td>
                            <td className="px-3 py-2.5 text-xs font-mono text-right text-slate-700">{formatINR(entry.rawAmount)}</td>
                            <td className="px-3 py-2.5 text-xs text-right text-slate-500">{entry.productCreditPct}%</td>
                            <td className="px-3 py-2.5 text-xs font-mono text-right font-semibold text-emerald-600">{formatINR(entry.weightedAmount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={4} className="px-3 py-3 text-xs font-bold text-slate-600">TOTAL</td>
                        <td className="px-3 py-3 text-xs font-bold text-right text-slate-700">{formatINR(totalRaw)}</td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3 text-xs font-bold text-right text-emerald-600">{formatINR(totalWeighted)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
