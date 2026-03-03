import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import type { UserRole } from "@/types/employee";

export default function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
