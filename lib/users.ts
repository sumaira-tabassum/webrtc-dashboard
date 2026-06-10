import { supabaseClient } from "@/lib/supabase/client";

// GET all users
export async function getUsers() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*");

  if (error) throw error;
  return data;
}

// UPDATE user role
export async function updateUserRole(id: string, role: string) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .update({ role })
    .eq("id", id);

  if (error) throw error;
  return data;
}

// DELETE user
export async function deleteUser(id: string) {
  const { error } = await supabaseClient
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw error;
}