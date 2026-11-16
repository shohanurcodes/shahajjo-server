import { app } from "./app";
import { env } from "./config/env";
import { closeDb } from "./db/mongo";

const server = app.listen(env.PORT, () => {
  console.log(`Sahajjo API running at http://localhost:${env.PORT}`);
  console.log(`Allowed browser origins: ${env.CLIENT_ORIGINS}`);
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, closing the API...`);

  const forceExit = setTimeout(() => {
    console.error("Forcing shutdown after timeout.");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
