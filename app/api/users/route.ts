import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET all users
export async function GET() {
  const { data, error } = await supabaseServer
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// CREATE user (admin)
export async function POST(req: Request) {
  const body = await req.json();

  const { email, role, full_name, password } = body;

  const defaultPassword = process.env.DEFAULT_USER_PASSWORD

  // 1. Create AUTH user (real login user)
  const { data: authUser, error: authError } =
    await supabaseServer.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
    });

  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: 500 }
    );
  }

  const userId = authUser.user.id;

  // 2. Create PROFILE row linked to auth user
  const { data, error } = await supabaseServer
    .from("profiles")
    .insert([
      {
        id: userId,
        email,
        full_name,
        role: role || "user",
        status: "active",
      },
    ])
    .select();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data[0]);
}