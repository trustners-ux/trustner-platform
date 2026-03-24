/**
 * Standard Financial Plan — redirects to the existing assess wizard.
 * The /assess page is the Standard tier (6 steps, goal-based planning).
 */
import { redirect } from 'next/navigation';

export default function StandardPlanPage() {
  redirect('/financial-planning/assess');
}
