import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { eventsCollection, joinsCollection } from "../db/mongo";
import { attendeeLookupStages } from "../lib/aggregation";
import { HttpError } from "../lib/http-error";
import { toEventDTO } from "../lib/serialize";
import type { EventWithMeta, JoinDoc } from "../types";
import { eventIdSchema } from "../validators/event.schema";

function currentUser(req: Request) {
  if (!req.user) throw new HttpError(401, "Please sign in to continue.");
  return req.user;
}

export async function joinEvent(req: Request, res: Response): Promise<void> {
  const id = eventIdSchema.parse(req.params.id);
  const user = currentUser(req);
  const eventId = new ObjectId(id);

  const events = await eventsCollection();
  const event = await events.findOne({ _id: eventId });
  if (!event) throw new HttpError(404, "Event not found.");

  if (event.date.getTime() <= Date.now()) {
    throw new HttpError(400, "This event has already taken place.");
  }

  const joins = await joinsCollection();
  const existing = await joins.findOne({ eventId, userEmail: user.email });
  if (existing) {
    throw new HttpError(409, "You have already joined this event.");
  }

  const join: JoinDoc = {
    _id: new ObjectId(),
    eventId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name ?? user.email,
    userImage: user.image,
    joinedAt: new Date(),
  };

  await joins.insertOne(join);
  const attendeeCount = await joins.countDocuments({ eventId });

  res.status(201).json({
    message: `You joined "${event.title}". See you there!`,
    joined: true,
    attendeeCount,
  });
}

export async function getJoinedEvents(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const joins = await joinsCollection();
  const events = await eventsCollection();

  const userJoins = await joins.find({ userEmail: user.email }).toArray();

  if (userJoins.length === 0) {
    res.json({ events: [], count: 0 });
    return;
  }

  const joinedById = new Map(
    userJoins.map((join) => [join.eventId.toString(), join.joinedAt]),
  );
  const eventIds = userJoins.map((join) => join.eventId);

  const docs = await events
    .aggregate<EventWithMeta>([
      { $match: { _id: { $in: eventIds } } },
      ...attendeeLookupStages,
      { $sort: { date: 1 } },
    ])
    .toArray();

  res.json({
    events: docs.map((doc) => {
      doc.isJoined = true;
      doc.joinedAt = joinedById.get(doc._id.toString());
      return toEventDTO(doc, user);
    }),
    count: docs.length,
  });
}

export async function getMyEvents(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const events = await eventsCollection();

  const docs = await events
    .aggregate<EventWithMeta>([
      {
        $match: {
          $or: [{ createdById: user.id }, { createdByEmail: user.email }],
        },
      },
      ...attendeeLookupStages,
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  res.json({
    events: docs.map((doc) => toEventDTO(doc, user)),
    count: docs.length,
  });
}

export async function getMyStats(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  const events = await eventsCollection();
  const joins = await joinsCollection();
  const now = new Date();

  const [created, joined, userJoins] = await Promise.all([
    events.countDocuments({ $or: [{ createdById: user.id }, { createdByEmail: user.email }] }),
    joins.countDocuments({ userEmail: user.email }),
    joins.find({ userEmail: user.email }).project({ eventId: 1 }).toArray(),
  ]);

  const joinedUpcoming = userJoins.length
    ? await events.countDocuments({
        _id: { $in: userJoins.map((join) => join.eventId) },
        date: { $gte: now },
      })
    : 0;

  res.json({
    stats: {
      eventsCreated: created,
      eventsJoined: joined,
      upcomingJoined: joinedUpcoming,
    },
  });
}
