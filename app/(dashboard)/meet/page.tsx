"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import CreateMeetingModal from "@/components/admin/create-meeting-modal";
import JoinMeetingModal from "@/components/admin/join-meeting-modal";
import MeetingRoom from "@/components/admin/meeting-room";

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
      <div className="mt-6 h-screen w-full flex flex-col items-center justify-center bg-black text-white">
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
    <div className="pt-6 px-xl pb-xl space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 my-6">Meetings</h2>
          <p className="mt-1 text-gray-500">
            Create, join and manage video conferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-3 rounded-xl px-5 py-6 font-semibold hover:shadow-md"
            onClick={() => setJoinOpen(true)}
            disabled={joining}
          >
            <LogIn size={20} />
            Join Meeting
          </Button>

          <Button
            className="flex items-center gap-3 rounded-xl bg-purple-600 px-5 py-6 font-semibold text-white shadow-md"
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
