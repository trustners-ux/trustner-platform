"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createAnnouncement } from "@/lib/auth/admin-actions";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.enum(["general", "newsletter", "policy_update", "event", "urgent"]),
  is_pinned: z.boolean(),
  publish_now: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "general", is_pinned: false, publish_now: true },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const result = await createAnnouncement({
      title: data.title,
      content: data.content,
      category: data.category,
      is_pinned: data.is_pinned,
      published_at: data.publish_now ? new Date().toISOString() : null,
    });
    if (result?.error) {
      alert(result.error);
      setIsLoading(false);
    } else {
      router.push("/employee/admin/announcements");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employee/admin/announcements" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Announcement</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Title</label>
            <input
              {...register("title")}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
              placeholder="Announcement title"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Content</label>
            <textarea
              {...register("content")}
              rows={8}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
              placeholder="Write your announcement..."
            />
            {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Category</label>
              <select
                {...register("category")}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
              >
                <option value="general">General</option>
                <option value="newsletter">Newsletter</option>
                <option value="policy_update">Policy Update</option>
                <option value="event">Event</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register("is_pinned")} className="rounded" />
              Pin this announcement
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register("publish_now")} className="rounded" />
              Publish immediately
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link href="/employee/admin/announcements" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60">
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Create Announcement
          </button>
        </div>
      </form>
    </div>
  );
}
