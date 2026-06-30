"use client";

import { useState } from "react";
import { Info, Link2, Loader2, Video } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartInstantMeeting?: () => Promise<void> | void;
};

export default function InstantMeetingModal({
  open,
  onOpenChange,
  onStartInstantMeeting,
}: Props) {
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);

    try {
      await onStartInstantMeeting?.();
      onOpenChange(false);
    } finally {
      setStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[90vw]
          max-w-[520px]
          p-0
          overflow-visible
          rounded-xl
          bg-white/80
          dark:bg-[#19172b]/90
          backdrop-blur-xl
          border border-white/50
          dark:border-white/10
          shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)]
        "
      >
        <div className="relative">
          <div className="px-5 pt-8 pb-6 space-y-2 sm:px-10 sm:pt-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
              <Video size={24} />
            </div>

            <h2 className="pt-2 text-2xl font-semibold text-[#131b2e] dark:text-white">
              Start Instant Meeting
            </h2>

            <p className="text-sm leading-6 text-[#464554] dark:text-white/60">
              Create a meeting with a public guest link. Anyone with the link
              can join after entering their name.
            </p>
          </div>

          <div className="px-5 space-y-4 sm:px-10">
            <div className="flex gap-3 rounded-xl bg-[#6063ee]/10 border border-[#6063ee]/10 p-4 dark:bg-primary/10 dark:border-primary/15">
              <Link2 className="mt-0.5 shrink-0 text-primary" size={20} />

              <div>
                <p className="text-sm font-medium text-[#131b2e] dark:text-white">
                  Guest link enabled
                </p>

                <p className="mt-1 text-xs leading-5 text-[#464554] dark:text-white/60">
                  After the meeting starts, copy the guest link from the meeting
                  room and share it externally.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4 dark:bg-amber-400/10 dark:border-amber-300/20">
              <Info className="mt-0.5 shrink-0 text-amber-600" size={20} />

              <div>
                <p className="text-sm font-medium text-[#131b2e] dark:text-white">
                  No dashboard access
                </p>

                <p className="mt-1 text-xs leading-5 text-[#464554] dark:text-white/60">
                  Guests bypass login and only see the pre-join page and meeting
                  room.
                </p>
              </div>
            </div>
          </div>

          <div
            className="
              px-5 py-6
              flex flex-col gap-3
              sm:px-10
              sm:flex-row
              sm:justify-end
              sm:gap-4
            "
          >
            <Button
              type="button"
              variant="ghost"
              disabled={starting}
              onClick={() => onOpenChange(false)}
              className="
                rounded-xl
                text-[#464554]
                dark:text-white/70
                border-[#c7c4d7]
                hover:bg-[#dae2fd]
                dark:hover:bg-white/10
                h-11 w-full sm:w-auto
              "
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={starting}
              onClick={handleStart}
              className="
                rounded-xl
                text-white
                bg-primary
                hover:shadow-lg hover:shadow-[#4648d4]/30
                h-11 w-full sm:w-auto
              "
            >
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Instant Meeting"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
