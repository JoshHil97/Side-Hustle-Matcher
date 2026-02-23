"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${redirect}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="rounded-lg border border-stone-200 bg-white px-6 py-4 text-sm text-stone-600 shadow-sm">
          Loading your workspace...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
