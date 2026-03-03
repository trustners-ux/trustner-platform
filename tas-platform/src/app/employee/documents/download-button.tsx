"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DownloadButtonProps {
  filePath: string;
  fileName: string;
}

export default function DocumentDownloadButton({
  filePath,
  fileName,
}: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  async function handleDownload() {
    setStatus("loading");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 60); // 60 second expiry

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || "Failed to generate download link");
      }

      // Trigger download
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={status === "loading"}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        status === "success"
          ? "bg-green-50 text-green-700"
          : status === "error"
            ? "bg-red-50 text-red-700"
            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {status === "loading" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating link...
        </>
      )}
      {status === "idle" && (
        <>
          <Download className="h-4 w-4" />
          Download
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="h-4 w-4" />
          Downloaded
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4" />
          Failed - Retry
        </>
      )}
    </button>
  );
}
