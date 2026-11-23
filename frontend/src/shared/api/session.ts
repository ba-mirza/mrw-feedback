import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./supabase";

const listeners = new Set<() => void>();

let currentSession: Session | null | undefined;

supabase.auth.onAuthStateChange((_event, session) => {
  currentSession = session;
  listeners.forEach((listener) => listener());
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSession() {
  return currentSession;
}

export function useAuthSession() {
  return useSyncExternalStore(subscribe, getSession);
}
