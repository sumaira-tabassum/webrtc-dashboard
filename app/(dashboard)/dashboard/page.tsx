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
        <div className="space-y-8">

            <h1 className="text-3xl font-bold text-gray-900 my-6">
                Hello,
                <span className="ml-2"
                    title={profile?.full_name}>
                    {profile?.full_name || "User"}
                </span>
            </h1>

            <p className="text-gray-500">
                Welcome Back!
            </p>

            <StatsCards />

        </div>
    );
}