const DEVICE_STORAGE_KEY = "marwin.survey.device";

function createDeviceId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function getDeviceId() {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (stored) return stored;
    const created = createDeviceId();
    localStorage.setItem(DEVICE_STORAGE_KEY, created);
    return created;
  } catch {
    return undefined;
  }
}
