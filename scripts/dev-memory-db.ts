import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Local-only helper for end-to-end testing without an Atlas account.
 * Starts an in-memory MongoDB on the default port so both the Next.js app and
 * the Express API can use their default mongodb://127.0.0.1:27017 connection.
 */
async function main() {
  const server = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: "sahajjo",
    },
  });

  console.log(`In-memory MongoDB ready at ${server.getUri()}`);
  console.log("Press Ctrl+C to stop. Data is discarded when this process exits.");

  const stop = async () => {
    await server.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());

  // Keep the process alive while the two apps use the database.
  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Could not start the in-memory MongoDB:", error);
  process.exit(1);
});
