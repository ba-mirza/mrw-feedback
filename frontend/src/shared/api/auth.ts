import { supabase } from "./supabase";
import type { AdminProfile } from "./types";

export async function login(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchAdminProfile(): Promise<AdminProfile | null> {
  const { data, error } = await supabase.from("admins").select("user_id, name").maybeSingle();
  if (error) throw error;

  return data;
}
