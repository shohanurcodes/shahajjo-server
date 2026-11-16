import "dotenv/config";
import { MongoClient } from "mongodb";

interface SeedEvent {
  title: string;
  description: string;
  eventType: string;
  thumbnail: string;
  location: string;
  daysFromNow: number;
}

const SENDER = {
  id: "seed-demo-host",
  email: "hello@sahajjo.org",
  name: "Sahajjo Demo Team",
};

const events: SeedEvent[] = [
  {
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

async function main() {
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
  const dbName = process.env.DB_NAME ?? "sahajjo";
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });

  await client.connect();
  const eventsCollection = client.db(dbName).collection("events");

  const now = new Date();
  let seeded = 0;

  for (const event of events) {
    await eventsCollection.updateOne(
      { title: event.title, createdById: SENDER.id },
      {
        $set: {
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          thumbnail: event.thumbnail,
          location: event.location,
          date: noonUtcAfter(event.daysFromNow),
          createdById: SENDER.id,
          createdByEmail: SENDER.email,
          createdByName: SENDER.name,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    seeded += 1;
  }

  console.log(`Seeded ${seeded} demo events into ${dbName}.events.`);
  await client.close();
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
