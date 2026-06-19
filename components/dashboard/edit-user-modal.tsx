"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
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
      <DialogContent
        className="
          max-w-[540px]
          p-0
          overflow-hidden
          rounded-xl
          bg-white/70
          backdrop-blur-xl
          border border-white/50
          shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)]
        "
      >
        {/* HEADER */}
        <DialogHeader className="px-8 pt-8 pb-5">
          <DialogTitle className="text-2xl font-semibold text-[#131b2e]">
            Edit User
          </DialogTitle>

          <DialogDescription className="text-sm text-[#464554] mt-1">
            Update member details and permissions
          </DialogDescription>
        </DialogHeader>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-5">

          {/* Full Name */}
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="
                bg-white/50
                border border-outline-variant
                focus-visible:ring-2 focus-visible:ring-[#4648d4]/20
              "
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                bg-white/50
                border border-outline-variant
                focus-visible:ring-2 focus-visible:ring-[#4648d4]/20
              "
            />
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger
                  className="
                    bg-white/50
                    border border-outline-variant
                  "
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="z-[200]">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  className="
                    bg-white/50
                    border border-outline-variant
                  "
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="z-[200]">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/30">

            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="
                            rounded-xl
                            text-[#464554]
                            border-[#c7c4d7]
                            hover:bg-[#dae2fd]
                        "
            >
              Cancel
            </Button>

            <Button
              disabled={loading}
              className="
                bg-primary
                text-white
                hover:shadow-lg hover:shadow-[#4648d4]/30
              "
            >
              {loading ? "Updating..." : "Update User"}
            </Button>

          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}