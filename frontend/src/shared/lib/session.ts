import { useSyncExternalStore } from "react";

const TOKEN_STORAGE_KEY = "marwin.admin.token";

const listeners = new Set<() => void>();

function readToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

let currentToken = readToken();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getAccessToken() {
  return currentToken;
}

export function setAccessToken(token: string | null) {
  if (currentToken === token) return;
  currentToken = token;
  writeToken(token);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAccessToken() {
  return useSyncExternalStore(subscribe, getAccessToken);
}
