import { connection } from "next/server";
import { readProfiles, removeProfile, upsertProfile } from "@/lib/profile-store";
import type { Profile } from "@/lib/profiles";

const fail = (e: unknown) =>
  Response.json({ error: e instanceof Error ? e.message : "database error" }, { status: 500 });

export async function GET() {
  await connection(); // always read fresh from the database
  try {
    return Response.json(await readProfiles());
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: Request) {
  const p = (await request.json()) as Profile;
  if (!p?.id || !p.title || !Array.isArray(p.names) || !Array.isArray(p.descriptions)) {
    return Response.json({ error: "invalid profile" }, { status: 400 });
  }
  try {
    await upsertProfile({ id: p.id, title: p.title, names: p.names, descriptions: p.descriptions });
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  try {
    await removeProfile(id);
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
