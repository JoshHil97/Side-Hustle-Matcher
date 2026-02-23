"use client";

import { useAuth } from "@/components/providers/auth-provider";

export function useUserContext() {
  const { user, session, loading } = useAuth();
  return {
    user,
    userId: user?.id ?? null,
    accessToken: session?.access_token ?? "",
    loading,
  };
}
