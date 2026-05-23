'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Layers, ArrowUpDown, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PeerFund } from '@/types/live-fund';

interface PeerComparisonTableProps {
  peers: PeerFund[];
  currentFundName: string;
}

type SortKey = 'name' | 'oneYear' | 'threeYear' | 'fiveYear' | 'volatility' | 'expenseRatio' | 'aum';

function formatReturn(val: number | null): string {
  if (val === null || val === undefined) return '--';
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

function returnColor(val: number | null): string {
  if (val === null || val === undefined) return 'text-slate-400';
  return val >= 0 ? 'text-positive' : 'text-red-500';
}

function formatAUM(aum: number | null): string {
  if (aum === null || aum === undefined) return '--';
  if (aum >= 10000) return `${(aum / 10000).toFixed(1)}L Cr`;
  if (aum >= 1000) return `${(aum / 1000).toFixed(1)}K Cr`;
  return `${aum.toLocaleString('en-IN')} Cr`;
}

export function PeerComparisonTable({ peers, currentFundName }: PeerComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('threeYear');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...peers].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [peers, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  if (!peers || peers.length === 0) {
    return null;
  }

  const columns: { key: SortKey; label: string; align: string }[] = [
    { key: 'name', label: 'Fund Name', align: 'text-left' },
    { key: 'oneYear', label: '1Y Return', align: 'text-right' },
    { key: 'threeYear', label: '3Y Return', align: 'text-right' },
    { key: 'fiveYear', label: '5Y Return', align: 'text-right' },
    { key: 'volatility', label: 'Volatility', align: 'text-right' },
    { key: 'expenseRatio', label: 'Expense', align: 'text-right' },
    { key: 'aum', label: 'AUM', align: 'text-right' },
  ];

  return (
    <section className="section-padding bg-surface-100">
      <div className="container-custom">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-brand" />
          <h2 className="text-display-sm text-primary-700">Peer Comparison</h2>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Similar funds in the same category as {currentFundName}
        </p>

        <div className="overflow-x-auto rounded-xl border border-surface-300/70 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-100 border-b border-surface-300/70">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-brand transition-colors whitespace-nowrap',
                      col.align
                    )}
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className={cn(
                        'w-3 h-3',
                        sortKey === col.key ? 'text-brand' : 'text-slate-300'
                      )} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((peer, i) => (
                <tr
                  key={peer.code || peer.name}
                  className={cn(
                    'border-b border-surface-200 hover:bg-surface-50 transition-colors',
                    i % 2 === 1 && 'bg-surface-50/50'
                  )}
                >
                  <td className="p-3">
                    {peer.slug ? (
                      <Link
                        href={`/funds/${peer.slug}`}
                        className="font-semibold text-primary-700 hover:text-brand transition-colors"
                      >
                        {peer.shortName || peer.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-primary-700">
                        {peer.shortName || peer.name}
                      </span>
                    )}
                  </td>
                  <td className={cn('p-3 text-right font-semibold whitespace-nowrap', returnColor(peer.oneYear))}>
                    {formatReturn(peer.oneYear)}
                  </td>
                  <td className={cn('p-3 text-right font-semibold whitespace-nowrap', returnColor(peer.threeYear))}>
                    {formatReturn(peer.threeYear)}
                  </td>
                  <td className={cn('p-3 text-right font-semibold whitespace-nowrap', returnColor(peer.fiveYear))}>
                    {formatReturn(peer.fiveYear)}
                  </td>
                  <td className="p-3 text-right text-slate-600 whitespace-nowrap">
                    {peer.volatility !== null && peer.volatility !== undefined
                      ? `${peer.volatility.toFixed(2)}%`
                      : '--'}
                  </td>
                  <td className="p-3 text-right text-slate-600 whitespace-nowrap">
                    {peer.expenseRatio !== null && peer.expenseRatio !== undefined
                      ? `${peer.expenseRatio.toFixed(2)}%`
                      : '--'}
                  </td>
                  <td className="p-3 text-right text-slate-600 whitespace-nowrap">
                    {peer.aum !== null && peer.aum !== undefined ? (
                      <>
                        <IndianRupee className="w-3 h-3 inline -mt-0.5" />
                        {formatAUM(peer.aum)}
                      </>
                    ) : (
                      '--'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
