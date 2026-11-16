import type { ObjectId } from "mongodb";

export const EVENT_TYPES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Winter Relief",
  "Food Drive",
  "Awareness",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface EventDoc {
  _id: ObjectId;
  title: string;
  description: string;
  eventType: EventType;
  thumbnail: string;
  location: string;
  /** Stored at 12:00 UTC on the selected day so date-only events do not expire early. */
  date: Date;
  createdById: string;
  createdByEmail: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JoinDoc {
  _id: ObjectId;
  eventId: ObjectId;
  userId: string;
  userEmail: string;
  userName: string;
  userImage?: string;
  joinedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface AttendeeSummary {
  name: string;
  image?: string;
}

export interface EventWithMeta extends EventDoc {
  attendeeCount?: number;
  attendees?: AttendeeSummary[];
  isJoined?: boolean;
  isOwner?: boolean;
  joinedAt?: Date;
}
