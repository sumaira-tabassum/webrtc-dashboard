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
                <DialogHeader className="px-5 pt-8 pb-5 sm:px-8">
                    <DialogTitle className="text-xl sm:text-2xl font-semibold text-[#131b2e]">
                        Create User
                    </DialogTitle>

                    <DialogDescription className="mt-1 text-sm text-[#464554]">
                        Add a new member and assign permissions
                    </DialogDescription>
                </DialogHeader>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 px-5 pb-6 sm:px-8"
                >
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                            placeholder="e.g. Alex Rivera"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="
                                h-12
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
                            type="email"
                            placeholder="alex@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="
                                h-12
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
                                        h-12
                                        bg-white/50
                                        border border-outline-variant
                                    "
                                >
                                    <SelectValue placeholder="Select role" />
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
                                        h-12
                                        bg-white/50
                                        border border-outline-variant
                                    "
                                >
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent className="z-[200]">
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex flex-col gap-3 border-t border-white/30 pt-4 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="
                                h-11
                                w-full
                                sm:w-auto
                                rounded-xl
                                text-[#464554]
                                border border-[#c7c4d7]
                                bg-white/40
                                backdrop-blur-md
                                transition-all duration-200 ease-out
                                hover:text-primary
                                hover:border-primary/30
                                hover:-translate-y-[2px]
                                active:translate-y-0
                                active:scale-[0.98]
                            "
                        >
                            Cancel
                        </Button>

                        <Button
                            disabled={loading}
                            className="
                                h-11
                                w-full
                                bg-primary
                                text-white
                                hover:shadow-lg hover:shadow-[#4648d4]/30
                                sm:w-auto
                            "
                        >
                            {loading ? "Creating..." : "Create User"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
  }
