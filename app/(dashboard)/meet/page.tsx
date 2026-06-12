"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import CreateMeetingModal from "@/components/dashboard/create-meeting-modal";
import JoinMeetingModal from "@/components/dashboard/join-meeting-modal";
import MeetingRoom from "@/components/dashboard/meeting-room";

import { Video, LogIn } from "lucide-react";

import { MeetingSignaling } from "@/lib/signaling";

export default function MeetPage() {
  const [open, setOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [joining, setJoining] = useState(false);
  const signalingRef = useRef<MeetingSignaling | null>(null);

  const startMeeting = async (id: string) => {
    try {
      const signaling = new MeetingSignaling();
      await signaling.createRoom(id);
      signalingRef.current = signaling;
      setIsInitiator(true);
      setActiveMeetingId(id);
      setOpen(false);
    } catch (err) {
      console.error("Failed to create room:", err);
      alert("Failed to start meeting. Please try again.");
    }
  };

  const joinMeeting = async (id: string) => {
    setJoining(true);
    try {
      const signaling = new MeetingSignaling();
      const res = await signaling.joinRoom(id);

      if (!res.ok) {
        alert(res.error ?? "Could not join meeting");
        return;
      }

      signalingRef.current = signaling;
      setIsInitiator(false);
      setActiveMeetingId(id);
      setJoinOpen(false);
    } catch (err) {
      console.error("Failed to join room:", err);
      alert("Failed to join meeting. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = () => {
    void signalingRef.current?.leave();
    signalingRef.current = null;
    setActiveMeetingId(null);
  };

  useEffect(() => {
    return () => {
      void signalingRef.current?.leave();
    };
  }, []);

  if (activeMeetingId && signalingRef.current) {
    return (
  <div className="w-full min-h-[calc(100dvh-5rem)] flex flex-col bg-black text-white">
        <MeetingRoom
          meetingId={activeMeetingId}
          isInitiator={isInitiator}
          signaling={signalingRef.current}
          onLeave={handleLeave}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-0 py-4 sm:space-y-10">
      {/* <div className="space-y-8"></div> */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Meetings</h2>
          <p className="mt-1 text-gray-500">
            Create, join and manage video conferences.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
  variant="outline"
  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-4 py-5 font-semibold"
            onClick={() => setJoinOpen(true)}
            disabled={joining}
          >
            <LogIn size={20} />
            Join Meeting
          </Button>

          <Button
  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-5 font-semibold text-white shadow-md"
            onClick={() => setOpen(true)}
          >
            <Video size={20} />
            New Meeting
          </Button>
        </div>
      </div>

      <CreateMeetingModal
        open={open}
        onOpenChange={setOpen}
        onStartMeeting={startMeeting}
      />

      <JoinMeetingModal
        open={joinOpen}
        onOpenChange={setJoinOpen}
        onJoin={joinMeeting}
      />
    </div>
  );
}
