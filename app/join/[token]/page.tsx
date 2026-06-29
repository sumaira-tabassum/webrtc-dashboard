"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Video } from "lucide-react";
import { useRouter } from "next/navigation";

import MeetingRoom from "@/components/dashboard/meeting-room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MeetingSignaling } from "@/lib/signaling";

type MeetingInfo = {
  roomId: string;
  title: string;
  hostName: string;
  createdAt: string;
  expiresAt: string | null;
};

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function GuestJoinPage({ params }: PageProps) {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
  const [name, setName] = useState("");
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signalingRef = useRef<MeetingSignaling | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadParams = async () => {
      const resolvedParams = await params;

      if (!cancelled) {
        setToken(resolvedParams.token);
      }
    };

    void loadParams();

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadMeeting = async () => {
      setLoadingMeeting(true);
      setError(null);

      try {
        const response = await fetch(`/api/guest/meetings/${token}`);
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error ?? "This meeting link is invalid");
          return;
        }

        if (!cancelled) {
          setMeeting(payload.meeting);
        }
      } catch (err) {
        console.error("Failed to load meeting:", err);

        if (!cancelled) {
          setError("Unable to load meeting. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoadingMeeting(false);
        }
      }
    };

    void loadMeeting();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    return () => {
      void signalingRef.current?.leave();
    };
  }, []);

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const displayName = name.trim();

    if (!meeting || !displayName) return;

    setJoining(true);
    setError(null);

    try {
      const signaling = new MeetingSignaling({
        displayName,
        participantType: "guest",
      });

      const result = await signaling.joinRoom(meeting.roomId);

      if (!result.ok) {
        setError(result.error ?? "Could not join meeting");
        return;
      }

      signalingRef.current = signaling;
      setActiveMeetingId(meeting.roomId);
    } catch (err) {
      console.error("Failed to join guest meeting:", err);
      setError("Could not join meeting. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = () => {
    void signalingRef.current?.leave();

    signalingRef.current = null;

    setActiveMeetingId(null);
    router.push(`/join/${token}`);
  };

  if (activeMeetingId && signalingRef.current) {
    return (
      <main className="min-h-screen bg-black text-white">
        <MeetingRoom
          meetingId={activeMeetingId}
          signaling={signalingRef.current}
          onLeave={handleLeave}
          currentParticipantName={name.trim() || "Guest"}
          isGuest
        />
      </main>
    );
  }

  if (loadingMeeting) {
    return (
      <main className="min-h-screen bg-[#faf8ff] flex items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-2xl border bg-white px-6 py-5 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-gray-600">Loading meeting...</span>
        </div>
      </main>
    );
  }

  if (error && !meeting) {
    return (
      <main className="min-h-screen bg-[#faf8ff] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Video size={26} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Meeting unavailable
          </h1>

          <p className="mt-3 text-sm text-gray-500">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8ff] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <Video size={28} />
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Guest access
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              Ready to join?
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              Enter your name before joining. You won’t need an account, and
              you’ll go straight into the meeting room.
            </p>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
            <p className="text-sm text-gray-500">Meeting</p>

            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              {meeting?.title ?? "Instant Meeting"}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Hosted by{" "}
              <span className="font-medium text-gray-700">
                {meeting?.hostName ?? "Host"}
              </span>
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-950">
              Join meeting
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Please enter the name other participants will see.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Your name
              </label>

              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex Morgan"
                maxLength={60}
                className="h-12 rounded-xl bg-white"
                autoFocus
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!name.trim() || joining}
              className="h-12 w-full rounded-xl bg-primary text-white"
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join now"
              )}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}