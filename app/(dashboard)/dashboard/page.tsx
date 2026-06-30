"use client";

import StatsCards from "@/components/dashboard/stats-cards";
import { supabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type DashboardUser = {
  id: string;
  status: string | null;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      setProfile(profile);
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadUserStats = async () => {
      setStatsLoading(true);

      try {
        const res = await fetch("/api/users", {
          cache: "no-store",
        });

        const data: DashboardUser[] = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          setTotalUsers(0);
          setActiveUsers(0);
          return;
        }

        setTotalUsers(data.length);

        setActiveUsers(
          data.filter((user) => user.status?.toLowerCase() === "active").length
        );
      } catch (err) {
        console.log("DASHBOARD STATS ERROR:", err);
        setTotalUsers(0);
        setActiveUsers(0);
      } finally {
        setStatsLoading(false);
      }
    };

    loadUserStats();
  }, []);

  return (
    <div className="space-y-8 px-4 py-4 sm:px-6">
      <div>
        <h1 className="my-6 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          Hello,
          <span
            className="ml-2 break-words"
            title={profile?.full_name}
          >
            {profile?.full_name || "User"}
          </span>
        </h1>

        <p className="text-sm text-gray-500 sm:text-base dark:text-white/55">
          Welcome Back!
        </p>
      </div>

      <StatsCards
        totalUsers={totalUsers}
        activeUsers={activeUsers}
        loading={statsLoading}
      />
    </div>
  );
}