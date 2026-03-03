import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Pin, Clock, Eye, EyeOff } from "lucide-react";
import type { Announcement, Employee } from "@/types/employee";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, author:employees!announcements_created_by_fkey(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">Manage company announcements and newsletters</p>
        </div>
        <Link
          href="/employee/admin/announcements/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          <Plus size={16} />
          New Announcement
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {announcements && announcements.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {announcements.map((a: Announcement & { author?: { full_name: string } }) => {
              const isPublished = a.published_at && new Date(a.published_at) <= new Date();
              return (
                <div key={a.id} className="flex items-center justify-between p-5">
                  <div className="flex items-start gap-3">
                    {a.is_pinned && <Pin size={14} className="mt-1 text-amber-500" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{a.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getCategoryColor(a.category)}`}>
                          {a.category.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-gray-500">{a.content}</p>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          Created {new Date(a.created_at).toLocaleDateString("en-IN")}
                        </span>
                        {a.author && <span>by {a.author.full_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                      {isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-gray-400">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}

function getCategoryColor(category: string) {
  const map: Record<string, string> = {
    general: "bg-gray-100 text-gray-600",
    newsletter: "bg-blue-100 text-blue-700",
    policy_update: "bg-purple-100 text-purple-700",
    event: "bg-green-100 text-green-700",
    urgent: "bg-red-100 text-red-700",
  };
  return map[category] || map.general;
}
