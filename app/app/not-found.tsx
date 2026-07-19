import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="rounded-full bg-gray-100 p-4">
          <Search className="h-8 w-8 text-gray-500" />
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900">404 - Page Not Found</h2>
          <p className="mt-2 text-sm text-gray-500">
            We couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>
        
        <Link
          href="/"
          className="mt-4 flex items-center gap-2 rounded-xl bg-celo-green px-6 py-3 font-semibold text-white shadow-md shadow-celo-green/20 transition hover:bg-[#2ebf73] hover:shadow-lg active:scale-95"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
