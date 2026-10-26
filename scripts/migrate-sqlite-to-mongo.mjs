// One-time: copy saved files from the old SQLite db (data/gmb.db) into MongoDB.
// Run from the gmbauto folder:  node --env-file=.env.local scripts/migrate-sqlite-to-mongo.mjs
import { DatabaseSync } from "node:sqlite";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI .env.local mein set nahi hai");

const sqlite = new DatabaseSync("data/gmb.db", { readOnly: true });
const rows = sqlite.prepare("SELECT id, title, names, descriptions FROM profiles").all();

const client = await new MongoClient(uri).connect();
const col = client.db(process.env.MONGODB_DB || "gmb").collection("profiles");
for (const r of rows) {
  await col.updateOne(
    { _id: r.id },
    {
      $setOnInsert: {
        title: r.title,
        names: JSON.parse(r.names),
        descriptions: JSON.parse(r.descriptions),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  console.log("copied:", r.title);
}
await client.close();
