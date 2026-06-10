"use client";

import { Bell, Moon, Search } from "lucide-react";

export default function TopNavbar() {
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
            <div className="text-right">
              <p className="font-semibold">
                Admin
              </p>

              <p className="text-xs text-gray-500">
                System Administrator
              </p>
            </div>

            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"></div>

          </div>

        </div>

      </div>

    </header>
  );
}