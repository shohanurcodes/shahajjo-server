import { MongoClient, type Collection, type Db } from "mongodb";
import { env } from "../config/env";
import type { EventDoc, JoinDoc } from "../types";

let client: MongoClient | null = null;
let dbPromise: Promise<Db> | null = null;

async function connect(): Promise<Db> {
  const mongoClient = new MongoClient(env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
  });

  await mongoClient.connect();
  const db = mongoClient.db(env.DB_NAME);

  await ensureIndexes(db);

  client = mongoClient;
  return db;
}

async function ensureIndexes(db: Db): Promise<void> {
  await db.collection("events").createIndexes([
    { key: { date: 1 }, name: "events_date" },
    { key: { createdByEmail: 1 }, name: "events_creator_email" },
    { key: { createdById: 1 }, name: "events_creator_id" },
  ]);

  await db.collection("eventJoins").createIndexes([
    {
      key: { eventId: 1, userEmail: 1 },
      name: "unique_event_attendee",
      unique: true,
    },
    { key: { userEmail: 1 }, name: "joins_user_email" },
    { key: { eventId: 1 }, name: "joins_event" },
  ]);
}

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = connect().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

export async function eventsCollection(): Promise<Collection<EventDoc>> {
  return (await getDb()).collection<EventDoc>("events");
}

export async function joinsCollection(): Promise<Collection<JoinDoc>> {
  return (await getDb()).collection<JoinDoc>("eventJoins");
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
  dbPromise = null;
}
