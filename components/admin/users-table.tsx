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
    <div className="rounded-2xl overflow-hidden border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl">

      <div className="p-4 border-b border-white/20 flex justify-between items-center bg-white/20">
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === "all"
              ? "bg-purple-600 text-white"
              : "hover:bg-white/50 text-gray-600"
              }`}>
            All
          </button>
          <button onClick={() => setFilter("admin")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === "admin"
              ? "bg-purple-600 text-white"
              : "hover:bg-white/50 text-gray-600"
              }`}>
            Admins
          </button>
          <button onClick={() => setFilter("user")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === "user"
              ? "bg-purple-600 text-white"
              : "hover:bg-white/50 text-gray-600"
              }`}>
            Users
          </button>
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs uppercase tracking-widest text-gray-500 border-b">
            <th className="px-6 py-4">Name & Email</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Status</th>
            {/* <th className="px-6 py-4">Last Active</th> */}
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {filteredUsers.map((u) => (
            <tr

              key={u.id}
              className="hover:bg-white/50 transition group"
            >
              {/* USER */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">

                  {/* Avatar (fallback initial) */}
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                    {u.email?.[0]?.toUpperCase()}
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">
                      {u.full_name || "No Name"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {u.email}
                    </p>
                  </div>

                </div>
              </td>

              {/* ROLE */}
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase
                  ${u.role === "admin"
                    ? "bg-purple-100 text-purple-700"
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
                    className={`w-2 h-2 rounded-full ${u.status === "active"
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
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">

                  <button className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg"
                    onClick={() => {
                      setSelectedUser(u);
                      setEditOpen(true);
                    }}>
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
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

      {/* FOOTER */}
      <div className="p-4 border-t border-white/20 flex justify-between items-center bg-white/10">
        <p className="text-sm text-gray-500">
          Showing {filteredUsers.length} out of {users.length} users.
        </p>

        {/* <div className="flex gap-2">
          <button className="px-3 py-1 rounded border text-gray-500">1</button>
          <button className="px-3 py-1 rounded border hover:bg-white/50">2</button>
        </div> */}
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