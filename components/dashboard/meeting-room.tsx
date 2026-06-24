"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

import RemoteVideo from "@/components/remote-video";
import { createPeerConnection } from "@/lib/webrtc";
import { MeetingSignaling, type ParticipantMeta } from "@/lib/signaling";

type Props = {
  meetingId: string;
  signaling: MeetingSignaling;
  onLeave: () => void;
  currentParticipantName?: string;
  isGuest?: boolean;
  onMeetingStateChange?: (inMeeting: boolean) => void;
};

type PendingOffer = {
  offer: RTCSessionDescriptionInit;
  from: string;
  to: string;
};

export default function MeetingRoom({
  meetingId,
  signaling,
  onLeave,
  currentParticipantName = "You",
  isGuest = false,
  onMeetingStateChange,
}: Props) {
  const [seconds, setSeconds] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const participantsRef = useRef<ParticipantMeta[]>([]);

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );

  const [participantNames, setParticipantNames] = useState<Map<string, string>>(
    new Map()
  );

  const negotiationLockRef = useRef<Set<string>>(new Set());
  const isReadyRef = useRef(false);
  const pendingOfferRef = useRef<PendingOffer[]>([]);
  const iceQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 640);
    };

    update();

    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    onMeetingStateChange?.(true);

    return () => {
      onMeetingStateChange?.(false);
    };
  }, [onMeetingStateChange]);

  useEffect(() => {
    let cancelled = false;

    const flushIceQueue = async (peerId: string) => {
      const pc = peersRef.current.get(peerId);
      if (!pc?.remoteDescription) return;

      const queue = iceQueueRef.current.get(peerId) || [];

      while (queue.length > 0) {
        const candidate = queue.shift();

        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
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

    const removePeer = (peerId: string) => {
      const pc = peersRef.current.get(peerId);

      pc?.close();

      peersRef.current.delete(peerId);
      remoteStreamsRef.current.delete(peerId);
      iceQueueRef.current.delete(peerId);

      const key = [signaling.odId, peerId].sort().join("-");
      negotiationLockRef.current.delete(key);

      setRemoteStreams(new Map(remoteStreamsRef.current));
    };

    const createOrGetPeer = (peerId: string) => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing;

      const stream = streamRef.current;

      if (!stream) {
        console.warn("Skipping peer creation because local stream is not ready");
        return null;
      }

      const pc = createPeerConnection(stream);

      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);

        remoteStreamsRef.current.set(peerId, stream);
        setRemoteStreams(new Map(remoteStreamsRef.current));

        event.track.onended = () => {
          remoteStreamsRef.current.delete(peerId);
          setRemoteStreams(new Map(remoteStreamsRef.current));
        };
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signaling.sendIceCandidate(peerId, event.candidate);
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          removePeer(peerId);
        }
      };

      peersRef.current.set(peerId, pc);

      if (shouldInitiate(peerId)) {
        void initiateOffer(peerId);
      }

      return pc;
    };

    const handleParticipants = (participants: ParticipantMeta[]) => {
      const others = participants.filter(
        (participant) => participant.odId !== signaling.odId
      );

      const nextNames = new Map<string, string>();

      for (const participant of participants) {
        nextNames.set(participant.odId, participant.displayName);
      }

      setParticipantNames(nextNames);

      const otherIds = others.map((participant) => participant.odId);
      const existingPeerIds = Array.from(peersRef.current.keys());

      for (const peerId of existingPeerIds) {
        if (!otherIds.includes(peerId)) {
          removePeer(peerId);
        }
      }

      setRemoteStreams(new Map(remoteStreamsRef.current));
      participantsRef.current = others;

      for (const participant of others) {
        if (peersRef.current.has(participant.odId)) continue;
        createOrGetPeer(participant.odId);
      }
    };

    const handleOffer = async (data: PendingOffer) => {
      if (!isReadyRef.current) {
        pendingOfferRef.current.push(data);
        return;
      }

      const fromPeerId = data.from;

      if (!canNegotiate(fromPeerId)) return;

      markNegotiated(fromPeerId);

      const pc = createOrGetPeer(fromPeerId);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      await flushIceQueue(fromPeerId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      signaling.sendAnswer(fromPeerId, answer);
    };

    const handleAnswer = async (data: {
      answer: RTCSessionDescriptionInit;
      from: string;
    }) => {
      const pc = peersRef.current.get(data.from);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      await flushIceQueue(data.from);
    };

    const handleIce = async ({
      candidate,
      from,
    }: {
      candidate: RTCIceCandidateInit;
      from: string;
    }) => {
      const queue = iceQueueRef.current.get(from) || [];

      queue.push(candidate);
      iceQueueRef.current.set(from, queue);

      const pc = peersRef.current.get(from);
      if (!pc) return;

      if (pc.remoteDescription) {
        await flushIceQueue(from);
      }
    };

    const onCameraReady = () => {
      isReadyRef.current = true;

      for (const participant of participantsRef.current) {
        if (!peersRef.current.has(participant.odId)) {
          createOrGetPeer(participant.odId);
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
      if (streamRef.current) {
        onCameraReady();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setLocalStream(stream);

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

    return () => {
      cancelled = true;

      signaling.setHandlers({});

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();

      remoteStreamsRef.current.clear();
      setRemoteStreams(new Map());

      participantsRef.current = [];
      participantNames.clear();

      negotiationLockRef.current.clear();

      isReadyRef.current = false;
      pendingOfferRef.current = [];
      iceQueueRef.current.clear();
    };
  }, [meetingId, signaling]);

  const handleLeave = () => {
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
      setSeconds((value) => value + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const remoteParticipants = Array.from(remoteStreams.entries());

  const allParticipants = [
    ...(localStream
      ? [
          {
            peerId: signaling.odId,
            name: currentParticipantName,
            stream: localStream,
            muted: true,
          },
        ]
      : []),

    ...remoteParticipants.map(([peerId, stream]) => ({
      peerId,
      name: participantNames.get(peerId) ?? "Participant",
      stream,
      muted: false,
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
    1: 1,
    2: 1,
    3: 1,
    4: 2,
    5: 2,
    6: 2,
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
            ID:{" "}
            <span className="font-mono text-white/70 break-all text-xs sm:text-sm">
              {meetingId}
            </span>
          </span>

          {!isGuest && (
            <button
              onClick={copyMeetingId}
              className="ml-1 flex items-center justify-center w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 transition-all"
              title="Copy meeting ID"
            >
              {copied ? (
                <Check size={14} className="text-white/70" />
              ) : (
                <Copy size={14} className="text-white/70" />
              )}
            </button>
          )}
        </div>

        <div className="px-4 py-2 bg-white/10 rounded-lg border border-white/10 text-sm text-white/70 font-mono">
          {String(mins).padStart(2, "0")}:
          {String(secs).padStart(2, "0")}
        </div>
      </header>

      <div className="absolute inset-0 p-2 pt-20 pb-24 sm:p-4 sm:pt-18 sm:pb-18">
        <div
          className="grid h-full w-full gap-4"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {allParticipants.map(({ peerId, name, stream, muted }) => (
            <RemoteVideo
              key={peerId}
              name={name}
              stream={stream}
              muted={muted}
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
        <button
          onClick={toggleAudio}
          className="group flex flex-col items-center gap-1"
        >
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-95 ${
              isAudioMuted
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

        <button
          onClick={toggleVideo}
          className="group flex flex-col items-center gap-1"
        >
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-95 ${
              isVideoMuted
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

        <div className="mx-1 h-8 w-px bg-white/20" />

        <button
          onClick={handleLeave}
          className="group flex flex-col items-center gap-1"
        >
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