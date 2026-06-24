"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Info, Lock, UserPlus } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UsersMultiSelect from "./users-multi-select";
import { supabaseClient } from "@/lib/supabase/client";

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

export default function CreateMeetingModal({
  open,
  onOpenChange,
  onStartMeeting,
}: Props) {
  const [meetingId, setMeetingId] = useState(generateMeetingId());
  const [copied, setCopied] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [inviteSent, setInviteSent] = useState(false);
  const [sender, setSender] = useState<{
    id: string;
    full_name?: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setMeetingId(generateMeetingId());
      setSelectedUsers([]);
      setCopied(false);
      setInviteSent(false);
    }
  }, [open]);

  useEffect(() => {
    const loadSender = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setSender({
        id: user.id,
        full_name: profile?.full_name,
      });
    };

    void loadSender();
  }, []);

  const handleInvite = async () => {
    if (!selectedUsers.length) return;

    const notifications = selectedUsers.map((userId) => ({
      user_id: userId,
      title: "Meeting Invitation",
      message: "You were invited to join a registered-user meeting",
      type: "meeting_invite",
      meeting_id: meetingId,
      read: false,
      sender_id: sender?.id,
      sender_name: sender?.full_name,
    }));

    const { error } = await supabaseClient
      .from("notifications")
      .insert(notifications);

    if (error) {
      console.error("Invite failed:", error.message);
      return;
    }

    setInviteSent(true);
    setSelectedUsers([]);

    setTimeout(() => {
      setInviteSent(false);
    }, 2500);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(meetingId);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="
            w-[90vw]
            max-w-[540px]
            p-0
            overflow-visible
            rounded-xl
            bg-white/70
            backdrop-blur-xl
            border border-white/50
            shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)]
          "
        >
          <div className="relative">
            <div className="px-5 pt-8 pb-6 space-y-1 sm:px-10 sm:pt-10">
              <h2 className="text-2xl font-semibold text-[#131b2e]">
                Create Meeting
              </h2>

              <p className="text-sm text-[#464554]">
                Start a meeting for registered dashboard users only.
              </p>
            </div>

            <div className="px-5 space-y-6 sm:px-10">
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
                        text-primary
                        focus-visible:ring-[#4648d4]/20
                        focus-visible:ring-4
                        cursor-default
                      "
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4648d4]/40">
                      <Lock size={18} />
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
                      text-primary
                      hover:bg-white/40
                    "
                  >
                    <Copy size={20} />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <p className="text-xs text-[#464554]/70 ml-1">
                  Only logged-in dashboard users can join with this ID.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#464554] ml-1">
                  Invite Registered Users
                </label>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <UsersMultiSelect
                      selectedUsers={selectedUsers}
                      setSelectedUsers={setSelectedUsers}
                    />
                  </div>

                  <Button
                    disabled={selectedUsers.length === 0 || inviteSent}
                    type="button"
                    onClick={handleInvite}
                    className="
                      h-12
                      px-4
                      rounded-xl
                      bg-white/20
                      border border-white/50
                      text-primary
                      hover:bg-white/40
                    "
                  >
                    {inviteSent ? (
                      <>
                        <Check size={18} />
                        Sent
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Invite
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-xl bg-[#6063ee]/10 border border-[#6063ee]/10">
                <Info className="shrink-0 text-primary" />

                <div>
                  <p className="text-sm font-medium text-[#131b2e]">
                    Registered users only
                  </p>

                  <p className="text-xs text-[#464554]">
                    This meeting does not generate a public guest link.
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
                onClick={() => onOpenChange(false)}
                className="
                  rounded-xl
                  text-[#464554]
                  border-[#c7c4d7]
                  hover:bg-[#dae2fd]
                  h-11 w-full sm:w-auto
                "
              >
                Cancel
              </Button>

              <Button
                className="
                  rounded-xl
                  text-white
                  bg-primary
                  hover:shadow-lg hover:shadow-[#4648d4]/30
                  h-11 w-full sm:w-auto
                "
                onClick={() => {
                  onStartMeeting?.(meetingId);
                  onOpenChange(false);
                }}
              >
                Start Meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}