'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, CheckCircle, XCircle, Clock, Shield,
  MapPin, Building2, Briefcase, ChevronDown, ChevronRight,
  Loader2, KeyRound, AlertCircle, Copy, Check,
} from 'lucide-react';
import type { PasswordResetRequest } from '@/lib/employee/employee-auth';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  designation: string;
  department: string;
  companyGroup: string;
  jobLocation: string;
  role: string;
  doj: string;
  reportingHeadName: string;
  directReports: number;
}

export default function TeamPage() {
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ requestId: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const [resetRes, teamRes] = await Promise.all([
        fetch('/api/employee/auth/reset-request'),
        fetch('/api/admin/team/directory'),
      ]);

      if (resetRes.ok) {
        const data = await resetRes.json();
        setResetRequests(data.requests || []);
      }
      if (teamRes.ok) {
        const data = await teamRes.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApproveReset = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoading(requestId);
    try {
      const res = await fetch('/api/employee/auth/approve-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (res.ok && action === 'approve' && data.tempPassword) {
        setTempPassword({ requestId, password: data.tempPassword });
      }
      await loadData();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleDept = (dept: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept); else next.add(dept);
      return next;
    });
  };

  // Group employees by department
  const deptGroups = new Map<string, TeamMember[]>();
  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.designation.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );
  for (const emp of filteredEmployees) {
    const group = deptGroups.get(emp.department) || [];
    group.push(emp);
    deptGroups.set(emp.department, group);
  }

  const roleColors: Record<string, string> = {
    bod: 'bg-purple-100 text-purple-700',
    cdo: 'bg-indigo-100 text-indigo-700',
    regional_manager: 'bg-blue-100 text-blue-700',
    branch_head: 'bg-teal-100 text-teal-700',
    cdm: 'bg-cyan-100 text-cyan-700',
    manager: 'bg-emerald-100 text-emerald-700',
    sr_rm: 'bg-orange-100 text-orange-700',
    rm: 'bg-slate-100 text-slate-700',
    back_office: 'bg-gray-100 text-gray-600',
    support: 'bg-stone-100 text-stone-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Team Directory & Approvals</h1>
          <p className="text-sm text-slate-500">
            {employees.length} employees &middot; {resetRequests.length} pending reset{resetRequests.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ─── Password Reset Requests ─── */}
      {resetRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-amber-800">
              Password Reset Requests ({resetRequests.length})
            </h2>
          </div>
          <div className="divide-y divide-amber-100">
            {resetRequests.map((req) => (
              <div key={req.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{req.employeeName}</p>
                  <p className="text-xs text-slate-500">{req.employeeEmail}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(req.requestedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {tempPassword?.requestId === req.id ? (
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                      <code className="text-sm font-mono font-bold text-emerald-700">{tempPassword.password}</code>
                      <button onClick={copyPassword} className="text-emerald-600 hover:text-emerald-800">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApproveReset(req.id, 'reject')}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5 inline mr-1" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveReset(req.id, 'approve')}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionLoading === req.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Employee Directory ─── */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700">Employee Directory</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-52"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from(deptGroups.entries()).sort((a, b) => b[1].length - a[1].length).map(([dept, members]) => {
            const expanded = expandedDepts.has(dept);
            return (
              <div key={dept}>
                <button
                  onClick={() => toggleDept(dept)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">{dept}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{members.length} members</span>
                </button>

                {expanded && (
                  <div className="pb-2">
                    {members.map((emp) => (
                      <div key={emp.id} className="px-5 py-2.5 ml-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{emp.name}</p>
                            <p className="text-xs text-slate-500">{emp.designation}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">{emp.email}</span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" /> {emp.jobLocation}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {emp.directReports > 0 && (
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                              {emp.directReports} reports
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${roleColors[emp.role] || 'bg-slate-100 text-slate-600'}`}>
                            {emp.companyGroup}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="px-5 py-8 text-center">
            <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No employees match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
