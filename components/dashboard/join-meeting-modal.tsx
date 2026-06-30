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
        w-[90vw]
        max-w-[540px]
        p-0
        overflow-visible
        rounded-xl
        border border-white/50
        bg-white/70
        dark:border-white/10
        dark:bg-[#19172b]/90
        backdrop-blur-xl
        shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)]
      "
    >
      {/* HEADER */}
      <DialogHeader className="space-y-1 px-5 py-6 sm:px-6">
        <DialogTitle className="text-xl sm:text-2xl font-semibold text-[#131b2e] dark:text-white">
          Join Meeting
        </DialogTitle>

        <DialogDescription className="text-sm text-[#464554] dark:text-white/60">
          Enter a meeting ID to join an existing session.
        </DialogDescription>
      </DialogHeader>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 px-5 pb-6 sm:px-6"
      >
        <div className="space-y-2">
          <label className="text-sm text-[#464554] dark:text-white/70">
            Meeting ID
          </label>

          <Input
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder="lum-xxxx-xxx"
            className={`
              h-12
              font-mono tracking-[0.15em]
              bg-white/50
              dark:bg-white/10
              dark:text-white
              border border-outline-variant
              focus-visible:ring-2 focus-visible:ring-[#4648d4]/20
              ${error ? "border-red-500" : ""}
            `}
          />

          <p className="text-xs text-[#464554]/70 dark:text-white/45">
            Ask the host for the meeting ID
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="
              h-11
              w-full
              rounded-xl
              text-[#464554]
              dark:text-white/70
              border-[#c7c4d7]
              hover:bg-[#dae2fd]
              dark:hover:bg-white/10
              sm:w-auto
            "
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="
              h-11
              w-full
              bg-primary
              text-white
              hover:shadow-lg hover:shadow-[#4648d4]/30
              sm:w-auto
            "
          >
            Join Meeting
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
}
