import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-extrabold text-gray-200">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Page Not Found</h1>
        <p className="mt-2 text-gray-500">The page you are looking for does not exist or has been moved.</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/" className="flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-600">
            <Home size={16} /> Go Home
          </Link>
          <Link href="/mutual-funds" className="flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
            <ArrowLeft size={16} /> Browse Funds
          </Link>
        </div>
      </div>
    </div>
  );
}
