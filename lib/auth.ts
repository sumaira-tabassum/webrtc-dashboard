import { supabaseClient } from "./supabase/client";

export async function login(email: string, password: string) {
  return await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
}

export async function logout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.log("LOGOUT ERROR:", error.message);
    return;
  }

  // force full reload so middleware + auth state resets cleanly
  window.location.href = "/login";
}