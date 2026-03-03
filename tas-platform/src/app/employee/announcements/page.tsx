import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee } from "@/lib/auth/actions";
import { formatDate } from "@/lib/utils/formatters";
import type { Announcement, AnnouncementCategory } from "@/types/employee";
import { Megaphone, Pin, Calendar, AlertTriangle, Newspaper, PartyPopper, Info } from "lucide-react";

const CATEGORY_CONFIG: Record<
  AnnouncementCategory,
  { label: string; color: string; icon: typeof Megaphone }
> = {
  general: {
    label: "General",
    color: "bg-gray-100 text-gray-700",
    icon: Info,
  },
  newsletter: {
    label: "Newsletter",
    color: "bg-blue-100 text-blue-700",
    icon: Newspaper,
  },
  policy_update: {
    label: "Policy Update",
    color: "bg-purple-100 text-purple-700",
    icon: Megaphone,
  },
  event: {
    label: "Event",
    color: "bg-green-100 text-green-700",
    icon: PartyPopper,
  },
  urgent: {
    label: "Urgent",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
};

export default async function AnnouncementsPage() {
  const employee = await getEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Fetch published announcements that haven't expired
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, author:employees!announcements_created_by_fkey(*)")
    .lte("published_at", now)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  // Filter out expired announcements client-side (Supabase doesn't easily do OR null + gt)
  const activeAnnouncements: Announcement[] = (announcements || []).filter(
    (a: Announcement) => !a.expires_at || new Date(a.expires_at) > new Date()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="mt-1 text-sm text-gray-500">
          Stay updated with company news, policy changes, and events.
        </p>
      </div>

      {activeAnnouncements.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="py-8 text-center text-sm text-gray-400">
            <Megaphone className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            No announcements at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeAnnouncements.map((announcement) => {
            const config =
              CATEGORY_CONFIG[announcement.category] || CATEGORY_CONFIG.general;
            const CategoryIcon = config.icon;

            return (
              <div
                key={announcement.id}
                className={`rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                  announcement.is_pinned
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-gray-100"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        announcement.is_pinned ? "bg-amber-100" : "bg-gray-50"
                      }`}
                    >
                      {announcement.is_pinned ? (
                        <Pin className="h-4 w-4 text-amber-600" />
                      ) : (
                        <CategoryIcon className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">
                          {announcement.title}
                        </h2>
                        {announcement.is_pinned && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Pinned
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {announcement.published_at
                          ? formatDate(announcement.published_at)
                          : formatDate(announcement.created_at)}
                        {announcement.author && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>{announcement.author.full_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Content */}
                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {announcement.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
