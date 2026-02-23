"use client";

import { useActionState, useEffect, useState } from "react";
import { initialActionState, updateProfileAction } from "@/server/actions";
import { TokenField } from "@/components/auth/token-field";
import { ActionMessage } from "@/components/ui/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { useSupabase } from "@/hooks/use-supabase";
import { useUserContext } from "@/hooks/use-user-context";

function getStoredPreference(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export default function SettingsPage() {
  const supabase = useSupabase();
  const { userId, loading } = useUserContext();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const [defaultCurrency, setDefaultCurrency] = useState(() =>
    getStoredPreference("jobcrm_default_currency", "GBP"),
  );
  const [followUpWindow, setFollowUpWindow] = useState(() =>
    getStoredPreference("jobcrm_follow_up_window_days", "7"),
  );

  const [state, action, pending] = useActionState(updateProfileAction, initialActionState);

  useEffect(() => {
    if (loading || !userId) return;

    Promise.all([
      supabase.from("profiles").select("full_name").eq("id", userId).single(),
      supabase.auth.getUser(),
    ]).then(([profileRes, userRes]) => {
      if (profileRes.error && profileRes.error.code !== "PGRST116") {
        setError(profileRes.error.message);
      } else {
        const profileData = profileRes.data as { full_name?: string } | null;
        setFullName(profileData?.full_name ?? "");
      }

      setEmail(userRes.data.user?.email ?? "");
    });
  }, [loading, userId, supabase]);

  function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem("jobcrm_default_currency", defaultCurrency);
    localStorage.setItem("jobcrm_follow_up_window_days", followUpWindow);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Settings</h1>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Profile</CardTitle>
          <form action={action} className="mt-4 space-y-3">
            <TokenField />
            <div>
              <Label>Email</Label>
              <Input value={email} disabled aria-disabled="true" />
            </div>
            <div>
              <Label>Full name</Label>
              <Input
                name="full_name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={pending}>Save profile</Button>
            <ActionMessage state={state} />
          </form>
        </Card>

        <Card>
          <CardTitle>Preferences</CardTitle>
          <form className="mt-4 space-y-3" onSubmit={savePreferences}>
            <div>
              <Label>Default currency</Label>
              <Select value={defaultCurrency} onChange={(event) => setDefaultCurrency(event.target.value)}>
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
            </div>
            <div>
              <Label>Follow-up window (days)</Label>
              <Input type="number" min={1} max={30} value={followUpWindow} onChange={(event) => setFollowUpWindow(event.target.value)} />
            </div>
            <Button type="submit">Save preferences</Button>
            <p className="text-xs text-stone-500">Preferences are stored locally in your browser for now.</p>
          </form>
        </Card>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
