"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: userData } = await supabaseClient.auth.getUser();

      if (!userData.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      setRole(data?.role ?? null);
      setLoading(false);
    };

    fetchRole();
  }, []);

  return { role, loading };
}