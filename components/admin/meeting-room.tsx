"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

import { socket } from "@/lib/socket";

import { createPeerConnection } from "@/lib/webrtc";

type Props = {
  meetingId: string;
  onLeave: () => void;
};

export default function MeetingRoom({ meetingId, onLeave }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

const hasJoinedRef = useRef(false);

const streamRef = useRef<MediaStream | null>(null);
const pcRef = useRef<RTCPeerConnection | null>(null);
const callStartedRef = useRef(false);

/* ===================== DEBUG MOUNT ===================== */
useEffect(() => {
  console.log("MOUNT");

  return () => {
    console.log("UNMOUNT");
  };
}, []);

/* ===================== SOCKET STATUS DEBUG ===================== */
useEffect(() => {
  console.log("SOCKET STATUS:", socket.connected);
}, []);

/* ===================== PEER CONNECTION (SINGLETON) ===================== */
const getPC = () => {
  if (!streamRef.current) {
    console.warn("Camera stream not ready yet");
    return null;
  }

  if (pcRef.current) return pcRef.current;

  const pc = createPeerConnection(streamRef.current);

  pc.ontrack = (event) => {
    console.log("REMOTE STREAM RECEIVED");
    setRemoteStream(event.streams[0]);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        roomId: meetingId,
        candidate: event.candidate,
      });
    }
  };

  pcRef.current = pc;
  console.log("PC CREATED ONCE");
  return pc;
};

/* ===================== ROOM USERS (ADMIN TRIGGER) ===================== */
const handler = async (data: any) => {
  console.log("ROOM UPDATE:", data);

  if (data.users.length !== 2) return;

  if (!isReadyRef.current) {
    console.log("WAITING FOR CAMERA...");
    return;
  }

  if (callStartedRef.current) return;
  callStartedRef.current = true;

  const pc = getPC();
  if (!pc) return;

  console.log("STARTING CALL (ADMIN)");

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", {
    roomId: meetingId,
    offer,
  });
};

const isReadyRef = useRef(false);

useEffect(() => {
  if (localStream) {
    isReadyRef.current = true;
    console.log("CAMERA READY");
  }
}, [localStream]);

/* ===================== OFFER RECEIVER ===================== */
useEffect(() => {
  const handler = async ({ offer }: any) => {
    console.log("OFFER RECEIVED");

    const pc = getPC();
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", {
      roomId: meetingId,
      answer,
    });
  };

  socket.on("offer", handler);

  return () => {
    socket.off("offer", handler);
  };
}, [meetingId]);

/* ===================== ANSWER RECEIVER ===================== */
useEffect(() => {
  const handler = async ({ answer }: any) => {
    const pc = pcRef.current;
    if (!pc) return;

    console.log("ANSWER RECEIVED");

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  socket.on("answer", handler);

  return () => {
    socket.off("answer", handler);
  };
}, []);

/* ===================== ICE CANDIDATES ===================== */
useEffect(() => {
  const handler = async ({ candidate }: any) => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      console.log("ICE RECEIVED");
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("ICE ERROR:", err);
    }
  };

  socket.on("ice-candidate", handler);

  return () => {
    socket.off("ice-candidate", handler);
  };
}, []);

/* ===================== CAMERA (STRICT MODE SAFE) ===================== */
useEffect(() => {
  let cancelled = false;

  async function startCamera() {
    if (streamRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (cancelled) return;

    streamRef.current = stream;
    setLocalStream(stream);

    console.log("CAMERA READY");
  }

  startCamera();

  return () => {
    cancelled = true;
  };
}, []);


  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;


  return (
    <div className="relative w-full h-screen bg-[#0c0d12] overflow-hidden text-white">

      {/* ================= BACKGROUND VIDEO AREA ================= */}
      <div className="absolute inset-0">
        {/* <div className="w-full h-full object-cover"> */}
        {/* <video
            autoPlay
            playsInline
            muted
            ref={(video) => {
              if (video && localStream) {
                video.srcObject = localStream;
              }
            }}
          /> */}
        <video
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          ref={(video) => {
            if (video && remoteStream) {
              video.srcObject = remoteStream;
            }
          }}
        />
        {/* </div> */}
      </div>

      {/* ================= TOP BAR ================= */}
      <header className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-white/10 backdrop-blur-md border-b border-white/10">

        <div>
          <h1 className="text-lg font-semibold">1:1 Call</h1>
          <p className="text-xs text-white/60">
            ID: <span className="font-mono">{meetingId}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">

          {/* timer */}
          <div className="px-3 py-1 bg-white/10 rounded-lg text-sm font-mono">
            {String(mins).padStart(2, "0")}:
            {String(secs).padStart(2, "0")}
          </div>

          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={onLeave}
          >
            Leave
          </Button>

        </div>
      </header>

      {/* ================= LOCAL PREVIEW ================= */}
      <div className="absolute top-24 right-6 w-48 h-32 rounded-xl overflow-hidden border border-white/10 backdrop-blur-md bg-white/10">
        {/* <div className="w-full h-full object-cover opacity-80"></div> */}
        {/* <video
          autoPlay
          playsInline
          ref={(video) => {
            if (video && remoteStream) {
              video.srcObject = remoteStream;
            }
          }}
        /> */}
        <video
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          ref={(video) => {
            if (video && localStream) {
              video.srcObject = localStream;
            }
          }}
        />
        <div className="absolute bottom-1 left-2 text-[10px] text-white/80">
          You
        </div>
      </div>

      {/* ================= BOTTOM CONTROLS ================= */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">

        <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20">
          🎤
        </button>

        <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20">
          🎥
        </button>

        <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20">
          📤
        </button>

        <button className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700">
          📞
        </button>

      </div>

    </div>
  );
}