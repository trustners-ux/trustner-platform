/**
 * Admin Employees & Org Chart
 *
 * Route: /admin/employees
 *
 * HR-friendly UI for:
 *   - Viewing the full team with reporting hierarchy
 *   - Changing reporting manager
 *   - Assigning a PD role (which controls cross-agent permissions)
 *   - Editing certifications
 *
 * Every change is written to app_role_assignments as a new history row.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ChevronRight, ChevronDown, Save, Loader2, UserCog, Network, ShieldCheck } from 'lucide-react';

interface EmployeeRow {
  id: number;
  employeeCode: string;
  name: string;
  email: string | null;
  designation: string | null;
  entity: string | null;
  levelCode: string | null;
  isActive: boolean;
  reportingManagerId: number | null;
  reportingManagerName: string | null;
  pdRoleId: number | null;
  pdRoleName: string | null;
  visibilityScope: string | null;
  certifications: string[];
  directReportCount: number;
}

interface Role {
  id: number;
  name: string;
  level: number;
  visibilityScope: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<EmployeeRow>>({});
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'table' | 'tree'>('table');

  useEffect(() => {
    void Promise.all([loadEmployees(), loadRoles()]);
  }, []);

  async function loadEmployees() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setEmployees(data.employees ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    try {
      const res = await fetch('/api/admin/roles', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setRoles(data.roles ?? []);
    } catch {
      // best-effort
    }
  }

  function startEdit(e: EmployeeRow) {
    setEditingId(e.id);
    setDraft({
      reportingManagerId: e.reportingManagerId,
      pdRoleId: e.pdRoleId,
      certifications: [...e.certifications],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  async function saveEdit(empId: number) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${empId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reportingManagerId: draft.reportingManagerId,
          pdRoleId: draft.pdRoleId,
          certifications: draft.certifications,
          reason: 'Updated via HR admin UI',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Save failed: ${data.error ?? `HTTP ${res.status}`}`);
        return;
      }
      cancelEdit();
      await loadEmployees();
    } catch (e) {
      alert(`Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Team & Roles</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {employees.length} employees · Reporting hierarchy + role assignment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/roles"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Permission Matrix
          </Link>
          <div className="rounded-lg border border-slate-300 bg-white text-xs">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 font-semibold ${view === 'table' ? 'bg-primary-50 text-primary-700' : 'text-slate-600'}`}
            >
              <Users className="inline h-3.5 w-3.5 mr-1" />
              Table
            </button>
            <button
              onClick={() => setView('tree')}
              className={`px-3 py-2 font-semibold ${view === 'tree' ? 'bg-primary-50 text-primary-700' : 'text-slate-600'}`}
            >
              <Network className="inline h-3.5 w-3.5 mr-1" />
              Org Chart
            </button>
          </div>
        </div>
      </div>

      {view === 'table' ? (
        <EmployeeTable
          employees={employees}
          roles={roles}
          editingId={editingId}
          draft={draft}
          setDraft={setDraft}
          startEdit={startEdit}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
          saving={saving}
        />
      ) : (
        <OrgChart
          employees={employees}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TABLE VIEW
// ─────────────────────────────────────────────────────────────────

interface EmployeeTableProps {
  employees: EmployeeRow[];
  roles: Role[];
  editingId: number | null;
  draft: Partial<EmployeeRow>;
  setDraft: (d: Partial<EmployeeRow>) => void;
  startEdit: (e: EmployeeRow) => void;
  cancelEdit: () => void;
  saveEdit: (id: number) => void | Promise<void>;
  saving: boolean;
}

function EmployeeTable({
  employees, roles, editingId, draft, setDraft, startEdit, cancelEdit, saveEdit, saving,
}: EmployeeTableProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th className="text-left px-4 py-2 font-semibold">Employee</th>
            <th className="text-left px-4 py-2 font-semibold">Designation</th>
            <th className="text-left px-4 py-2 font-semibold">Reports to</th>
            <th className="text-left px-4 py-2 font-semibold">PD Role</th>
            <th className="text-left px-4 py-2 font-semibold">Scope</th>
            <th className="text-left px-4 py-2 font-semibold">Reports under</th>
            <th className="text-left px-4 py-2 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => {
            const isEditing = editingId === e.id;
            return (
              <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 align-top">
                  <div className="font-semibold text-slate-900">{e.name}</div>
                  <div className="text-xs text-slate-500">{e.employeeCode} · {e.email ?? '—'}</div>
                </td>
                <td className="px-4 py-2 align-top text-xs text-slate-700">
                  {e.designation ?? '—'}
                  <div className="text-[11px] text-slate-500">{e.entity} · {e.levelCode ?? '—'}</div>
                </td>
                <td className="px-4 py-2 align-top text-xs">
                  {isEditing ? (
                    <select
                      value={draft.reportingManagerId ?? ''}
                      onChange={(ev) => setDraft({ ...draft, reportingManagerId: ev.target.value ? Number(ev.target.value) : null })}
                      className="border border-slate-300 rounded px-2 py-1 text-xs w-full"
                    >
                      <option value="">— None (top of chain) —</option>
                      {employees.filter((m) => m.id !== e.id).map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.designation ?? m.levelCode ?? ''})</option>
                      ))}
                    </select>
                  ) : (
                    e.reportingManagerName ?? <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2 align-top text-xs">
                  {isEditing ? (
                    <select
                      value={draft.pdRoleId ?? ''}
                      onChange={(ev) => setDraft({ ...draft, pdRoleId: ev.target.value ? Number(ev.target.value) : null })}
                      className="border border-slate-300 rounded px-2 py-1 text-xs w-full"
                    >
                      <option value="">— No PD role —</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>L{r.level} · {r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                      e.pdRoleName === 'admin' ? 'bg-rose-100 text-rose-700' :
                      e.pdRoleName === 'senior_reviewer' ? 'bg-amber-100 text-amber-700' :
                      e.pdRoleName === 'mid_reviewer' ? 'bg-teal-100 text-teal-700' :
                      e.pdRoleName === 'junior_analyst' ? 'bg-sky-100 text-sky-700' :
                      e.pdRoleName === 'trainee' ? 'bg-slate-100 text-slate-600' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {e.pdRoleName ?? '— none —'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 align-top text-xs">
                  {e.visibilityScope ? (
                    <span className="font-mono text-[11px] text-slate-700">{e.visibilityScope}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2 align-top text-xs text-slate-700">
                  {e.directReportCount > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-primary-50 text-primary-700 text-[11px] font-semibold">
                      {e.directReportCount} direct
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2 align-top text-xs">
                  {isEditing ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => void saveEdit(e.id)}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded bg-primary-600 px-2 py-1 text-white text-[11px] font-semibold hover:bg-primary-700 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded border border-slate-300 px-2 py-1 text-slate-600 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(e)}
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 text-[11px] font-semibold"
                    >
                      <UserCog className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ORG CHART (tree view)
// ─────────────────────────────────────────────────────────────────

function OrgChart({ employees }: { employees: EmployeeRow[] }) {
  // Build a tree from the flat list
  const childrenOf = new Map<number | null, EmployeeRow[]>();
  for (const e of employees) {
    const key = e.reportingManagerId ?? null;
    const arr = childrenOf.get(key) ?? [];
    arr.push(e);
    childrenOf.set(key, arr);
  }
  const roots = childrenOf.get(null) ?? [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-xs text-slate-500 mb-3">
        Reporting hierarchy — each manager shows their direct reports. Roots = no reporting manager.
      </p>
      <div className="space-y-2">
        {roots.map((r) => (
          <OrgNode key={r.id} employee={r} childrenOf={childrenOf} depth={0} />
        ))}
      </div>
    </div>
  );
}

function OrgNode({
  employee,
  childrenOf,
  depth,
}: {
  employee: EmployeeRow;
  childrenOf: Map<number | null, EmployeeRow[]>;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const reports = childrenOf.get(employee.id) ?? [];
  const indent = depth * 24;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5"
        style={{ paddingLeft: `${indent}px` }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className={reports.length === 0 ? 'invisible' : ''}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900">{employee.name}</span>
            <span className="text-[11px] text-slate-500">{employee.designation ?? employee.levelCode}</span>
            {employee.pdRoleName && (
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                {employee.pdRoleName}
              </span>
            )}
          </div>
          {reports.length > 0 && (
            <div className="text-[11px] text-slate-500">{reports.length} direct report{reports.length !== 1 ? 's' : ''}</div>
          )}
        </div>
      </div>
      {expanded &&
        reports.map((r) => (
          <OrgNode key={r.id} employee={r} childrenOf={childrenOf} depth={depth + 1} />
        ))}
    </div>
  );
}
