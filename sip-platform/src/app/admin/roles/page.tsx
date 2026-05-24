/**
 * Admin Roles & Permission Matrix
 *
 * Route: /admin/roles
 *
 * The governance artefact — a single grid showing every role and
 * every permission. Inline edit per cell. Used by Ram + HR to:
 *   - Audit the permission policy
 *   - Tighten/loosen specific role capabilities
 *   - Decide visibility scope per role
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Save, ShieldCheck, Users, Info } from 'lucide-react';

interface RoleRow {
  id: number;
  name: string;
  level: number;
  canUpload: boolean;
  canEditDraft: boolean;
  canReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
  canOverrideHierarchy: boolean;
  canManageUsers: boolean;
  canCreateMeetingBrief: boolean;
  canCreateProposal: boolean;
  canCreateOrientation: boolean;
  canCreatePeriodicReview: boolean;
  canViewPii: boolean;
  canExport: boolean;
  visibilityScope: 'own' | 'direct_reports' | 'subtree' | 'firm';
  approvalAumCeilingInr: number | null;
}

const PERMISSION_COLUMNS: Array<{
  key: keyof RoleRow;
  label: string;
  description: string;
  group: 'workflow' | 'creation' | 'sensitive' | 'admin';
}> = [
  // Workflow
  { key: 'canUpload', label: 'Upload',           description: 'Upload CAS / portfolio data',                                group: 'workflow' },
  { key: 'canEditDraft', label: 'Edit Draft',    description: 'Open + edit a draft diagnostic',                            group: 'workflow' },
  { key: 'canReview', label: 'Review',           description: 'Open assigned drafts in review queue',                      group: 'workflow' },
  { key: 'canApprove', label: 'Approve',         description: 'Sign-off on a reviewed diagnostic',                         group: 'workflow' },
  { key: 'canPublish', label: 'Publish',         description: 'Mark internally published & enable client share',           group: 'workflow' },
  // Creation across agents
  { key: 'canCreateMeetingBrief', label: 'Meeting Brief', description: 'Author a Meeting Prep brief',                      group: 'creation' },
  { key: 'canCreateProposal', label: 'Proposal',          description: 'Author an Investment Proposal',                    group: 'creation' },
  { key: 'canCreateOrientation', label: 'Orientation',    description: 'Run a new Client Orientation',                     group: 'creation' },
  { key: 'canCreatePeriodicReview', label: 'Periodic',    description: 'Author a Periodic Review',                         group: 'creation' },
  // Sensitive
  { key: 'canViewPii', label: 'View PII',                 description: 'See unmasked client name / mobile / PAN',          group: 'sensitive' },
  { key: 'canExport', label: 'Export',                    description: 'Download data as XLSX / CSV',                      group: 'sensitive' },
  // Admin
  { key: 'canOverrideHierarchy', label: 'Override Hier.', description: 'Bypass reporting-chain checks',                    group: 'admin' },
  { key: 'canManageUsers', label: 'Manage Users',         description: 'Edit roles + reporting structure',                 group: 'admin' },
];

const SCOPE_OPTIONS: Array<{ value: RoleRow['visibilityScope']; label: string; description: string }> = [
  { value: 'own',             label: 'Own only',           description: 'Only sees work they personally created.' },
  { value: 'direct_reports',  label: 'Direct Reports',     description: 'Sees own + direct reports (1 level down).' },
  { value: 'subtree',         label: 'Subtree',            description: 'Sees own + entire org tree below them.' },
  { value: 'firm',            label: 'Firm-wide',          description: 'Sees everything across the firm. Use sparingly.' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<number, Partial<RoleRow>>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setRoles(data.roles ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function setEdit(roleId: number, key: keyof RoleRow, value: unknown) {
    setEdits((prev) => ({ ...prev, [roleId]: { ...prev[roleId], [key]: value } }));
  }

  async function saveRole(roleId: number) {
    const patch = edits[roleId];
    if (!patch) return;
    setSavingId(roleId);
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Save failed: ${data.error ?? `HTTP ${res.status}`}`);
        return;
      }
      setEdits((prev) => {
        const next = { ...prev };
        delete next[roleId];
        return next;
      });
      await load();
    } catch (e) {
      alert(`Save failed: ${(e as Error).message}`);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-sm text-rose-900">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  function getEffective(role: RoleRow, key: keyof RoleRow): unknown {
    const patch = edits[role.id];
    if (patch && patch[key] !== undefined) return patch[key];
    return role[key];
  }
  function hasEdits(roleId: number): boolean {
    return Boolean(edits[roleId] && Object.keys(edits[roleId]).length > 0);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {roles.length} roles · Each cell controls who can do what. Visibility scope controls whose work each role can see.
          </p>
        </div>
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Users className="h-3.5 w-3.5" />
          Team & Assignments
        </Link>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>How to read this grid:</strong> rows are roles (ordered by hierarchy level), columns are permissions.
          A ticked box means holders of that role can do that thing. The <strong>Scope</strong> column controls whose work
          this role can see (own only / direct reports / full subtree / entire firm). Change anything and click Save on
          the right.
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 font-semibold border-b border-slate-200 sticky left-0 bg-slate-50 z-10">Role</th>
              <th className="text-left px-3 py-2 font-semibold border-b border-slate-200">Scope</th>
              {PERMISSION_COLUMNS.map((c) => (
                <th key={c.key} className="text-center px-2 py-2 font-semibold border-b border-slate-200" title={c.description}>
                  {c.label}
                </th>
              ))}
              <th className="text-right px-3 py-2 font-semibold border-b border-slate-200">Action</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => {
              const isSaving = savingId === r.id;
              const dirty = hasEdits(r.id);
              return (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 align-top sticky left-0 bg-white z-10">
                    <div className="font-bold text-slate-900">{r.name}</div>
                    <div className="text-[10px] text-slate-500">L{r.level}</div>
                    {r.approvalAumCeilingInr !== null && (
                      <div className="text-[10px] text-slate-500 mt-1">
                        Cap: ₹{(r.approvalAumCeilingInr / 1e7).toFixed(1)} Cr
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      value={getEffective(r, 'visibilityScope') as RoleRow['visibilityScope']}
                      onChange={(e) => setEdit(r.id, 'visibilityScope', e.target.value as RoleRow['visibilityScope'])}
                      className="border border-slate-300 rounded px-2 py-1 text-[11px] w-full"
                    >
                      {SCOPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} title={o.description}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  {PERMISSION_COLUMNS.map((c) => {
                    const checked = Boolean(getEffective(r, c.key));
                    return (
                      <td key={c.key} className="text-center px-2 py-2 align-top">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setEdit(r.id, c.key, e.target.checked)}
                          className="cursor-pointer"
                          title={c.description}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 align-top text-right">
                    {dirty ? (
                      <button
                        onClick={() => void saveRole(r.id)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1 rounded bg-primary-600 px-2 py-1 text-white text-[11px] font-semibold hover:bg-primary-700 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {SCOPE_OPTIONS.map((o) => (
          <div key={o.value} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="font-bold text-slate-900">{o.label}</div>
            <div className="text-slate-600 mt-0.5">{o.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
