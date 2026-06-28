/**
 * Notification helpers shared by the announcements + notifications routes.
 */
import { getSupabaseAdmin } from '@/lib/db/supabase';

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

/** Resolve the signed-in actor's hr_employees.id from their email. */
export async function resolveEmployeeId(db: Db, email: string): Promise<number | null> {
  const { data } = await db
    .from('hr_employees')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return data?.id ?? null;
}

interface FanOutOpts {
  entities: string[];
  type: 'announcement' | 'broadcast' | 'system';
  title: string;
  body?: string | null;
  link?: string | null;
  announcementId?: number | null;
  createdBy: string;
}

/**
 * Insert one notification per active employee in the target entities.
 * Returns the number of recipients. Best-effort — caller decides on errors.
 */
export async function fanOutToActiveEmployees(db: Db, opts: FanOutOpts): Promise<number> {
  const entities = opts.entities?.length ? opts.entities : ['TAS', 'TIB'];
  const { data: employees } = await db
    .from('hr_employees')
    .select('id')
    .in('entity', entities)
    .neq('status', 'exited');
  const recipients = (employees ?? []) as Array<{ id: number }>;
  if (!recipients.length) return 0;

  const rows = recipients.map((e) => ({
    employee_id: e.id,
    announcement_id: opts.announcementId ?? null,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? null,
    link: opts.link ?? null,
    created_by: opts.createdBy,
  }));
  const { error } = await db.from('hr_notifications').insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}
