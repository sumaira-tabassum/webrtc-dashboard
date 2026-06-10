"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  onJoin?: (meetingId: string) => void;
};

// function formatMeetingId(value: string) {
//   let val = value.toLowerCase().replace(/[^a-z0-9]/g, "");

//   if (val.length > 3 && val.length <= 6) {
//     val = val.slice(0, 3) + "-" + val.slice(3);
//   } else if (val.length > 6) {
//     val =
//       val.slice(0, 3) +
//       "-" +
//       val.slice(3, 6) +
//       "-" +
//       val.slice(6, 9);
//   }

//   return val;
// }

export default function JoinMeetingModal({ open, onOpenChange, onJoin }: Props) {
  const [meetingId, setMeetingId] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) {
      setMeetingId("");
      setError(false);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetingId.trim()) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      return;
    }

    onJoin?.(meetingId);   // ✅ ONLY HERE
    onOpenChange(false);

    console.log("Joining meeting:", meetingId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-[520px]
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
        <DialogHeader className="p-6 space-y-1">
          <DialogTitle className="text-2xl font-semibold text-[#131b2e]">
            Join Meeting
          </DialogTitle>
          <DialogDescription className="text-sm text-[#464554]">
            Enter a meeting ID to join an existing session.
          </DialogDescription>
        </DialogHeader>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-[#464554]">
              Meeting ID
            </label>

            <Input
              value={meetingId}
              onChange={(e) =>
                setMeetingId(e.target.value)
              }
              placeholder="lum-xxxx-xxx"
              className={`
                font-mono tracking-[0.15em]
                bg-white/50
                border border-outline-variant
                focus-visible:ring-2 focus-visible:ring-[#4648d4]/20
                ${error ? "border-red-500" : ""}
              `}
            />

            <p className="text-xs text-[#464554]/70">
              Ask the host for the meeting ID
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[#464554]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="
                bg-gradient-to-r from-[#4648d4] to-[#8127cf]
                text-white
                hover:shadow-lg hover:shadow-[#4648d4]/30
              "
            >
              Join Meeting
            </Button>
          </div>
        </form>

        {/* subtle bottom gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#4648d4] to-[#8127cf] opacity-40" />
      </DialogContent>
    </Dialog>
  );
}