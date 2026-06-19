import { supabaseClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const MAX_PARTICIPANTS = 6;
const JOIN_TIMEOUT_MS = 5000;

// type Role = "host" | "guest";

//info about user
type PresenceMeta = {
  // role: Role;
  odId: string;
};

type OfferPayload = {
  offer: RTCSessionDescriptionInit;
  from: string;
  to: string;
};

type AnswerPayload = {
  answer: RTCSessionDescriptionInit;
  from: string;
  to: string;
};

type IcePayload = {
  candidate: RTCIceCandidateInit;
  from: string;
  to: string;
};

export class MeetingSignaling {
  private channel: RealtimeChannel | null = null; //Stores current Supabase room.
  private roomId: string | null = null;         //meeting id
  readonly odId: string;                        //unique browser identifier

  private onOffer?: (payload: OfferPayload) => void;
  private onAnswer?: (payload: AnswerPayload) => void;
  private onIce?: (payload: IcePayload) => void;

  private onParticipants?: (participants: string[]) => void;
  // private onRoomUsers?: (count: number) => void;

  // Every browser tab gets its own unique ID.
  constructor() {
    this.odId = crypto.randomUUID();    //browser API 
  }

  // helper function
  private channelName(roomId: string) {
    return `meeting:${roomId}`;
  }

  private countParticipants(ch?: RealtimeChannel): number {
    const channel = ch ?? this.channel;
    if (!channel) return 0;

    const state = channel.presenceState();
    return Object.values(state).reduce((n, presences) => {        //get only values, not keys
      const list = Array.isArray(presences) ? presences : [presences];
      return n + list.length;
    }, 0);
  }

  private getParticipants(ch?: RealtimeChannel): string[] {
    const channel = ch ?? this.channel;
    if (!channel) return [];

    const state = channel.presenceState();

    const participants = Object.values(state)
      .flat()
      .map((p) => (p as unknown as PresenceMeta).odId)
      .filter(Boolean);

    return [...new Set(participants)];
  }

  private setupBroadcastHandlers(channel: RealtimeChannel) {
    channel
      .on("broadcast", { event: "offer" }, ({ payload }) => {
        const data = payload as { offer: RTCSessionDescriptionInit; from: string; to: string };
        // if (data.from === this.odId) return;
        if (data.to !== this.odId) return;
        this.onOffer?.({
          offer: data.offer,
          from: data.from,
          to: data.to
        });
      })
      .on("broadcast", { event: "answer" }, ({ payload }) => {
        const data = payload as { answer: RTCSessionDescriptionInit; from: string; to: string };
        if (data.from === this.odId) return;
        if (data.to !== this.odId) return;
        this.onAnswer?.({
          answer: data.answer,
          from: data.from,
          to: data.to,
        });
      })
      .on("broadcast", { event: "ice-candidate" }, ({ payload }) => {
        const data = payload as { candidate: RTCIceCandidateInit; from: string; to: string };
        if (data.from === this.odId) return;
        if (data.to !== this.odId) return;
        this.onIce?.({
          candidate: data.candidate,
          from: data.from,
          to: data.to,
        });
      });
  }

  private setupPresenceHandler(channel: RealtimeChannel) {
    channel.on("presence", { event: "sync" }, () => {
      const participants = this.getParticipants(channel);

      this.onParticipants?.(participants);
    });
  }

  private async subscribeAndTrack(
    channel: RealtimeChannel,
    roomId: string
  ): Promise<void> {
    this.channel = channel;
    this.roomId = roomId;
    this.setupBroadcastHandlers(channel);
    this.setupPresenceHandler(channel);

    await new Promise<void>((resolve, reject) => {
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const trackResult = await channel.track({ odId: this.odId });
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

    await this.subscribeAndTrack(channel, roomId);
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
        if (count === 0) return;

        // const hostPresent = this.hasHost(channel);
        // if (!hostPresent) return;

        if (count >= MAX_PARTICIPANTS) {
          void channel.unsubscribe();
          supabaseClient.removeChannel(channel);
          settle({ ok: false, error: "Room is full" });
          return;
        }

        void channel
          .track({odId: this.odId })
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
    const participants = this.getParticipants();
    this.onParticipants?.(participants);
  }

  setHandlers(handlers: {
    onOffer?: (payload: OfferPayload) => void;
    onAnswer?: (payload: AnswerPayload) => void;
    onIce?: (payload: IcePayload) => void;
    onParticipants?: (participants: string[]) => void;
  }) {
    this.onOffer = handlers.onOffer;
    this.onAnswer = handlers.onAnswer;
    this.onIce = handlers.onIce;
    this.onParticipants = handlers.onParticipants;
  }

  sendOffer(to: string, offer: RTCSessionDescriptionInit) {
    void this.channel?.send({
      type: "broadcast",
      event: "offer",
      payload: { to, offer, from: this.odId },
    });
  }

  sendAnswer(to: string, answer: RTCSessionDescriptionInit) {
    void this.channel?.send({
      type: "broadcast",
      event: "answer",
      payload: { to, answer, from: this.odId },
    });
  }

  sendIceCandidate(to: string, candidate: RTCIceCandidateInit) {
    void this.channel?.send({
      type: "broadcast",
      event: "ice-candidate",
      payload: { to, candidate, from: this.odId },
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
    this.onParticipants = undefined;
  }
}
