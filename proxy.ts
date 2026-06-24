import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/proxy";

const PUBLIC_PATHS = ["/login"];

function isPublicPath(path: string) {
  return (
    PUBLIC_PATHS.includes(path) ||
    path.startsWith("/join/") ||
    path.startsWith("/api/guest/meetings/")
  );
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  const { supabase, res } = createMiddlewareClient(req);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

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
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};