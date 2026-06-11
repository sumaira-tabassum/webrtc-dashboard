"use client";

import Link from "next/link";
import {
  Users,
  Video,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { useUserRole } from "@/lib/hooks/userRole";
import { usePathname } from "next/navigation";

import { logout } from "@/lib/auth";

export default function Sidebar() {
  const { role, loading } = useUserRole();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/30 bg-white/70 backdrop-blur-xl shadow-xl">
      <div className="flex h-full flex-col p-6">

        <div className="mb-10">
          <h1 className="bg-purple-600 bg-clip-text text-2xl font-bold text-transparent">
            Dashboard
          </h1>

          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-gray-500">
            Admin Console
          </p>
        </div>

        <nav className="flex-1 space-y-2">

          {/* USERS (admin only) */}
          {!loading && role === "admin" && (
            <Link
              href="/users"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                isActive("/users")
                  ? "bg-purple-600 text-white font-semibold shadow-md"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              <Users size={20} />
              Users
            </Link>
          )}

          {/* MEETINGS */}
          <Link
            href="/meet"
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
              isActive("/meet")
                ? "bg-purple-600 text-white font-semibold shadow-md"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <Video size={20} />
            Meetings
          </Link>

          {/* SETTINGS */}
          {/* <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
              isActive("/settings")
                ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold shadow-md"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            <Settings size={20} />
            Settings
          </Link> */}

        </nav>

        <div className="space-y-2 border-t border-gray-200 pt-4">

          {/* <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600">
            <HelpCircle size={20} />
            Support
          </button> */}

          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-500 transition hover:bg-red-200"
          onClick={logout}>
            <LogOut size={20} />
            Sign Out
          </button>

        </div>

      </div>
    </aside>
  );
}