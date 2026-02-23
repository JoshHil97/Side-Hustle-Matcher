"use client";

import { useAuth } from "@/components/providers/auth-provider";

export function TokenField() {
  const { session } = useAuth();
  return <input type="hidden" name="access_token" value={session?.access_token ?? ""} readOnly />;
}
