import { useSyncExternalStore } from "react";

// Saved businesses (imported Name/Description lists), stored in the database via /api/profiles.
// `descriptions` has one entry when every row shares the same description, else one per row.
export type Profile = { id: string; title: string; names: string[]; descriptions: string[]; updatedAt?: string };

const API = "/api/profiles";
const LEGACY_KEY = "gmb-profiles"; // older builds saved in localStorage

const listeners = new Set<() => void>();
let snapshot = "null"; // "null" = not loaded from the database yet
let loaded = false;

function set(profiles: Profile[]) {
  snapshot = JSON.stringify(profiles);
  listeners.forEach((l) => l());
}

export function parseProfiles(raw: string): Profile[] {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // older saves had a single `description` string
    return data.map((p) => ({ ...p, descriptions: p.descriptions ?? [p.description ?? ""] }));
  } catch {
    return [];
  }
}

// The API answers {"error": "..."}, but a host timeout or crash page isn't JSON
function errorMessage(status: number, body: string) {
  try {
    return JSON.parse(body).error ?? `HTTP ${status}`;
  } catch {
    return `HTTP ${status}${status === 504 ? " (server timeout – database tak connection nahi ho paya)" : ""}`;
  }
}

async function post(profile: Profile) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error(`Save fail: ${errorMessage(res.status, await res.text())}`);
}

// Moves anything still in this browser's localStorage into the database, once.
async function migrateLegacy(existing: Profile[]) {
  let legacy: Profile[] = [];
  try {
    legacy = parseProfiles(localStorage.getItem(LEGACY_KEY) ?? "[]");
  } catch {
    return false;
  }
  const missing = legacy.filter((l) => !existing.some((p) => p.id === l.id || p.title === l.title));
  for (const p of missing) await post(p);
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
  return missing.length > 0;
}

async function fetchAll() {
  const res = await fetch(API);
  const body = await res.text();
  if (!res.ok) throw new Error(errorMessage(res.status, body));
  return parseProfiles(body);
}

async function load() {
  try {
    let profiles = await fetchAll();
    if (await migrateLegacy(profiles)) profiles = await fetchAll();
    set(profiles);
  } catch (e) {
    set([]); // stop showing "loading"
    alert(`Saved files database se load nahi ho payi: ${e instanceof Error ? e.message : e}`);
  }
}

// useSyncExternalStore plumbing
export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!loaded) {
    loaded = true;
    load();
  }
  return () => listeners.delete(listener);
}
export const getSnapshot = () => snapshot;
export const getServerSnapshot = () => "null";

// React hook: saved files (newest first) and whether they've loaded yet
export function useProfiles() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { profiles: parseProfiles(raw), loaded: raw !== "null" };
}

// Updates the screen immediately, then saves to the database.
export function saveProfile(profile: Profile) {
  // newest first, same order the database returns
  const saved = { ...profile, updatedAt: new Date().toISOString() };
  set([saved, ...parseProfiles(snapshot).filter((p) => p.id !== profile.id)]);
  post(profile).catch((e) =>
    alert(`"${profile.title}" database mein save nahi hui. Dobara import karo.\n\n${e instanceof Error ? e.message : e}`),
  );
}

export function deleteProfile(id: string) {
  set(parseProfiles(snapshot).filter((p) => p.id !== id));
  fetch(`${API}?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() =>
    alert("Database se delete nahi hua."),
  );
}
