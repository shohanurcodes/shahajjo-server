import type { Request, Response } from "express";
import { ObjectId, type Document } from "mongodb";
import { eventsCollection, joinsCollection } from "../db/mongo";
import { attendeeLookupStages, escapeRegex } from "../lib/aggregation";
import { HttpError } from "../lib/http-error";
import { toEventDTO } from "../lib/serialize";
import type { EventWithMeta } from "../types";
import { eventIdSchema, upcomingQuerySchema } from "../validators/event.schema";

export async function getUpcomingEvents(req: Request, res: Response): Promise<void> {
  const query = upcomingQuerySchema.parse(req.query);
  const events = await eventsCollection();

  const match: Document = { date: { $gte: new Date() } };

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

  const docs = await events.aggregate<EventWithMeta>(pipeline).toArray();

  res.json({
    events: docs.map((doc) => toEventDTO(doc, req.user)),
    count: docs.length,
  });
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  const id = eventIdSchema.parse(req.params.id);
  const eventId = new ObjectId(id);
  const events = await eventsCollection();

  const doc = await events
    .aggregate<EventWithMeta>([{ $match: { _id: eventId } }, ...attendeeLookupStages])
    .next();

  if (!doc) throw new HttpError(404, "Event not found.");

  if (req.user) {
    const joins = await joinsCollection();
    const join = await joins.findOne({ eventId, userEmail: req.user.email });
    doc.isJoined = Boolean(join);
    doc.joinedAt = join?.joinedAt;
  }

  res.json({ event: toEventDTO(doc, req.user) });
}
