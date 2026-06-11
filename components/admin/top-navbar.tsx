"use client";

import { supabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Bell, Moon, Search } from "lucide-react";

export default function TopNavbar() {
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

  // Get Initials
  const getInitials = (full_name: string) => {
    return full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-20 border-b border-white/30 bg-white/70 px-8 backdrop-blur-xl">

      <div className="flex h-full items-center justify-between">

        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search users..."
            className="w-full rounded-full border border-gray-200 bg-white/50 py-3 pl-11 pr-4 outline-none transition focus:border-indigo-400"
          />
        </div>

        <div className="flex items-center gap-6">

          <button className="relative">
            <Bell className="text-gray-600" />

            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          <button>
            <Moon className="text-gray-600" />
          </button>

          <div className="flex items-center gap-3">

            {/* USER INFO */}
            <div className="flex flex-col text-right leading-tight">

              {/* NAME */}
              <p
                className="font-semibold text-sm text-gray-900 max-w-[140px] truncate"
                title={profile?.full_name}
              >
                {profile?.full_name || "User"}
              </p>

              {/* ROLE */}
              <p className="text-xs text-gray-500 capitalize">
                {profile?.role || "user"}
              </p>
            </div>

            {/* AVATAR */}
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold uppercase">
              {profile?.full_name?.charAt(0) || "U"}
            </div>

          </div>

        </div>

      </div>

    </header>
  );
}