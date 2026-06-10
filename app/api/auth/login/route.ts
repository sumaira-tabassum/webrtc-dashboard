"use client";

import { supabaseClient } from "@/lib/supabase/client";

export async function login(email: string, password: string) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}