"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  onStartMeeting?: (meetingId: string) => void;
};

function generateMeetingId() {
  return `lum-${Math.random().toString(36).slice(2, 6)}-${Math.random()
    .toString(36)
    .slice(2, 5)}`;
}

export default function CreateMeetingModal({ open, onOpenChange, onStartMeeting }: Props) {
  const [meetingId] = useState(generateMeetingId());
  const [copied, setCopied] = useState(false);

  // const copyToClipboard = async () => {
  //   await navigator.clipboard.writeText(meetingId);
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2500);
  // };
const copyToClipboard = async () => {
  try {
    if (typeof window === "undefined") return;

    if (!navigator?.clipboard?.writeText) {
      throw new Error("Clipboard API not supported");
    }

    await navigator.clipboard.writeText(meetingId);

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  } catch (err) {
    console.error("Copy failed:", err);
  }
};
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>

        <DialogContent
          className="
          fixed left-[50%] top-[50%]
          z-50
          w-full max-w-[540px]
          translate-x-[-50%] translate-y-[-50%]
          p-0
          overflow-visible
          rounded-xl
          bg-white/70
          backdrop-blur-xl
          border border-white/50
          shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)]
        "
        >
          {/* Glow orbs (Stitch depth layer) */}
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-96 h-96 bg-[#4648d4]/10 blur-[100px] rounded-full" />
          <div className="pointer-events-none absolute -top-20 -left-20 w-96 h-96 bg-[#8127cf]/10 blur-[100px] rounded-full" />

          {/* CARD */}
          <div className="relative">

            {/* HEADER */}
            <div className="px-10 pt-10 pb-6 space-y-1">
              <h2 className="text-2xl font-semibold text-[#131b2e]">
                Create Meeting
              </h2>
              <p className="text-sm text-[#464554]">
                Generate a meeting ID and invite participants.
              </p>
            </div>

            {/* BODY */}
            <div className="px-10 space-y-6">

              {/* Meeting ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#464554] ml-1">
                  Meeting ID
                </label>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      value={meetingId}
                      readOnly
                      className="
                      h-12
                      bg-white
                      border-[#c7c4d7]
                      rounded-xl
                      font-semibold
                      tracking-wider
                      text-[#4648d4]
                      focus-visible:ring-[#4648d4]/20
                      focus-visible:ring-4
                      cursor-default
                    "
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4648d4]/40">
                      🔒
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={copyToClipboard}
                    className="
                    h-12
                    px-4
                    rounded-xl
                    bg-white/20
                    border border-white/50
                    text-[#4648d4]
                    hover:bg-white/40
                  "
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <p className="text-xs text-[#464554]/70 ml-1">
                  This ID can be shared with participants to join the session.
                </p>
              </div>

              {/* Info Box */}
              <div className="flex gap-3 p-4 rounded-xl bg-[#6063ee]/10 border border-[#6063ee]/10">
                <div className="text-[#4648d4]">ℹ️</div>

                <div>
                  <p className="text-sm font-medium text-[#131b2e]">
                    Instant Sharing
                  </p>
                  <p className="text-xs text-[#464554]">
                    Your video and microphone settings will be preserved from your last session.
                  </p>
                </div>
              </div>

            </div>

            {/* FOOTER */}
            <div className="px-10 py-6 mt-6 flex justify-end gap-4 bg-[#f2f3ff]">

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
                className="
                rounded-xl
                text-white
                bg-purple-600
                hover:shadow-lg hover:shadow-[#4648d4]/30
              "
                onClick={() => {
                  const id = meetingId;
                  onStartMeeting?.(id);
                  onOpenChange(false);
                }}
              >
                Start Meeting
              </Button>

            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* COPY TOAST */}
      <div
        className={`
        fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]
        transition-all duration-500
        ${copied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
      `}
      >
        <div className="px-6 py-3 rounded-full bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg flex items-center gap-2">
          <span className="text-green-500">✔</span>
          <span className="text-sm text-[#131b2e]">
            ID copied to clipboard
          </span>
        </div>
      </div>
    </>
  );
}