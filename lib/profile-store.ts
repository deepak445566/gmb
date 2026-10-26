import { MongoClient } from "mongodb";
import type { Profile } from "./profiles";

// Imported files are saved in MongoDB (collection "profiles") so every browser sees them.
// Connection string comes from MONGODB_URI in .env.local; MONGODB_DB picks the database.
type ProfileDoc = Omit<Profile, "id" | "updatedAt"> & { _id: string; updatedAt: Date };

// Reuse one client across hot reloads in dev
const globalForMongo = globalThis as unknown as { mongoClient?: Promise<MongoClient> };

async function collection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI .env.local mein set nahi hai");
  // give up after 8s so the error reaches the browser before Vercel's function timeout
  globalForMongo.mongoClient ??= new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }).connect();
  let client: MongoClient;
  try {
    client = await globalForMongo.mongoClient;
  } catch (e) {
    globalForMongo.mongoClient = undefined; // don't keep a failed connection; retry on the next request
    throw e;
  }
  return client.db(process.env.MONGODB_DB || "gmb").collection<ProfileDoc>("profiles");
}

export async function readProfiles(): Promise<Profile[]> {
  const docs = await (await collection()).find().sort({ updatedAt: -1 }).toArray();
  return docs.map(({ _id, title, names, descriptions, updatedAt }) => ({
    id: _id,
    title,
    names,
    descriptions,
    updatedAt: updatedAt?.toISOString(),
  }));
}

export async function upsertProfile(p: Profile) {
  await (await collection()).updateOne(
    { _id: p.id },
    { $set: { title: p.title, names: p.names, descriptions: p.descriptions, updatedAt: new Date() } },
    { upsert: true },
  );
}

export async function removeProfile(id: string) {
  await (await collection()).deleteOne({ _id: id });
}
