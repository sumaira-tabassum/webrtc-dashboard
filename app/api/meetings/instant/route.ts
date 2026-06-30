import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/proxy";
import { supabaseServer } from "@/lib/supabase/server";

const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const MAX_TOKEN_ATTEMPTS = 10;

function generateRoomId() {
  return `lum-${crypto.randomUUID().slice(0, 4)}-${crypto
    .randomUUID()
    .slice(0, 3)}`;
}

function randomTokenPart(length: number) {
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * TOKEN_ALPHABET.length);
    return TOKEN_ALPHABET[index];
  }).join("");
}

function generateGuestToken() {
  return `${randomTokenPart(3)}-${randomTokenPart(3)}`;
}

async function createUniqueMeeting(input: {
  roomId: string;
  hostUserId: string;
  hostName: string;
}) {
  for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt++) {
    const guestToken = generateGuestToken();

    const { data: meeting, error } = await supabaseServer
      .from("meetings")
      .insert({
        room_id: input.roomId,
        guest_token: guestToken,
        host_user_id: input.hostUserId,
        host_name: input.hostName,
        title: "Instant Meeting",
        guest_access_enabled: true,
        status: "active",
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      })
      .select(
        "id, room_id, guest_token, title, host_name, status, expires_at, created_at"
      )
      .single();

    if (!error && meeting) {
      return { meeting, guestToken };
    }

    if (error?.code !== "23505") {
      throw error;
    }
  }

  throw new Error("Could not generate a unique guest link. Please try again.");
}

export async function POST(req: NextRequest) {
  const { supabase } = createMiddlewareClient(req);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const roomId = generateRoomId();
  const hostName = profile?.full_name ?? user.email ?? "Host";

  try {
    const { meeting, guestToken } = await createUniqueMeeting({
      roomId,
      hostUserId: user.id,
      hostName,
    });

    const origin = req.nextUrl.origin;
    const guestUrl = `${origin}/join/${guestToken}`;

    return NextResponse.json({
      meeting,
      roomId,
      guestUrl,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create instant meeting";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}