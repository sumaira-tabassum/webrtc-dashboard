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

  // ROOM DETECTION + OFFER CREATION
  useEffect(() => {
    // Listen for room updates
    socket.on("room-users", async (data) => {
      console.log("ROOM UPDATE:", data);

      // Check if user and admin joined and room is full
      if (data.users.length === 2 && localStream) {
        console.log("START WEBRTC NOW");

        // Create WebRTC connection.
        const pc = createPeerConnection(localStream);
        // Store iT
        peerConnectionRef.current = pc;

        pc.ontrack = (event) => {
          console.log("REMOTE STREAM RECEIVED:", event.streams[0]);
          setRemoteStream(event.streams[0]);
        };

        // ICE FIRST (attach to pc)
        // Chrome finds a possible path, it triggers onicecandidate
        pc.onicecandidate = (event) => {
          // event.candidate = packet of network info
          if (event.candidate) {
            console.log("ICE GENERATED:", event.candidate);

            // send packet to server then server forwards to other users
            socket.emit("ice-candidate", {
              roomId: meetingId,
              candidate: event.candidate,
            });
          }
        };

        // Create Offer
        const offer = await pc.createOffer();

        //Save my own offer locally
        await pc.setLocalDescription(offer);

        //Send offer to other user via server
        socket.emit("offer", {
          roomId: meetingId,
          offer,
        });
      }
    });

    return () => {
      socket.off("room-users");
    };
  }, [localStream]);

  // RECEIVE OFFER + CREATE ANSWER
  useEffect(() => {
    if (!peerConnectionRef.current) return;

    socket.on("offer", async ({ offer, from }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      console.log("OFFER RECEIVED:", offer);

      // 1. Set admin offer as remote description
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // 2. Create answer
      const answer = await pc.createAnswer();

      // 3. Set local description
      await pc.setLocalDescription(answer);

      // 4. Send answer back
      socket.emit("answer", {
        roomId: meetingId,
        answer,
      });
    });

    return () => {
      socket.off("offer");
    };
  }, [meetingId]);

  // ADMIN RECEIVES ANSWER
  useEffect(() => {

    socket.on("answer", async ({ answer, from }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      console.log("ANSWER RECEIVED:", answer);

      await pc.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      console.log("WEBRTC CONNECTION ESTABLISHED");
    });

    return () => {
      socket.off("answer");
    };
  }, []);

  useEffect(() => {

    // Other users sends ICE, we recieve it
    socket.on("ice-candidate", async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {

        console.log("ICE RECEIVED:", candidate);

        await pc.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        console.error("ICE error:", err);
      }
    });

    return () => {
      socket.off("ice-candidate");
    };
  }, []);

  useEffect(() => {
    async function startCamera() {
      // Browser permission for care and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Store camera stream
      setLocalStream(stream);
    }

    startCamera();
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