import type { Document } from "mongodb";

/**
 * Adds attendee count and a small attendee preview to an event aggregation.
 * Assumes the events collection has already been filtered as needed.
 */
export const attendeeLookupStages: Document[] = [
  {
    $lookup: {
      from: "eventJoins",
      localField: "_id",
      foreignField: "eventId",
      as: "joins",
    },
  },
  {
    $addFields: {
      attendeeCount: { $size: "$joins" },
      attendees: {
        $map: {
          input: { $slice: ["$joins", 5] },
          as: "join",
          in: { name: "$$join.userName", image: "$$join.userImage" },
        },
      },
    },
  },
  { $project: { joins: 0 } },
];

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
