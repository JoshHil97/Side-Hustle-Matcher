"use client";

import { AuthGate } from "@/components/auth/auth-gate";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-screen bg-stone-950">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-stone-900 to-stone-950">
          <TopBar />
          <main className="min-w-0 flex-1 bg-stone-100/95 p-6">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
