"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/applications", label: "Applications" },
  { href: "/dashboard/companies", label: "Companies" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/templates", label: "Templates" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function onSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    document.cookie = "jobcrm_token=; path=/; max-age=0; SameSite=Lax";
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-stone-700 bg-stone-900">
      <div className="border-b border-stone-700 px-5 py-4">
        <p className="text-sm font-semibold text-stone-100">Career Command</p>
        <p className="text-xs text-stone-400">Premium application CRM</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm",
                active ? "bg-stone-700 text-stone-100" : "text-stone-300 hover:bg-stone-800",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-700 p-3">
        <Button variant="secondary" className="w-full" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </aside>
  );
}
