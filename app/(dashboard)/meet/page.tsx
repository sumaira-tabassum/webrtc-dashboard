"use client";

import { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import CreateMeetingModal from "@/components/admin/create-meeting-modal";
import JoinMeetingModal from "@/components/admin/join-meeting-modal";
import MeetingRoom from "@/components/admin/meeting-room";

// import { createRoom, roomExists } from "@/lib/meetingStore";
import { socket } from "@/lib/socket";

export default function MeetPage() {

  useEffect(() => {
  socket.on("connect", () => {
    console.log("socket connected:", socket.id);
    });
  socket.on("room-users", (data) => {
  console.log("ROOM STATE:", data);
  setParticipants(data.users);
}
);

  return () => {
    socket.off("connect");
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
          <h2 className="font-display text-4xl font-bold text-on-surface">
            Meetings
          </h2>
          <p className="text-on-surface-variant mt-1">
            Create, join and manage video conferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl px-6 py-3"
            onClick={() => setJoinOpen(true)}
          >
            Join Meeting
          </Button>

          <Button
            className="rounded-xl px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
            onClick={() => setOpen(true)}
          >
            + New Meeting
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