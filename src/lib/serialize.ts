import type { AuthUser, EventWithMeta } from "../types";

/** Event dates are date-only in the UI, so they are pinned to noon UTC. */
export function normalizeEventDate(value: Date): Date {
  const parsed = new Date(value);
  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0, 0),
  );
}

export function toEventDTO(doc: EventWithMeta, viewer?: AuthUser) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    eventType: doc.eventType,
    thumbnail: doc.thumbnail,
    location: doc.location,
    date: doc.date.toISOString(),
    createdById: doc.createdById,
    createdByEmail: doc.createdByEmail,
    createdByName: doc.createdByName,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    attendeeCount: doc.attendeeCount ?? 0,
    attendees: doc.attendees ?? [],
    isJoined: doc.isJoined ?? false,
    isOwner: viewer
      ? doc.createdById === viewer.id || doc.createdByEmail === viewer.email
      : false,
    joinedAt: doc.joinedAt ? new Date(doc.joinedAt).toISOString() : null,
  };
}
