"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MeetingSignaling } from "@/lib/signaling";
import { createPeerConnection } from "@/lib/webrtc";
import RemoteVideo from "@/components/remote-video";
import { useContext } from "react";
import { MeetingContext } from "@/app/(dashboard)/layout";
import { supabaseClient } from "@/lib/supabase/client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Users,
  PhoneOff,
  Copy,
  Check,
} from "lucide-react";

type Props = {
  meetingId: string;
  // isInitiator: boolean;
  signaling: MeetingSignaling;
  onLeave: () => void;
};

type PendingOffer = {
  offer: RTCSessionDescriptionInit;
  from: string;
  to: string;
};

export default function MeetingRoom({ meetingId, signaling, onLeave }: Props) {

  const { setInMeeting } = useContext(MeetingContext);

  const [seconds, setSeconds] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  // const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  // const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const participantsRef = useRef<string[]>([]);
  // const pcRef = useRef<RTCPeerConnection | null>(null);
  const peersRef = useRef<
    Map<string, RTCPeerConnection>
  >(new Map());

  const remoteStreamsRef = useRef<
    Map<string, MediaStream>
  >(new Map());

  const [remoteStreams, setRemoteStreams] = useState<
    Map<string, MediaStream>
  >(new Map());

  const negotiationLockRef = useRef<Set<string>>(new Set());

  const isReadyRef = useRef(false);
  // const callStartedRef = useRef(false);
  // const peerReadyRef = useRef(false);
  // const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingOfferRef = useRef<PendingOffer[]>([])
  // const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const iceQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  // const leavingRef = useRef(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const update = () => {
    setIsMobile(window.innerWidth < 640);
  };

  update();

  window.addEventListener("resize", update);

  return () => window.removeEventListener("resize", update);
}, []);
  
      // Fetch user from supabase
      useEffect(() => {
          const loadUser = async () => {
              const { data: { user } } = await supabaseClient.auth.getUser();
  
              if (!user) return;
  
              setUser(user);
  
              const { data: profile } = await supabaseClient
                  .from("profiles")
                  .select("role, full_name")
                  .eq("id", user.id)
                  .single();
  
              setProfile(profile);
          };
  
          loadUser();
      }, []);

  useEffect(() => {
    setInMeeting(true);

    return () => {
      setInMeeting(false);
    };
  }, [setInMeeting]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      // srcObject = browser API for media playback
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    // If component unmounts: prevents async camera crash
    let cancelled = false;

    // process stored network data (ICE candidates)
    const flushIceQueue = async (peerId: string) => {
      const pc = peersRef.current.get(peerId);
      if (!pc?.remoteDescription) return;

      const queue = iceQueueRef.current.get(peerId) || [];

      while (queue.length > 0) {
        const candidate = queue.shift()!;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }

      iceQueueRef.current.set(peerId, queue);
    };

    const canNegotiate = (peerId: string) => {
      const key = [signaling.odId, peerId].sort().join("-");
      return !negotiationLockRef.current.has(key);
    };

    const markNegotiated = (peerId: string) => {
      const key = [signaling.odId, peerId].sort().join("-");
      negotiationLockRef.current.add(key);
    };

    const handleParticipants = (participants: string[]) => {
      const others = participants.filter(
        (id) => id !== signaling.odId
      );

      // ----- REMOVE USERS WHO LEFT -----
      const existingPeers = Array.from(peersRef.current.keys());

      for (const peerId of existingPeers) {
        if (!others.includes(peerId)) {
          console.log("Removing departed peer:", peerId);

          // close connection
          const pc = peersRef.current.get(peerId);
          pc?.close();

          // remove peer
          peersRef.current.delete(peerId);

          // remove stream
          remoteStreamsRef.current.delete(peerId);

          // remove queued ICE candidates
          iceQueueRef.current.delete(peerId);

          // remove negotiation lock
          const key = [signaling.odId, peerId]
            .sort()
            .join("-");

          negotiationLockRef.current.delete(key);
        }
      }

      // update React state
      setRemoteStreams(new Map(remoteStreamsRef.current));

      // store latest participant list
      participantsRef.current = others;

      // ----- ADD NEW USERS -----
      for (const peerId of others) {
        if (peersRef.current.has(peerId)) continue;

        createOrGetPeer(peerId);
      }
    };

    const shouldInitiate = (peerId: string) => {
      return signaling.odId < peerId;
    };

    const initiateOffer = async (peerId: string) => {
      if (!canNegotiate(peerId)) return;
      markNegotiated(peerId);

      const pc = peersRef.current.get(peerId);
      if (!pc) return;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      signaling.sendOffer(peerId, offer);
    };

    const createOrGetPeer = (peerId: string) => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing;

      const stream = streamRef.current;

      if (!stream) {
        console.warn(
          "Skipping peer creation because local stream is not ready"
        );
        return null;
      }

      const pc = createPeerConnection(stream);

      // safety mechanism if Presence updates arrive late.
      pc.onconnectionstatechange = () => {
        console.log(
          peerId,
          pc.connectionState
        );

        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          pc.close();

          peersRef.current.delete(peerId);

          remoteStreamsRef.current.delete(peerId);

          iceQueueRef.current.delete(peerId);

          const key = [signaling.odId, peerId]
            .sort()
            .join("-");

          negotiationLockRef.current.delete(key);

          setRemoteStreams(
            new Map(remoteStreamsRef.current)
          );
        }
      };

      pc.ontrack = (event) => {
        const stream =
          event.streams[0] ??
          new MediaStream([event.track]);

        remoteStreamsRef.current.set(peerId, stream);

        setRemoteStreams(
          new Map(remoteStreamsRef.current)
        );

        event.track.onended = () => {
          console.log("Track ended:", peerId);

          remoteStreamsRef.current.delete(peerId);

          setRemoteStreams(
            new Map(remoteStreamsRef.current)
          );
        };
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signaling.sendIceCandidate(peerId, event.candidate);
        }
      };

      peersRef.current.set(peerId, pc);


      if (shouldInitiate(peerId)) {
        initiateOffer(peerId);
      }

      pc.onconnectionstatechange = () => {
        console.log(
          peerId,
          pc.connectionState
        );

        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          pc.close();

          peersRef.current.delete(peerId);

          remoteStreamsRef.current.delete(peerId);

          setRemoteStreams(
            new Map(remoteStreamsRef.current)
          );

          iceQueueRef.current.delete(peerId);
        }
      };

      return pc;
    };

    // runs on joiner when admin sends offer
    const handleOffer = async (data: {
      offer: RTCSessionDescriptionInit;
      from: string;
      to: string;
    }) => {

      // if camera not ready, store offer (pendingOfferRef)
      if (!isReadyRef.current) {
        pendingOfferRef.current.push(data);
        return;
      }

      const fromPeerId = data.from;

      if (!canNegotiate(fromPeerId)) return;
      markNegotiated(fromPeerId);

      const pc = createOrGetPeer(fromPeerId);
      if (!pc) return;

      // ELSE: set remote description (admin offer)
      await pc.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      await flushIceQueue(fromPeerId);

      // create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // send answer back
      signaling.sendAnswer(fromPeerId, answer);
      // signaling.sendAnswer(answer);
    };

    // runs on admin when joiner replies
    const handleAnswer = async (data: {
      answer: RTCSessionDescriptionInit;
      from: string;
    }) => {
      const pc = peersRef.current.get(data.from);
      if (!pc) return;

      await pc.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );

      await flushIceQueue(data.from);
    };

    // recieves network candidates from other pper
    const handleIce = async ({ candidate, from }: any) => {
      const queue = iceQueueRef.current.get(from) || [];
      queue.push(candidate);
      iceQueueRef.current.set(from, queue);

      const pc = peersRef.current.get(from);
      if (!pc) return;

      if (pc.remoteDescription) {
        await flushIceQueue(from);
      }
    };

    // runs when camera is ready
    const onCameraReady = () => {
      isReadyRef.current = true;

      for (const peerId of participantsRef.current) {
        if (!peersRef.current.has(peerId)) {
          createOrGetPeer(peerId);
        }
      }

      if (pendingOfferRef.current.length > 0) {
        const offers = [...pendingOfferRef.current];
        pendingOfferRef.current = [];

        for (const offerData of offers) {
          void handleOffer(offerData);
        }
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

    signaling.setHandlers({
      onOffer: handleOffer,
      onAnswer: handleAnswer,
      onIce: handleIce,
      onParticipants: handleParticipants,
    });

    void startCamera();
    signaling.syncRoomUsers();

    // cleanup func, runs when: leaving room / component unmounts / route changes
    return () => {
      cancelled = true;

      signaling.setHandlers({});

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      // close ALL peer connections (mesh cleanup)
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();

      remoteStreamsRef.current.clear();
      setRemoteStreams(new Map());

      participantsRef.current = [];

      negotiationLockRef.current.clear();

      // reset refs
      isReadyRef.current = false;
      // callStartedRef.current = false;
      // peerReadyRef.current = false;
      pendingOfferRef.current = [];

      // clear ICE queues (per-peer map)
      iceQueueRef.current.clear();
    };
  }, [meetingId, signaling]);

  // sets flag so cleanup knows user intentionally left
  const handleLeave = () => {
    // leavingRef.current = true;
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

  const remoteParticipants = Array.from(
    remoteStreams.entries()
  );

  const allParticipants = [
    ...(localStream
      ? [
        {
          peerId: "You",
          stream: localStream,
        },
      ]
      : []),

    ...remoteParticipants.map(([peerId, stream]) => ({
      peerId,
      stream,
    })),
  ];

  const participantCount = allParticipants.length;

const desktopLayouts: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 3,
};

const mobileLayouts: Record<number, number> = {
  1: 1, // 1×1
  2: 1, // 1 column, 2 rows
  3: 1, // 1 column, 3 rows
  4: 2, // 2×2
  5: 2, // 2 columns, 3 rows
  6: 2, // 2 columns, 3 rows
};

 const cols = isMobile
  ? mobileLayouts[participantCount] ?? 2
  : desktopLayouts[participantCount] ?? 3;

  return (
    <div className="group relative w-full min-h-[calc(100dvh-5rem)] bg-[#0c0d12] overflow-hidden text-white">

      <header
  className="
    absolute top-0 left-0 z-50
    flex w-full flex-col gap-3
    border-b border-white/10
    bg-white/10
    px-4 py-3
    backdrop-blur-md

    sm:flex-row
    sm:items-center
    sm:justify-between
    sm:px-6

    opacity-100
    md:opacity-0
    transition-opacity
    duration-300
    md:group-hover:opacity-100
  "
>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">

          <span className="text-white/70 text-sm font-medium">
            ID: <span className="font-mono text-white/70 break-all text-xs sm:text-sm">
              {meetingId}
            </span>
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

        </div>
      </header>

      <div className="absolute inset-0 p-2 pt-20 pb-24 sm:p-4 sm:pt-18 sm:pb-18">
        <div
          className="grid h-full w-full gap-4"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {allParticipants.map(({ peerId, stream }) => (
            <RemoteVideo
              key={peerId}
              name={peerId === "You" ? "You" : profile?.full_name}
              stream={stream}
              muted={peerId === "You"}
            />
          ))}
        </div>
      </div>

      <nav
        className="
    absolute
    bottom-4
    left-1/2
    z-50
    flex
    -translate-x-1/2
    items-center
    gap-3
    rounded-full
    border
    border-white/10
    bg-white/10
    px-3
    py-2
    backdrop-blur-xl
    shadow-2xl
    max-w-[95vw]

    sm:bottom-8
    sm:gap-6
    sm:px-6
    sm:py-3

    opacity-100
md:opacity-0
transition-opacity
duration-300
md:group-hover:opacity-100
  "
      >
        {/* AUDIO */}
        <button onClick={toggleAudio} className="group flex flex-col items-center gap-1">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-95 ${isAudioMuted
              ? "bg-red-500 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </div>
          <span className="hidden text-[10px] text-white/60 sm:block">
            Mute
          </span>
        </button>

        {/* VIDEO */}
        <button onClick={toggleVideo} className="group flex flex-col items-center gap-1">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-95 ${isVideoMuted
              ? "bg-red-500 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
          </div>
          <span className="hidden text-[10px] text-white/60 sm:block">
            Video
          </span>
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
        <div className="mx-1 h-8 w-px bg-white/20" />

        {/* END CALL */}
        <button onClick={handleLeave} className="group flex flex-col items-center gap-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-all duration-200 group-active:scale-95">
            <PhoneOff size={20} />
          </div>
          <span className="hidden text-[10px] text-white/60 sm:block">
            End
          </span>
        </button>

      </nav>
    </div>
  );
}
