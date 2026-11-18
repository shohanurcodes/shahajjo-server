import type { Request, Response } from "express";
import { ObjectId, type Document } from "mongodb";
import { eventsCollection, joinsCollection } from "../db/mongo";
import { attendeeLookupStages, escapeRegex } from "../lib/aggregation";
import { getFallbackEvents } from "../lib/fallback-events";
import { HttpError } from "../lib/http-error";
import { toEventDTO } from "../lib/serialize";
import type { EventWithMeta } from "../types";
import { eventIdSchema, upcomingQuerySchema } from "../validators/event.schema";

export async function getUpcomingEvents(req: Request, res: Response): Promise<void> {
  const query = upcomingQuerySchema.parse(req.query);

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const match: Document = { date: { $gte: startOfToday } };

  if (query.type) {
    match.eventType = query.type;
  }

  if (query.q) {
    const term = new RegExp(escapeRegex(query.q), "i");
    match.$or = [{ title: term }, { location: term }, { eventType: term }];
  }

  const pipeline: Document[] = [
    { $match: match },
    ...attendeeLookupStages,
    { $sort: { date: 1, createdAt: -1 } },
  ];

  if (query.limit) {
    pipeline.push({ $limit: query.limit });
  }

  let docs: EventWithMeta[];

  try {
    const events = await eventsCollection();
    docs = await events.aggregate<EventWithMeta>(pipeline).toArray();
  } catch {
    console.error("Database unavailable; serving public fallback events.");
    const term = query.q ? new RegExp(escapeRegex(query.q), "i") : null;

    docs = getFallbackEvents()
      .filter(
        (event) =>
          event.date >= startOfToday &&
          (!query.type || event.eventType === query.type) &&
          (!term ||
            term.test(event.title) ||
            term.test(event.location) ||
            term.test(event.eventType)),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (query.limit) {
      docs = docs.slice(0, query.limit);
    }
  }

  res.json({
    events: docs.map((doc) => toEventDTO(doc, req.user)),
    count: docs.length,
  });
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  const id = eventIdSchema.parse(req.params.id);
  const eventId = new ObjectId(id);

  let doc: EventWithMeta | null | undefined;

  try {
    const events = await eventsCollection();
    doc = await events
      .aggregate<EventWithMeta>([{ $match: { _id: eventId } }, ...attendeeLookupStages])
      .next();
  } catch {
    console.error("Database unavailable; looking up a fallback event.");
    doc = getFallbackEvents().find((event) => event._id.equals(eventId));
  }

  if (!doc) throw new HttpError(404, "Event not found.");

  if (req.user) {
    const joins = await joinsCollection();
    const join = await joins.findOne({ eventId, userEmail: req.user.email });
    doc.isJoined = Boolean(join);
    doc.joinedAt = join?.joinedAt;
  }

  res.json({ event: toEventDTO(doc, req.user) });
}
