import { supabaseClient } from "./supabase/client";

export async function login(email: string, password: string) {
  return await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
}