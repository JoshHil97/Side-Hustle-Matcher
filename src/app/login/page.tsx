"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function getRedirectFromUrl() {
  if (typeof window === "undefined") return "/dashboard";
  return new URLSearchParams(window.location.search).get("redirect") ?? "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirectPath] = useState(getRedirectFromUrl);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(redirectPath);
    }
  }, [user, router, redirectPath]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(redirectPath);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-900/5">
        <h1 className="text-2xl font-semibold text-stone-900">Sign in</h1>
        <p className="mt-1 text-sm text-stone-600">Welcome back to your application CRM.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <FieldError message={error} />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-stone-600">
          Need an account?{" "}
          <Link className="font-medium text-stone-700 hover:text-stone-800" href="/signup">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
