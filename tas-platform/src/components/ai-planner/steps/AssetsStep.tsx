"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, PiggyBank, Plus, Trash2 } from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import { formatINR } from "@/lib/utils/formatters";
import type { Asset, NetWorthStatement } from "@/types/financial-plan";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const ASSET_TEMPLATES: {
  category: Asset["category"];
  label: string;
  isLiquid: boolean;
}[] = [
  { category: "cash", label: "Savings / Current Account", isLiquid: true },
  { category: "cash", label: "Fixed Deposits", isLiquid: true },
  { category: "equity", label: "Mutual Funds (Equity)", isLiquid: true },
  { category: "debt", label: "Mutual Funds (Debt)", isLiquid: true },
  { category: "equity", label: "Stocks / Shares", isLiquid: true },
  { category: "ppf", label: "PPF", isLiquid: false },
  { category: "epf", label: "EPF / PF", isLiquid: false },
  { category: "nps", label: "NPS", isLiquid: false },
  { category: "gold", label: "Gold / SGB", isLiquid: true },
  { category: "real-estate", label: "Real Estate (Property)", isLiquid: false },
  { category: "other", label: "Other Investments", isLiquid: true },
];

export default function AssetsStep({ onNext, onPrev }: Props) {
  const { plan, setNetWorth } = useFinancialPlanStore();

  const [assets, setAssets] = useState<Asset[]>(
    plan.netWorth?.assets || []
  );

  const addAsset = (template: (typeof ASSET_TEMPLATES)[number]) => {
    setAssets([
      ...assets,
      {
        id: crypto.randomUUID(),
        category: template.category,
        name: template.label,
        currentValue: 0,
        isLiquid: template.isLiquid,
      },
    ]);
  };

  const updateAsset = (id: string, value: number) => {
    setAssets(assets.map((a) => (a.id === id ? { ...a, currentValue: value } : a)));
  };

  const removeAsset = (id: string) => {
    setAssets(assets.filter((a) => a.id !== id));
  };

  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const liquidAssets = assets
    .filter((a) => a.isLiquid)
    .reduce((sum, a) => sum + a.currentValue, 0);

  const handleSubmit = () => {
    const existing = plan.netWorth;
    const data: NetWorthStatement = {
      assets,
      liabilities: existing?.liabilities || [],
      totalAssets,
      totalLiabilities: existing?.totalLiabilities || 0,
      netWorth: totalAssets - (existing?.totalLiabilities || 0),
      liquidAssets,
    };
    setNetWorth(data);
    onNext();
  };

  // Templates not yet added
  const availableTemplates = ASSET_TEMPLATES.filter(
    (t) => !assets.some((a) => a.name === t.label)
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <PiggyBank size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            What You Own
          </h2>
          <p className="text-sm text-gray-500">
            Add your assets and investments
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {/* Quick add buttons */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-gray-400">
            Quick Add
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTemplates.map((t) => (
              <button
                key={t.label}
                onClick={() => addAsset(t)}
                className="flex items-center gap-1 rounded-lg border border-dashed border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <Plus size={12} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Asset list */}
        {assets.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            <PiggyBank size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">
              Click on the buttons above to add your assets
            </p>
          </div>
        )}

        {assets.map((asset) => (
          <div
            key={asset.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
          >
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-700">{asset.name}</p>
              <p className="text-[11px] text-gray-400">
                {asset.isLiquid ? "Liquid" : "Illiquid"} •{" "}
                {asset.category.replace("-", " ")}
              </p>
            </div>
            <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5">
              <span className="mr-1 text-sm text-gray-400">₹</span>
              <input
                type="number"
                value={asset.currentValue}
                onChange={(e) =>
                  updateAsset(asset.id, Math.max(0, Number(e.target.value)))
                }
                className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
                placeholder="0"
              />
            </div>
            <button
              onClick={() => removeAsset(asset.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* Totals */}
        {assets.length > 0 && (
          <div className="space-y-3 rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 p-5">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Assets</span>
              <span className="text-lg font-extrabold text-gray-900">
                {formatINR(totalAssets)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Liquid Assets</span>
              <span className="text-sm font-bold text-blue-700">
                {formatINR(liquidAssets)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Next: Liabilities <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
