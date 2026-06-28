/**
 * /admin/clients — REDIRECT to /admin/client-master.
 *
 * The legacy PD client-families directory has been superseded by the
 * Client Master at /admin/client-master (built from the Wealth Elite /
 * Investwell bulk import). Individual /admin/clients/[id]/* detail
 * pages remain functional so active PD diagnostic runs keep working.
 *
 * The original list-page source is preserved at page.pd-legacy.tsx.bak
 * in case we need to roll back.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Client master — Trustner',
  robots: { index: false, follow: false },
};

export default function ClientsRedirect() {
  redirect('/admin/client-master');
}
