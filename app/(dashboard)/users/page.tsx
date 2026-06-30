"use client";

import UsersTable from "@/components/dashboard/users-table";
import { LayoutDashboard, UserPlus} from "lucide-react";
import CreateUserModal from "@/components/dashboard/create-user-modal";
import { useState } from "react";

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  return (
  <div className="space-y-8 px-4 py-4 sm:px-6">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="my-6 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          Users
        </h1>

        <p className="mt-1 text-sm text-gray-500 sm:text-base dark:text-white/55">
          Manage team access permissions and monitor activity.
        </p>
      </div>

      <div className="w-full lg:w-auto">
        <button
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-md lg:w-auto"
          onClick={() => setOpen(true)}
        >
          <UserPlus size={20} />
          Create user
        </button>
      </div>
    </div>

    <UsersTable />

    <CreateUserModal
      open={open}
      onOpenChange={setOpen}
    />
  </div>
);
}
