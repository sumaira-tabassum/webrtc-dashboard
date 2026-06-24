import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/proxy";
import { supabaseServer } from "@/lib/supabase/server";

function generateRoomId() {
  return `lum-${crypto.randomUUID().slice(0, 4)}-${crypto
    .randomUUID()
    .slice(0, 3)}`;
}

function generateGuestToken() {
  return crypto.randomUUID().replaceAll("-", "");
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
  const guestToken = generateGuestToken();

  const { data: meeting, error } = await supabaseServer
    .from("meetings")
    .insert({
      room_id: roomId,
      guest_token: guestToken,
      host_user_id: user.id,
      host_name: profile?.full_name ?? user.email ?? "Host",
      title: "Instant Meeting",
      guest_access_enabled: true,
      status: "active",
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    })
    .select(
      "id, room_id, guest_token, title, host_name, status, expires_at, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const origin = req.nextUrl.origin;
  const guestUrl = `${origin}/join/${guestToken}`;

  return NextResponse.json({
    meeting,
    roomId,
    guestUrl,
  });
}