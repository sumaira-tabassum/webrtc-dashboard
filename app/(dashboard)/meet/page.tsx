"use client";

import { Suspense, useContext, useEffect, useRef, useState } from "react";
import { ChevronDown, LogIn, Video, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { MeetingContext } from "@/app/(dashboard)/layout";
import CreateMeetingModal from "@/components/dashboard/create-meeting-modal";
import InstantMeetingModal from "@/components/dashboard/instant-meeting-modal";
import JoinMeetingModal from "@/components/dashboard/join-meeting-modal";
import MeetingRoom from "@/components/dashboard/meeting-room";
import { Button } from "@/components/ui/button";
import { MeetingSignaling } from "@/lib/signaling";
import { supabaseClient } from "@/lib/supabase/client";

type CurrentUser = {
  id: string;
  displayName: string;
};

type InstantMeetingResponse = {
  roomId: string;
  guestUrl: string;
};

function MeetPageContent() {
  const { setInMeeting } = useContext(MeetingContext);

  const [createOpen, setCreateOpen] = useState(false);
  const [instantOpen, setInstantOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [guestUrl, setGuestUrl] = useState<string | null>(null);
  const [isInstantMeeting, setIsInstantMeeting] = useState(false);

  const signalingRef = useRef<MeetingSignaling | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setCurrentUser({
        id: user.id,
        displayName: profile?.full_name ?? user.email ?? "User",
      });
    };

    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const createUserSignaling = () => {
    return new MeetingSignaling({
      displayName: currentUser?.displayName ?? "User",
      participantType: "user",
      userId: currentUser?.id,
    });
  };

  useEffect(() => {
    const joinId = searchParams.get("join");

    if (joinId) {
      void joinRegisteredMeeting(joinId);
      router.replace("/meet");
    }
  }, [searchParams, router]);

  const startRegisteredMeeting = async (meetingId: string) => {
    try {
      const signaling = createUserSignaling();

      await signaling.createRoom(meetingId);

      signalingRef.current = signaling;

      setGuestUrl(null);
      setIsInstantMeeting(false);
      setActiveMeetingId(meetingId);
      setCreateOpen(false);
    } catch (err) {
      console.error("Failed to create registered meeting:", err);
      alert("Failed to start meeting. Please try again.");
    }
  };

  const startInstantMeeting = async () => {
    try {
      const response = await fetch("/api/meetings/instant", {
        method: "POST",
      });

      const payload = (await response.json()) as
        | InstantMeetingResponse
        | { error?: string };
      
      // payload.error??
      if (!response.ok || !("roomId" in payload)) {
        alert("Failed to create instant meeting");
        return;
      }

      const signaling = createUserSignaling();

      await signaling.createRoom(payload.roomId);

      signalingRef.current = signaling;

      setGuestUrl(payload.guestUrl);
      setIsInstantMeeting(true);
      setActiveMeetingId(payload.roomId);
      setInstantOpen(false);
    } catch (err) {
      console.error("Failed to create instant meeting:", err);
      alert("Failed to start instant meeting. Please try again.");
    }
  };

  const joinRegisteredMeeting = async (meetingId: string) => {
    setJoining(true);

    try {
      const signaling = createUserSignaling();
      const res = await signaling.joinRoom(meetingId);

      if (!res.ok) {
        alert(res.error ?? "Could not join meeting");
        return;
      }

      signalingRef.current = signaling;

      setGuestUrl(null);
      setIsInstantMeeting(false);
      setActiveMeetingId(meetingId);
      setJoinOpen(false);
    } catch (err) {
      console.error("Failed to join registered meeting:", err);
      alert("Failed to join meeting. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = () => {
    void signalingRef.current?.leave();

    signalingRef.current = null;

    setActiveMeetingId(null);
    setGuestUrl(null);
    setIsInstantMeeting(false);
  };

  useEffect(() => {
    return () => {
      void signalingRef.current?.leave();
    };
  }, []);

  const copyGuestUrl = async () => {
    if (!guestUrl) return;

    try {
      await navigator.clipboard.writeText(guestUrl);
      alert("Guest link copied");
    } catch (err) {
      console.error("Failed to copy guest link:", err);
    }
  };

  if (activeMeetingId && signalingRef.current) {
    return (
      <div className="relative w-full min-h-[calc(100dvh-5rem)] flex flex-col bg-black text-white">
        {isInstantMeeting && guestUrl && (
          <button
            onClick={copyGuestUrl}
            className="
              absolute right-4 top-4 z-[60]
              rounded-lg
              bg-white/10
              px-4 py-2
              text-sm font-medium
              text-white
              backdrop-blur-md
              transition
              hover:bg-white/20
            "
          >
            Copy guest link
          </button>
        )}

        <MeetingRoom
          meetingId={activeMeetingId}
          signaling={signalingRef.current}
          onLeave={handleLeave}
          currentParticipantName={currentUser?.displayName ?? "You"}
          onMeetingStateChange={setInMeeting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="my-6 text-2xl font-bold text-gray-900 sm:text-3xl">
            Meetings
          </h2>

          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Create, join and manage video conferences.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-5 py-6 font-semibold"
            onClick={() => setJoinOpen(true)}
            disabled={joining}
          >
            <LogIn size={20} />
            Join Meeting
          </Button>

          <div ref={menuRef} className="relative w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-xl bg-primary px-5 py-6 font-semibold text-white shadow-md"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <Video size={20} />
              New Meeting
              <ChevronDown size={18} />
            </Button>

            {menuOpen && (
              <div
                className="
                  absolute right-0 z-30 mt-2 w-full min-w-[260px]
                  overflow-hidden rounded-2xl border border-white/60
                  bg-white/95 shadow-xl backdrop-blur-xl
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setInstantOpen(true);
                  }}
                  className="
                    flex w-full items-start gap-3 px-4 py-4 text-left
                    transition hover:bg-indigo-50
                  "
                >
                  <Zap className="mt-0.5 text-primary" size={20} />

                  <span>
                    <span className="block text-sm font-semibold text-gray-900">
                      Start instant meeting
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      Creates a guest link for people without accounts.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setCreateOpen(true);
                  }}
                  className="
                    flex w-full items-start gap-3 border-t border-gray-100 px-4 py-4 text-left
                    transition hover:bg-indigo-50
                  "
                >
                  <Video className="mt-0.5 text-primary" size={20} />

                  <span>
                    <span className="block text-sm font-semibold text-gray-900">
                      Create meeting
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      For registered dashboard users only.
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <InstantMeetingModal
        open={instantOpen}
        onOpenChange={setInstantOpen}
        onStartInstantMeeting={startInstantMeeting}
      />

      <CreateMeetingModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onStartMeeting={startRegisteredMeeting}
      />

      <JoinMeetingModal
        open={joinOpen}
        onOpenChange={setJoinOpen}
        onJoin={joinRegisteredMeeting}
      />
    </div>
  );
}

export default function MeetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MeetPageContent />
    </Suspense>
  );
}