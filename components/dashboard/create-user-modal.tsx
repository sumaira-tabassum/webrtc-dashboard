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

import { User } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { X } from "lucide-react";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function CreateUserModal({ open, onOpenChange }: Props) {

    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("user");
    const [status, setStatus] = useState("active");

    const [loading, setLoading] = useState(false);

    // const defaultPassword = process.env.DEFAULT_USER_PASSWORD!;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);

        try {
            //             const res = await supabaseServer
            //   .from("profiles")
            //   .select("*")
            const res = await fetch("/api/users", {
                cache: "no-store",

                // const res = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    full_name: fullName,
                    role,
                    status,
                    // password: defaultPassword
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.log("CREATE USER ERROR:", data.error);
                return;
            }

            console.log("USER CREATED:", data);

            // reset form
            setFullName("");
            setEmail("");
            setRole("user");
            setStatus("active");

            // close modal
            onOpenChange(false);

            // refresh table
            router.refresh();
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
    w-[90vw]
    max-w-[540px]
    rounded-xl
    border border-white/50
    bg-white/70
    p-0
    overflow-hidden
    backdrop-blur-xl
    shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)]
  "
>
      {/* Atmospheric background blobs */}
      {/* <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#4648d4]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -top-20 -left-20 h-96 w-96 rounded-full bg-[#8127cf]/10 blur-[100px]" /> */}

      {/* Header */}
      <DialogHeader className="px-5 pt-8 pb-6 sm:px-10 sm:pt-10">
        <div className="flex items-start justify-between">
          <div>
            <DialogTitle className="text-xl font-semibold text-[#131b2e] sm:text-2xl">
              Create New User
            </DialogTitle>

            <DialogDescription className="mt-1 text-sm text-[#464554]">
              Add a new member to your workspace and assign access permissions.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Form */}
      <form
        className="space-y-6 px-5 pb-5 sm:px-10"
        onSubmit={handleSubmit}
      >
        {/* Full Name */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-[#464554]">
            Full Name
          </Label>

          <Input
            placeholder="e.g. Alex Rivera"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="
              h-12
              rounded-xl
              border-[#c7c4d7]
              bg-white
              focus-visible:ring-[#4648d4]/20
              focus-visible:ring-4
            "
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-[#464554]">
            Email Address
          </Label>

          <Input
            type="email"
            placeholder="alex@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              h-12
              rounded-xl
              border-[#c7c4d7]
              bg-white
              focus-visible:ring-[#4648d4]/20
              focus-visible:ring-4
            "
          />
        </div>

        {/* Role + Status */}
        <div className="grid grid-cols-2 gap-4">
          {/* Role */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-[#464554]">
              Role
            </Label>

            <Select value={role} onValueChange={setRole}>
              <SelectTrigger
                className="
                  h-12
                  rounded-xl
                  border-[#c7c4d7]
                  bg-white
                "
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>

              <SelectContent className="z-[99999] rounded-xl border border-[#c7c4d7] bg-white shadow-lg">
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-[#464554]">
              Status
            </Label>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                className="
                  h-12
                  rounded-xl
                  border-[#c7c4d7]
                  bg-white
                "
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>

              <SelectContent className="z-[99999] rounded-xl border border-[#c7c4d7] bg-white shadow-lg">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="-mx-5 flex flex-col gap-3 px-5 pt-2 sm:-mx-10 sm:flex-row sm:justify-end sm:gap-4 sm:px-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="
              w-full
              rounded-xl
              border-[#c7c4d7]
              text-[#464554]
              hover:bg-[#dae2fd]
              sm:w-auto
              h-11
            "
          >
            Cancel
          </Button>

          <Button
            disabled={loading}
            className={`
              w-full
              rounded-xl
              bg-primary
              text-white
              transition-all
              hover:shadow-[0_0_20px_rgba(70,72,212,0.4)]
              sm:w-auto
              h-11
              ${loading ? "cursor-not-allowed opacity-50" : ""}
            `}
          >
            Create User
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
}