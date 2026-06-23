"use client";

import UsersTable from "@/components/dashboard/users-table";
import { LayoutDashboard, UserPlus} from "lucide-react";
import CreateUserModal from "@/components/dashboard/create-user-modal";
import { useState } from "react";

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-8">

      <div className="flex items-end justify-between">

          <div>
          <h1 className="text-3xl font-bold text-gray-900 my-6">
            Users
          </h1>

          <p className="mt-1 text-gray-500">
            Manage team access permissions and monitor activity.
          </p>
          </div>

          <div>
          <button className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-md"
          onClick={()=>setOpen(true)}>
            <UserPlus size={20} />
            Create user
          </button>
          </div>

      </div>

      <UsersTable />

      <CreateUserModal open={open} onOpenChange={setOpen}></CreateUserModal>

    </div>
  );
}