"use client";

import { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import CreateMeetingModal from "@/components/admin/create-meeting-modal";
import JoinMeetingModal from "@/components/admin/join-meeting-modal";
import MeetingRoom from "@/components/admin/meeting-room";

import { Video, LogIn } from "lucide-react";

import { socket } from "@/lib/socket";

export default function MeetPage() {

  useEffect(() => {
  console.log("PAGE LOADED");

  socket.on("connect", () => {
    console.log("SOCKET CONNECTED:", socket.id);
  });

  socket.on("room-users", (data) => {
    console.log("ROOM EVENT IN PAGE:", data);
  });

  return () => {
    socket.off("connect");
    socket.off("room-users");
  };
}, []);

  const [open, setOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  //controls whether we are inside meeting or dashboard
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  const [participants, setParticipants] = useState<any[]>([]);


const startMeeting = (id: string) => {
  socket.emit("create-room", id);
  setActiveMeetingId(id);
  setOpen(false);
};

const joinMeeting = (id: string) => {
  console.log("JOIN CLICKED:", id);
  socket.emit("join-room", id, (res: any) => {
    if (!res.ok) {
      alert(res.error);
      return;
    }

     setActiveMeetingId(id); // ONLY after approval
    setJoinOpen(false);
  });
};

useEffect(() => {
  socket.on("room-error", (msg) => {
    alert(msg);
    setActiveMeetingId(null);
  });

  return () => {
    socket.off("room-error");
  };
}, []);

  const leaveMeeting = () => {
    setActiveMeetingId(null);
  };

if (activeMeetingId) {
  return (
    <div className="mt-6 h-screen w-full flex flex-col items-center justify-center bg-black text-white">
    <MeetingRoom
      meetingId={activeMeetingId}
      onLeave={() => setActiveMeetingId(null)}
    />
    </div>
  );
}

  return (
    <div className="pt-6 px-xl pb-xl space-y-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 my-6">
            Meetings
          </h2>
          <p className="mt-1 text-gray-500">
            Create, join and manage video conferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-3 rounded-xl px-5 py-6 font-semibold hover:shadow-md"
            onClick={() => setJoinOpen(true)}
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

      {/* MODALS */}
      <CreateMeetingModal
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
        }}
        onStartMeeting={startMeeting}
      />

      <JoinMeetingModal
        open={joinOpen}
        onOpenChange={(val) => {
          setJoinOpen(val);
        }}
        onJoin={joinMeeting}
      />
    </div>
  );
}