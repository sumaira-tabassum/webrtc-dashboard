"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import { createPeerConnection } from "@/lib/webrtc";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Users,
  PhoneOff,
  Copy,
  Check
} from "lucide-react";

type Props = {
  meetingId: string;
  isInitiator: boolean;        //true = admin creates offer, false = joiner answers
  onLeave: () => void;
};

export default function MeetingRoom({ meetingId, isInitiator, onLeave }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const isReadyRef = useRef(false);
  const callStartedRef = useRef(false);
  const peerReadyRef = useRef(false);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      // srcObject = browser API for media playback
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    // If component unmounts: prevents async camera crash
    let cancelled = false;

    // process stored network data (ICE candidates)
    const flushIceQueue = async () => {
      const pc = pcRef.current;
      if (!pc?.remoteDescription) return;

      while (iceQueueRef.current.length > 0) {
        const candidate = iceQueueRef.current.shift()!;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    // connection creator
    const getPC = () => {
      if (!streamRef.current) return null;
      if (pcRef.current) return pcRef.current;

      const pc = createPeerConnection(streamRef.current);

      // triggers when remote video arrives
      pc.ontrack = (event) => {
        const stream =
          // actual remote MediaStream
          event.streams[0] ?? new MediaStream([event.track]);
        // saves peer video for UI
        setRemoteStream(stream);
      };

      // runs when browser finds network path
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // sends candidate to backend
          socket.emit("ice-candidate", {
            roomId: meetingId,
            candidate: event.candidate,
          });
        }
      };

      pcRef.current = pc;
      return pc;
    };

    // only for initiator (admin)
    const startCall = async () => {
      // conditions: must be initiator, camera ready, peer joined, not already started
      if (!isInitiator || callStartedRef.current || !isReadyRef.current) return;
      if (!peerReadyRef.current) return;

      const pc = getPC();
      if (!pc) return;

      // then: create offer (I want to connect video call), set local description, send to server
      callStartedRef.current = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("offer", { roomId: meetingId, offer });
    };

    // runs on joiner when admin sends offer
    const handleOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      if (isInitiator) return;   //ignore if initiator

      // if camera not ready, store offer (pendingOfferRef)
      if (!isReadyRef.current) {
        pendingOfferRef.current = offer;
        return;
      }

      const pc = getPC();
      if (!pc) return;

      // ELSE: set remote description (admin offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushIceQueue();

      // create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // send answer back
      socket.emit("answer", { roomId: meetingId, answer });
    };

    // runs on admin when joiner replies
    const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;

      // set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await flushIceQueue();
    };

    // recieves network candidates from other pper
    const handleIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc) return;

      // if remoteDescription not ready: store in queue
      if (!pc.remoteDescription) {
        iceQueueRef.current.push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE error:", err);
      }
    };

    // triggered from backend
    const handleRoomUsers = (data: { users: unknown[] }) => {
      if (data.users.length !== 2) return;

      // If 2 users present
      peerReadyRef.current = true;
      // try call
      void startCall();
    };

    // runs when camera is ready
    const onCameraReady = () => {
      isReadyRef.current = true;

      // if offer already waiting process ir else try call
      if (pendingOfferRef.current) {
        const offer = pendingOfferRef.current;
        pendingOfferRef.current = null;
        void handleOffer({ offer });
      } else {
        void startCall();
      }
    };

    async function startCamera() {
      // browser API call:
      if (streamRef.current) {
        onCameraReady();
        return;
      }

      try {
        // asks permission for camera + mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // store streams
        streamRef.current = stream;
        setLocalStream(stream);
        // call 
        onCameraReady();
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    // SOCKET EVENTS REGISTRATION
    socket.on("room-users", handleRoomUsers);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIce);

    // start camera immediately when component loads
    void startCamera();
    // checks who is already in room (through server)
    socket.emit("get-room-users", meetingId);

    // cleanup func, runs when: leaving room / component unmounts / route changes
    return () => {
      // stops async camera updates
      cancelled = true;

      // removes event listeners
      socket.off("room-users", handleRoomUsers);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIce);

      // only sends if user clicked leave button
      if (leavingRef.current) {
        socket.emit("leave-room", meetingId);
      }

      // stop camera tracks: turns off camera/mic
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      //close WebRTC connection: frees network resources
      pcRef.current?.close();
      pcRef.current = null;

      // reset refs:prevents stale state when re-entering room
      isReadyRef.current = false;
      callStartedRef.current = false;
      peerReadyRef.current = false;
      pendingOfferRef.current = null;
      iceQueueRef.current = [];
    };
  }, [meetingId, isInitiator]);

  // sets flag so cleanup knows user intentionally left
  const handleLeave = () => {
    leavingRef.current = true;
    onLeave();
  };

  const toggleAudio = () => {
    const stream = streamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsAudioMuted(!audioTrack.enabled);
  };

  const toggleVideo = () => {
    const stream = streamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoMuted(!videoTrack.enabled);
  };

  const copyMeetingId = async () => {
    try {
      await navigator.clipboard.writeText(meetingId);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
      <div className="absolute inset-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      <header className="flex absolute top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/60">

          <span className="text-white/70 text-sm font-medium">
            ID: <span className="font-mono text-white/70">{meetingId}</span>
          </span>

          <button
            onClick={copyMeetingId}
            className="ml-1 flex items-center justify-center w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 transition-all"
            title="Copy meeting ID"
          >
            <span className="text-[12px]">
              {copied ? (
                <Check size={14} className="text-white/70" />
              ) : (
                <Copy size={14} className="text-white/70" />
              )}
            </span>
          </button>

        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white/10 rounded-lg border border-white/10 text-sm text-white/70 font-mono">
            {String(mins).padStart(2, "0")}:
            {String(secs).padStart(2, "0")}
          </div>

          {/* <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={handleLeave}
          >
            Leave
          </Button> */}
        </div>
      </header>

      <div className="absolute top-24 right-6 w-48 h-32 rounded-xl overflow-hidden border border-white/10 backdrop-blur-md bg-white/10">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-2 text-[10px] text-white/80">
          You
        </div>
      </div>

      <nav className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 px-6 py-3 rounded-full backdrop-blur-xl bg-white/10 border border-white/10 shadow-2xl">

        {/* AUDIO */}
        <button onClick={toggleAudio} className="group flex flex-col items-center gap-1">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-95 ${isAudioMuted
              ? "bg-red-500 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </div>
          <span className="text-[10px] text-white/60">Mute</span>
        </button>

        {/* VIDEO */}
        <button onClick={toggleVideo} className="group flex flex-col items-center gap-1">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-95 ${isVideoMuted
              ? "bg-red-500 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
          </div>
          <span className="text-[10px] text-white/60">Video</span>
        </button>

        {/* SCREEN SHARE
        <button className="group flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-all duration-200 group-active:scale-95">
            <ScreenShare size={20} />
          </div>
          <span className="text-[10px] text-white/60">Share</span>
        </button>

        USERS
        <button className="group flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-all duration-200 group-active:scale-95">
            <Users size={20} />
          </div>
          <span className="text-[10px] text-white/60">Users</span>
        </button> */}

        {/* DIVIDER */}
        <div className="w-[1px] h-8 bg-white/20 mx-1" />

        {/* END CALL */}
        <button onClick={handleLeave} className="group flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-all duration-200 group-active:scale-95">
            <PhoneOff size={20} />
          </div>
          <span className="text-[10px] text-white/60">End</span>
        </button>

      </nav>
    </div>
  );
}
