

import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/proxy";

export async function proxy(req: NextRequest) {
  const { supabase, res } = createMiddlewareClient(req);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // allow login page
  if (path === "/login") return res;

 // if not logged in → login
if (!user) {
  return NextResponse.redirect(new URL("/login", req.url));
}

// Protect admin routes
if (path.startsWith("/users")) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/meet", req.url));
  }
}

return res;

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

