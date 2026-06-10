"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEffect, useState } from "react";

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUpdated?: () => void;
};

export default function EditUserModal({
  open,
  onOpenChange,
  user,
  onUpdated,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setRole(user.role || "user");
      setStatus(user.status || "active");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          role,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("UPDATE ERROR:", data.error);
        return;
      }

      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      console.log("NETWORK ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl p-0 overflow-hidden bg-[#faf8ff] shadow-2xl">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Edit User
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Update member details and permissions
          </p>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Full Name */}
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Email (readonly) */}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </Button>

          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}