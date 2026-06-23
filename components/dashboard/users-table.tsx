"use client";

import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import EditUserModal from "./edit-user-modal";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
};

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | "admin" | "user">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const router = useRouter();

  const filteredUsers = users.filter((u) => {
    if (filter === "all") return true;
    return u.role === filter;
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users", {

        cache: "no-store",
      });

      const data = await res.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {

    if (!id) {
      console.error("Invalid user id:", id);
      return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    setDeletingId(id);

    console.log("DELETE ID:", id)


    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("DELETE ERROR:", data.error);
        return;
      }

      // setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.log("NETWORK ERROR:", err);
    } finally {
      setDeletingId(null);
    }
  };


 return (
  <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-xl backdrop-blur-xl">
    {/* FILTERS */}
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 bg-white/20 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            filter === "all"
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-white/50"
          }`}
        >
          All
        </button>

        <button
          onClick={() => setFilter("admin")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            filter === "admin"
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-white/50"
          }`}
        >
          Admins
        </button>

        <button
          onClick={() => setFilter("user")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            filter === "user"
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-white/50"
          }`}
        >
          Users
        </button>
      </div>
    </div>

    {/* TABLE */}
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse text-left">
        <thead>
          <tr className="border-b text-xs uppercase tracking-widest text-gray-500">
            <th className="px-6 py-4">Name & Email</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {filteredUsers.map((u) => (
            <tr
              key={u.id}
              className="group transition hover:bg-white/50"
            >
              {/* USER */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-white">
                    {u.email?.[0]?.toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {u.full_name || "No Name"}
                    </p>

                    <p className="truncate text-sm text-gray-500">
                      {u.email}
                    </p>
                  </div>
                </div>
              </td>

              {/* ROLE */}
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    u.role === "admin"
                      ? "bg-purple-100 text-primary"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {u.role}
                </span>
              </td>

              {/* STATUS */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      u.status === "active"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />

                  <span className="text-sm text-gray-600">
                    {u.status}
                  </span>
                </div>
              </td>

              {/* ACTIONS */}
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  <button
                    className="rounded-lg p-2 text-primary hover:bg-purple-50"
                    onClick={() => {
                      setSelectedUser(u);
                      setEditOpen(true);
                    }}
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id}
                    className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    title="Delete user"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* FOOTER */}
    <div className="flex flex-col gap-3 border-t border-white/20 bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Showing {filteredUsers.length} out of {users.length} users.
      </p>
    </div>

    <EditUserModal
      open={editOpen}
      onOpenChange={setEditOpen}
      user={selectedUser}
      onUpdated={() => router.refresh()}
    />
  </div>
);
}