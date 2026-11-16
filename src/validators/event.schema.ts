import { z } from "zod";
import { EVENT_TYPES } from "../types";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "That event identifier is not valid.");

const eventShape = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(100, "Title cannot be longer than 100 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters.")
    .max(2000, "Description cannot be longer than 2000 characters."),
  eventType: z.enum(EVENT_TYPES, "Choose a valid event type."),
  thumbnail: z
    .url("Thumbnail must be a valid image URL.")
    .max(2000, "Thumbnail URL is too long."),
  location: z
    .string()
    .trim()
    .min(5, "Location must be at least 5 characters.")
    .max(120, "Location cannot be longer than 120 characters."),
  date: z.coerce.date("Choose a valid event date."),
});

const isFuture = (value: { date: Date }) => value.date.getTime() > Date.now();

export const createEventSchema = eventShape.refine(isFuture, {
  path: ["date"],
  message: "Event date must be in the future.",
});

export const updateEventSchema = eventShape.refine(isFuture, {
  path: ["date"],
  message: "Event date must be in the future.",
});

export const upcomingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  type: z.enum(EVENT_TYPES).optional(),
  q: z.string().trim().max(80).optional(),
});

export const eventIdSchema = objectIdSchema;
