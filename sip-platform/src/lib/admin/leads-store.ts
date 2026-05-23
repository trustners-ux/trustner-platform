import { promises as fs } from 'fs';
import path from 'path';
import { put, list } from '@vercel/blob';

export type LeadStatus = 'new' | 'contacted' | 'follow-up' | 'converted' | 'archived';

export interface StoredLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  goal?: string;
  riskProfile?: string;
  riskScore?: number;
  riskAnswers?: Record<string, string>;
  preferredCallTime?: string;
  step?: number | string;
  source: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

const BLOB_KEY = 'leads/leads.json';
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

function getLeadsFilePath(): string {
  return path.join(process.cwd(), 'data', 'leads.json');
}

export async function getLeads(): Promise<StoredLead[]> {
  try {
    if (isProduction) {
      // Use Vercel Blob in production (persistent storage)
      const result = await list({ prefix: 'leads/leads', limit: 1 });
      if (result.blobs.length > 0) {
        const res = await fetch(result.blobs[0].url);
        return (await res.json()) as StoredLead[];
      }
      return [];
    } else {
      // Use local file in development
      const filePath = getLeadsFilePath();
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw) as StoredLead[];
    }
  } catch {
    return [];
  }
}

async function saveLeads(leads: StoredLead[]): Promise<void> {
  if (isProduction) {
    // Save to Vercel Blob (persistent, survives cold starts)
    await put(BLOB_KEY, JSON.stringify(leads, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } else {
    // Save to local file in development
    const filePath = getLeadsFilePath();
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(leads, null, 2));
  }
}

export async function addLead(
  lead: Omit<StoredLead, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<StoredLead> {
  const leads = await getLeads();
  const now = new Date().toISOString();
  const newLead: StoredLead = {
    ...lead,
    name: lead.name || '',
    phone: lead.phone || '',
    source: lead.source || 'unknown',
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  };
  leads.unshift(newLead);
  await saveLeads(leads);
  return newLead;
}

/**
 * Update an existing lead by phone number. Merges new data into the existing record.
 * Returns the updated lead, or null if no lead with that phone was found.
 */
export async function updateLeadByPhone(
  phone: string,
  data: Record<string, unknown>
): Promise<StoredLead | null> {
  const leads = await getLeads();
  const index = leads.findIndex((l) => l.phone === phone);
  if (index === -1) return null;

  // Merge fields — only overwrite with truthy values
  const existing = leads[index];
  if (data.name) existing.name = data.name as string;
  if (data.email) existing.email = data.email as string;
  if (data.goal) existing.goal = data.goal as string;
  if (data.riskProfile) existing.riskProfile = data.riskProfile as string;
  if (typeof data.riskScore === 'number') existing.riskScore = data.riskScore;
  if (data.riskAnswers) existing.riskAnswers = data.riskAnswers as Record<string, string>;
  if (data.preferredCallTime) existing.preferredCallTime = data.preferredCallTime as string;
  if (typeof data.step === 'number') existing.step = data.step;
  existing.updatedAt = new Date().toISOString();

  leads[index] = existing;
  await saveLeads(leads);
  return existing;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<StoredLead | null> {
  const leads = await getLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  leads[index].status = status;
  leads[index].updatedAt = new Date().toISOString();

  await saveLeads(leads);
  return leads[index];
}

export function leadsToCSV(leads: StoredLead[]): string {
  const header = 'Name,Phone,Email,Goal,Risk Profile,Risk Score,Preferred Time,Step,Source,Status,Created,Updated';
  const rows = leads.map((l) =>
    [
      l.name,
      l.phone,
      l.email || '',
      l.goal || '',
      l.riskProfile || '',
      l.riskScore?.toString() || '',
      l.preferredCallTime || '',
      l.step?.toString() || '',
      l.source,
      l.status,
      l.createdAt,
      l.updatedAt,
    ]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}
