import { ObjectId } from "mongodb";
import type { EventWithMeta } from "../types";

type SeedEvent = {
  id: string;
  title: string;
  description: string;
  eventType: EventWithMeta["eventType"];
  thumbnail: string;
  location: string;
  daysFromNow: number;
};

const DEMO_HOST = {
  id: "seed-demo-host",
  email: "hello@sahajjo.org",
  name: "Sahajjo Demo Team",
};

/**
 * These are the public demo events used by the seed script. They let discovery
 * keep working when a deployment has not been given a reachable MongoDB URI.
 * No account, join or write operation uses this fallback.
 */
const DEMO_EVENTS: SeedEvent[] = [
  {
    id: "65b000000000000000000001",
    title: "Buriganga bank clean-up morning",
    description:
      "Join neighbours for a two-hour clean-up along the Buriganga bank near Babubazar. Gloves, sacks and drinking water will be provided. Wear closed shoes and bring a friend if you can.",
    eventType: "Cleanup",
    thumbnail:
      "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=1200&q=80",
    location: "Babubazar bridge ghat, Old Dhaka",
    daysFromNow: 5,
  },
  {
    id: "65b000000000000000000002",
    title: "Friday food packs for Mohammadpur",
    description:
      "We are packing 150 dry-food parcels for families in Mohammadpur. Volunteers will sort rice, lentils, oil and dates, then help with distribution. Come for one hour or stay for the whole morning.",
    eventType: "Food Drive",
    thumbnail:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
    location: "Mohammadpur Town Hall courtyard",
    daysFromNow: 9,
  },
  {
    id: "65b000000000000000000003",
    title: "Monsoon plantation at Dhanmondi lake",
    description:
      "Help us plant 60 native saplings around the Dhanmondi lake walking path. We will dig, mulch and water together, then label each tree with the volunteer who planted it. Tools and snacks provided.",
    eventType: "Plantation",
    thumbnail:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
    location: "Dhanmondi lake, road 8 entrance",
    daysFromNow: 16,
  },
  {
    id: "65b000000000000000000004",
    title: "Winter clothes sorting for Mirpur families",
    description:
      "A morning of sorting donated jackets, sweaters and blankets before the winter distribution. We need help checking sizes, folding, and packing family bundles. Tea and lunch will be shared.",
    eventType: "Winter Relief",
    thumbnail:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    location: "Mirpur 10 community centre",
    daysFromNow: 23,
  },
  {
    id: "65b000000000000000000005",
    title: "Plastic-free market awareness walk",
    description:
      "Walk through the local market with reusable bags and talk to shopkeepers about a plastic-free Friday. We will hand out 200 cloth bags and a simple checklist for cutting single-use plastic.",
    eventType: "Awareness",
    thumbnail:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80",
    location: "Karwan Bazar main entrance",
    daysFromNow: 30,
  },
  {
    id: "65b000000000000000000006",
    title: "Book donation drive for Kamalapur library",
    description:
      "Donate children's books, Bangla fiction and exam guides for the Kamalapur community library. Volunteers will sort donations, repair damaged covers and shelve the new collection.",
    eventType: "Donation",
    thumbnail:
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80",
    location: "Kamalapur community library",
    daysFromNow: 38,
  },
  {
    id: "65b000000000000000000007",
    title: "Uttara sector 7 tree care day",
    description:
      "Our summer saplings need mulch, watering and a little care. Join a small team for a morning of weeding, mulching and replacing supports. Bring a hat and a water bottle.",
    eventType: "Plantation",
    thumbnail:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80",
    location: "Uttara sector 7 park",
    daysFromNow: 47,
  },
  {
    id: "65b000000000000000000008",
    title: "Old Dhaka blanket distribution",
    description:
      "Distribute blankets and warm shawls to elderly residents in Old Dhaka. We will meet at the community centre, split into small teams and visit households identified by local volunteers.",
    eventType: "Winter Relief",
    thumbnail:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80",
    location: "Old Dhaka community centre, Nazira Bazar",
    daysFromNow: 61,
  },
];

function noonUtcAfter(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0),
  );
}

export function getFallbackEvents(): EventWithMeta[] {
  const now = new Date();

  return DEMO_EVENTS.map((event) => {
    const date = noonUtcAfter(event.daysFromNow);
    const createdAt = new Date(date.getTime() - 14 * 24 * 60 * 60 * 1000);

    return {
      _id: new ObjectId(event.id),
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      thumbnail: event.thumbnail,
      location: event.location,
      date,
      createdById: DEMO_HOST.id,
      createdByEmail: DEMO_HOST.email,
      createdByName: DEMO_HOST.name,
      createdAt,
      updatedAt: createdAt,
      attendeeCount: 0,
      attendees: [],
      isJoined: false,
      isOwner: false,
    };
  });
}
