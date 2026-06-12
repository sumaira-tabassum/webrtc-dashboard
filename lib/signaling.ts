import { supabaseClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const MAX_PARTICIPANTS = 2;
const JOIN_TIMEOUT_MS = 5000;

type Role = "host" | "guest";

type PresenceMeta = {
  role: Role;
  odId: string;
};

export class MeetingSignaling {
  private channel: RealtimeChannel | null = null;
  private roomId: string | null = null;
  readonly odId: string;

  private onOffer?: (payload: { offer: RTCSessionDescriptionInit }) => void;
  private onAnswer?: (payload: { answer: RTCSessionDescriptionInit }) => void;
  private onIce?: (payload: { candidate: RTCIceCandidateInit }) => void;
  private onRoomUsers?: (count: number) => void;

  constructor() {
    this.odId = crypto.randomUUID();
  }

  private channelName(roomId: string) {
    return `meeting:${roomId}`;
  }

  private countParticipants(ch?: RealtimeChannel): number {
    const channel = ch ?? this.channel;
    if (!channel) return 0;

    const state = channel.presenceState();
    return Object.values(state).reduce((n, presences) => {
      const list = Array.isArray(presences) ? presences : [presences];
      return n + list.length;
    }, 0);
  }

  private hasHost(ch?: RealtimeChannel): boolean {
    const channel = ch ?? this.channel;
    if (!channel) return false;

    const state = channel.presenceState();
    return Object.values(state).some((presences) => {
      const list = Array.isArray(presences) ? presences : [presences];
      return list.some((p) => (p as unknown as PresenceMeta).role === "host");
    });
  }

  private setupBroadcastHandlers(channel: RealtimeChannel) {
    channel
      .on("broadcast", { event: "offer" }, ({ payload }) => {
        const data = payload as { offer: RTCSessionDescriptionInit; from: string };
        if (data.from === this.odId) return;
        this.onOffer?.({ offer: data.offer });
      })
      .on("broadcast", { event: "answer" }, ({ payload }) => {
        const data = payload as { answer: RTCSessionDescriptionInit; from: string };
        if (data.from === this.odId) return;
        this.onAnswer?.({ answer: data.answer });
      })
      .on("broadcast", { event: "ice-candidate" }, ({ payload }) => {
        const data = payload as { candidate: RTCIceCandidateInit; from: string };
        if (data.from === this.odId) return;
        this.onIce?.({ candidate: data.candidate });
      });
  }

  private setupPresenceHandler(channel: RealtimeChannel) {
    channel.on("presence", { event: "sync" }, () => {
      const count = this.countParticipants(channel);
      if (count === MAX_PARTICIPANTS) {
        this.onRoomUsers?.(count);
      }
    });
  }

  private async subscribeAndTrack(
    channel: RealtimeChannel,
    roomId: string,
    role: Role
  ): Promise<void> {
    this.channel = channel;
    this.roomId = roomId;
    this.setupBroadcastHandlers(channel);
    this.setupPresenceHandler(channel);

    await new Promise<void>((resolve, reject) => {
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const trackResult = await channel.track({ role, odId: this.odId });
          if (trackResult === "error") {
            reject(new Error("Failed to join room"));
            return;
          }
          resolve();
        } else if (status === "CHANNEL_ERROR") {
          reject(new Error("Failed to connect to room"));
        }
      });
    });
  }

  async createRoom(roomId: string): Promise<void> {
    await this.leave();

    const channel = supabaseClient.channel(this.channelName(roomId), {
      config: {
        presence: { key: this.odId },
        broadcast: { self: false },
      },
    });

    await this.subscribeAndTrack(channel, roomId, "host");
  }

  async joinRoom(roomId: string): Promise<{ ok: boolean; error?: string }> {
    await this.leave();

    const channel = supabaseClient.channel(this.channelName(roomId), {
      config: {
        presence: { key: this.odId },
        broadcast: { self: false },
      },
    });

    this.setupBroadcastHandlers(channel);
    this.setupPresenceHandler(channel);
    this.roomId = roomId;

    return new Promise((resolve) => {
      let settled = false;

      const settle = (result: { ok: boolean; error?: string }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };

      const timer = setTimeout(() => {
        void channel.unsubscribe();
        supabaseClient.removeChannel(channel);
        settle({ ok: false, error: "Room does not exist" });
      }, JOIN_TIMEOUT_MS);

      channel.on("presence", { event: "sync" }, () => {
        if (settled) return;

        const count = this.countParticipants(channel);
        const hostPresent = this.hasHost(channel);

        if (!hostPresent) return;

        if (count >= MAX_PARTICIPANTS) {
          void channel.unsubscribe();
          supabaseClient.removeChannel(channel);
          settle({ ok: false, error: "Room is full" });
          return;
        }

        void channel
          .track({ role: "guest", odId: this.odId })
          .then((status) => {
            if (status === "error") {
              void channel.unsubscribe();
              supabaseClient.removeChannel(channel);
              settle({ ok: false, error: "Failed to join room" });
              return;
            }
            this.channel = channel;
            settle({ ok: true });
          });
      });

      channel.subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          settle({ ok: false, error: "Failed to connect" });
        }
      });
    });
  }

  /** Re-check presence when entering the meeting view (handles race after join). */
  syncRoomUsers(): void {
    const count = this.countParticipants();
    if (count === MAX_PARTICIPANTS) {
      this.onRoomUsers?.(count);
    }
  }

  setHandlers(handlers: {
    onOffer?: (payload: { offer: RTCSessionDescriptionInit }) => void;
    onAnswer?: (payload: { answer: RTCSessionDescriptionInit }) => void;
    onIce?: (payload: { candidate: RTCIceCandidateInit }) => void;
    onRoomUsers?: (count: number) => void;
  }) {
    this.onOffer = handlers.onOffer;
    this.onAnswer = handlers.onAnswer;
    this.onIce = handlers.onIce;
    this.onRoomUsers = handlers.onRoomUsers;
  }

  sendOffer(offer: RTCSessionDescriptionInit) {
    void this.channel?.send({
      type: "broadcast",
      event: "offer",
      payload: { offer, from: this.odId },
    });
  }

  sendAnswer(answer: RTCSessionDescriptionInit) {
    void this.channel?.send({
      type: "broadcast",
      event: "answer",
      payload: { answer, from: this.odId },
    });
  }

  sendIceCandidate(candidate: RTCIceCandidateInit) {
    void this.channel?.send({
      type: "broadcast",
      event: "ice-candidate",
      payload: { candidate, from: this.odId },
    });
  }

  async leave(): Promise<void> {
    if (!this.channel) return;

    await this.channel.untrack();
    await this.channel.unsubscribe();
    supabaseClient.removeChannel(this.channel);

    this.channel = null;
    this.roomId = null;
    this.onOffer = undefined;
    this.onAnswer = undefined;
    this.onIce = undefined;
    this.onRoomUsers = undefined;
  }
}
