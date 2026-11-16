import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { eventsCollection, joinsCollection } from "../db/mongo";
import { HttpError } from "../lib/http-error";
import { normalizeEventDate, toEventDTO } from "../lib/serialize";
import type { EventDoc, EventType } from "../types";
import { createEventSchema, eventIdSchema, updateEventSchema } from "../validators/event.schema";

function assertOwner(event: EventDoc, user: NonNullable<Request["user"]>): void {
  const isOwner = event.createdById === user.id || event.createdByEmail === user.email;
  if (!isOwner) {
    throw new HttpError(403, "You can only manage events that you created.");
  }
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  const input = createEventSchema.parse(req.body);
  const user = req.user;
  if (!user) throw new HttpError(401, "Please sign in to continue.");

  const events = await eventsCollection();
  const now = new Date();

  const event: EventDoc = {
    _id: new ObjectId(),
    title: input.title,
    description: input.description,
    eventType: input.eventType as EventType,
    thumbnail: input.thumbnail,
    location: input.location,
    date: normalizeEventDate(input.date),
    createdById: user.id,
    createdByEmail: user.email,
    createdByName: user.name ?? user.email,
    createdAt: now,
    updatedAt: now,
  };

  const result = await events.insertOne(event);
  const created = await events.findOne({ _id: result.insertedId });

  res.status(201).json({
    message: "Event created successfully.",
    event: created ? toEventDTO(created, user) : null,
  });
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  const id = eventIdSchema.parse(req.params.id);
  const input = updateEventSchema.parse(req.body);
  const user = req.user;
  if (!user) throw new HttpError(401, "Please sign in to continue.");

  const events = await eventsCollection();
  const existing = await events.findOne({ _id: new ObjectId(id) });
  if (!existing) throw new HttpError(404, "Event not found.");
  assertOwner(existing, user);

  await events.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        title: input.title,
        description: input.description,
        eventType: input.eventType as EventType,
        thumbnail: input.thumbnail,
        location: input.location,
        date: normalizeEventDate(input.date),
        updatedAt: new Date(),
      },
    },
  );

  const updated = await events.findOne({ _id: new ObjectId(id) });
  res.json({
    message: "Event updated successfully.",
    event: updated ? toEventDTO(updated, user) : null,
  });
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const id = eventIdSchema.parse(req.params.id);
  const user = req.user;
  if (!user) throw new HttpError(401, "Please sign in to continue.");

  const events = await eventsCollection();
  const existing = await events.findOne({ _id: new ObjectId(id) });
  if (!existing) throw new HttpError(404, "Event not found.");
  assertOwner(existing, user);

  const joins = await joinsCollection();
  await Promise.all([
    joins.deleteMany({ eventId: new ObjectId(id) }),
    events.deleteOne({ _id: new ObjectId(id) }),
  ]);

  res.json({ message: "Event deleted successfully." });
}
