import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  if (!token) {
    return NextResponse.json(
      { error: "Missing meeting token" },
      { status: 400 }
    );
  }

  const { data: meeting, error } = await supabaseServer
    .from("meetings")
    .select(
      "room_id, title, host_name, guest_access_enabled, status, expires_at, created_at"
    )
    .eq("guest_token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!meeting) {
    return NextResponse.json(
      { error: "Meeting link is invalid" },
      { status: 404 }
    );
  }

  if (!meeting.guest_access_enabled) {
    return NextResponse.json(
      { error: "Guest access is disabled for this meeting" },
      { status: 403 }
    );
  }

  if (meeting.status !== "active") {
    return NextResponse.json(
      { error: "This meeting has ended" },
      { status: 410 }
    );
  }

  if (
    meeting.expires_at &&
    new Date(meeting.expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "This meeting link has expired" },
      { status: 410 }
    );
  }

  return NextResponse.json({
    meeting: {
      roomId: meeting.room_id,
      title: meeting.title ?? "Instant Meeting",
      hostName: meeting.host_name ?? "Host",
      createdAt: meeting.created_at,
      expiresAt: meeting.expires_at,
    },
  });
}