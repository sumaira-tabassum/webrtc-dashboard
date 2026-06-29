import { supabaseClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const MAX_PARTICIPANTS = 6;
const JOIN_TIMEOUT_MS = 5000;

export type ParticipantType = "user" | "guest";

export type ParticipantMeta = {
  odId: string;
  displayName: string;
  participantType: ParticipantType;
  userId?: string;
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

type MeetingSignalingOptions = {
  displayName?: string;
  participantType?: ParticipantType;
  userId?: string;
};

export class MeetingSignaling {
  private channel: RealtimeChannel | null = null;
  private roomId: string | null = null;

  readonly odId: string;

  private displayName: string;
  private participantType: ParticipantType;
  private userId?: string;

  private onOffer?: (payload: OfferPayload) => void;
  private onAnswer?: (payload: AnswerPayload) => void;
  private onIce?: (payload: IcePayload) => void;
  private onParticipants?: (participants: ParticipantMeta[]) => void;

  constructor(options: MeetingSignalingOptions = {}) {
    this.odId = crypto.randomUUID();
    this.displayName = options.displayName?.trim() || "Participant";
    this.participantType = options.participantType ?? "user";
    this.userId = options.userId;
  }

  setParticipant(options: MeetingSignalingOptions) {
    this.displayName = options.displayName?.trim() || this.displayName;
    this.participantType = options.participantType ?? this.participantType;
    this.userId = options.userId ?? this.userId;
  }

  private channelName(roomId: string) {
    return `meeting:${roomId}`;
  }

  private presenceMeta(): ParticipantMeta {
    return {
      odId: this.odId,
      displayName: this.displayName,
      participantType: this.participantType,
      ...(this.userId ? { userId: this.userId } : {}),
    };
  }

  private countParticipants(ch?: RealtimeChannel): number {
    const channel = ch ?? this.channel;
    if (!channel) return 0;

    const state = channel.presenceState();

    return Object.values(state).reduce((count, presences) => {
      const list = Array.isArray(presences) ? presences : [presences];
      return count + list.length;
    }, 0);
  }

  private getParticipants(ch?: RealtimeChannel): ParticipantMeta[] {
    const channel = ch ?? this.channel;
    if (!channel) return [];

    const state = channel.presenceState();

    const participants = Object.values(state)
      .flat()
      .map((presence) => presence as unknown as Partial<ParticipantMeta>)
      .filter((presence): presence is ParticipantMeta => {
        return Boolean(presence.odId);
      });

    const uniqueParticipants = new Map<string, ParticipantMeta>();

    for (const participant of participants) {
      uniqueParticipants.set(participant.odId, {
        odId: participant.odId,
        displayName: participant.displayName || "Participant",
        participantType: participant.participantType || "guest",
        userId: participant.userId,
      });
    }

    return Array.from(uniqueParticipants.values());
  }

  private setupBroadcastHandlers(channel: RealtimeChannel) {
    channel
      .on("broadcast", { event: "offer" }, ({ payload }) => {
        const data = payload as OfferPayload;

        if (data.to !== this.odId) return;

        this.onOffer?.({
          offer: data.offer,
          from: data.from,
          to: data.to,
        });
      })
      .on("broadcast", { event: "answer" }, ({ payload }) => {
        const data = payload as AnswerPayload;

        if (data.from === this.odId) return;
        if (data.to !== this.odId) return;

        this.onAnswer?.({
          answer: data.answer,
          from: data.from,
          to: data.to,
        });
      })
      .on("broadcast", { event: "ice-candidate" }, ({ payload }) => {
        const data = payload as IcePayload;

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
          const trackResult = await channel.track(this.presenceMeta());

          if (trackResult === "error") {
            reject(new Error("Failed to join room"));
            return;
          }

          resolve();
        }

        if (status === "CHANNEL_ERROR") {
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

        if (count >= MAX_PARTICIPANTS) {
          void channel.unsubscribe();
          supabaseClient.removeChannel(channel);
          settle({ ok: false, error: "Room is full" });
          return;
        }

        void channel.track(this.presenceMeta()).then((status) => {
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

  syncRoomUsers(): void {
    const participants = this.getParticipants();
    this.onParticipants?.(participants);
  }

  setHandlers(handlers: {
    onOffer?: (payload: OfferPayload) => void;
    onAnswer?: (payload: AnswerPayload) => void;
    onIce?: (payload: IcePayload) => void;
    onParticipants?: (participants: ParticipantMeta[]) => void;
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