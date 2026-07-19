"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

// global-error.tsx is used to catch errors in the root layout.tsx
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Root Layout Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center font-sans bg-gray-50">
          <div className="flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
            <div className="rounded-full bg-red-100 p-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900">Critical Error</h2>
              <p className="mt-2 text-sm text-gray-500">
                A critical error occurred while loading the application shell.
              </p>
            </div>
            
            <button
              onClick={() => reset()}
              className="mt-4 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-800"
            >
              <RefreshCcw className="h-4 w-4" /> Reload application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
