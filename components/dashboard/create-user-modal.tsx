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
        fixed left-[50%] top-[50%]
        z-50
        w-full max-w-[540px]
        translate-x-[-50%] translate-y-[-50%]
        p-0
        overflow-hidden
        rounded-xl
        bg-white/70
        backdrop-blur-xl
        border border-white/50
        shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)]
    "
            >
                {/* Atmospheric background blobs */}
                <div className="pointer-events-none absolute -bottom-20 -right-20 w-96 h-96 bg-[#4648d4]/10 blur-[100px] rounded-full" />
                <div className="pointer-events-none absolute -top-20 -left-20 w-96 h-96 bg-[#8127cf]/10 blur-[100px] rounded-full" />

                {/* Header */}
                <DialogHeader className="px-10 pt-10 pb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-semibold text-[#131b2e]">
                                Create New User
                            </DialogTitle>

                            <DialogDescription className="text-sm text-[#464554] mt-1">
                                Add a new member to your workspace and assign access permissions.
                            </DialogDescription>
                        </div>

                        {/* <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="p-2 rounded-lg hover:bg-[#dae2fd]/50 transition"
                        >
                            <X size={18} className="text-[#464554]" />
                        </button> */}
                    </div>
                </DialogHeader>

                {/* Form */}
                <form className="px-10 py-6 space-y-6" onSubmit={handleSubmit}>

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

                                <SelectContent className="z-[99999] bg-white rounded-xl shadow-lg border border-[#c7c4d7]">
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

                                <SelectContent className="z-[99999] bg-white rounded-xl shadow-lg border border-[#c7c4d7]">
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-4 pt-6 bg-[#f2f3ff] -mx-10 px-10 py-6">

                        <Button
                            type="button"
                            variant="outline"
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
                            className={`
                            rounded-xl
                            text-white
                            bg-primary
                            hover:shadow-[0_0_20px_rgba(70,72,212,0.4)]
                            transition-all
                            ${loading ? "opacity-50 cursor-not-allowed" : ""}
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