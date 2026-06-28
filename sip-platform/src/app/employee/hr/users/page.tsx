'use client';

/**
 * HRMS User Management — Module Permission Toggles
 *
 * The page Ram explicitly asked for: per-user enablement of HRMS modules.
 * Super-admin (Ram) can pick any user email and toggle which HR modules
 * they can access. Default state is opt-in (security model).
 */

import { useState } from 'react';
import { Loader2, Save, Search, Shield } from 'lucide-react';
import { PERMISSION_GROUPS, DEFAULT_PERMISSIONS, type HrPermissions } from '@/lib/hr/permissions';

export default function HrUserPermissionsPage() {
  const [email, setEmail] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<HrPermissions>(DEFAULT_PERMISSIONS);
  const [msg, setMsg] = useState<string>('');

  const handleLoad = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/employee/hr/permissions?email=${encodeURIComponent(email.trim())}`);
      const j = await res.json();
      if (j.permissions) {
        const { email: _, updated_by: __, updated_at: ___, id: ____, created_at: _____, ...perms } = j.permissions;
        void _; void __; void ___; void ____; void _____;
        setPermissions({ ...DEFAULT_PERMISSIONS, ...perms });
        setLoaded(true);
      }
    } catch (e) {
      setMsg(`Load failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/employee/hr/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), permissions }),
      });
      const j = await res.json();
      if (res.ok) {
        setMsg(`✅ Saved permissions for ${email}`);
      } else {
        setMsg(`Save failed: ${j.error || res.status}`);
      }
    } catch (e) {
      setMsg(`Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof HrPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllInGroup = (groupItems: Array<{ key: keyof HrPermissions }>, value: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev };
      groupItems.forEach((i) => { next[i.key] = value; });
      return next;
    });
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">HRMS User Permissions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Enable / disable HRMS modules per user. Defaults are restrictive — turn on only what each role needs.
          </p>
        </div>
      </div>

      {/* User picker */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          User Email
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@trustner.in"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
          <button
            onClick={handleLoad}
            disabled={!email.trim() || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Load
          </button>
        </div>
      </div>

      {/* Permission toggles */}
      {loaded && (
        <div className="space-y-5">
          {PERMISSION_GROUPS.map((grp) => {
            const groupVals = grp.items.map((i) => permissions[i.key]);
            const allOn = groupVals.every(Boolean);
            const someOn = groupVals.some(Boolean);
            return (
              <div key={grp.group} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{grp.group}</h3>
                  <div className="flex gap-1 text-[11px]">
                    <button
                      onClick={() => setAllInGroup(grp.items, true)}
                      className="px-2 py-0.5 rounded text-emerald-700 hover:bg-emerald-100 font-semibold"
                    >
                      All ON
                    </button>
                    <button
                      onClick={() => setAllInGroup(grp.items, false)}
                      className="px-2 py-0.5 rounded text-rose-700 hover:bg-rose-100 font-semibold"
                    >
                      All OFF
                    </button>
                    <span className="ml-2 text-slate-400">
                      ({groupVals.filter(Boolean).length}/{groupVals.length} on)
                    </span>
                    {allOn && <span className="text-emerald-600">●</span>}
                    {!allOn && someOn && <span className="text-amber-500">●</span>}
                    {!someOn && <span className="text-slate-300">●</span>}
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {grp.items.map((item) => {
                    const on = permissions[item.key];
                    return (
                      <label key={item.key} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => toggle(item.key)}
                          className={`mt-0.5 relative w-9 h-5 rounded-full transition flex-shrink-0 ${
                            on ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              on ? 'translate-x-[18px]' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                          <div className="text-xs text-slate-500 leading-snug mt-0.5">{item.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between sticky bottom-0 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-md">
            <div className="text-xs text-slate-500">
              {msg && <span className={msg.startsWith('✅') ? 'text-emerald-700 font-semibold' : 'text-rose-700'}>{msg}</span>}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Permissions
            </button>
          </div>
        </div>
      )}

      {!loaded && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          Enter a user email and click <b>Load</b> to view / edit their HRMS module permissions.
          Defaults are restrictive — new users get only ESS (apply leave, punch attendance, view payslips).
        </div>
      )}
    </div>
  );
}
