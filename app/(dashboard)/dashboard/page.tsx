"use client";

import StatsCards from "@/components/dashboard/stats-cards";
import { LayoutDashboard, UserPlus } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    // Fetch user from supabase
    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabaseClient.auth.getUser();

            if (!user) return;

            setUser(user);

            const { data: profile } = await supabaseClient
                .from("profiles")
                .select("role, full_name")
                .eq("id", user.id)
                .single();

            setProfile(profile);
        };

        loadUser();
    }, []);

   return (
  <div className="space-y-8 px-4 py-4 sm:px-6">
    <div>
      <h1 className="my-6 text-2xl font-bold text-gray-900 sm:text-3xl">
        Hello,
        <span
          className="ml-2 break-words"
          title={profile?.full_name}
        >
          {profile?.full_name || "User"}
        </span>
      </h1>

      <p className="text-sm text-gray-500 sm:text-base">
        Welcome Back!
      </p>
    </div>

    <StatsCards />
  </div>
);
}