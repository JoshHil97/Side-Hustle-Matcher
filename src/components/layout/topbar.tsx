"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export function TopBar() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/dashboard/applications?q=${encodeURIComponent(q)}` : "/dashboard/applications");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-stone-700 bg-stone-900/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={onSubmit} className="w-full max-w-xl">
          <Input
            aria-label="Global application search"
            placeholder="Search applications by company or role"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border-stone-600 bg-stone-800 text-stone-100 placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-500/30"
          />
        </form>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.push("/dashboard/applications/new")}>New application</Button>
          <Button onClick={() => router.push("/dashboard/templates")}>Quick templates</Button>
        </div>
      </div>
    </header>
  );
}
