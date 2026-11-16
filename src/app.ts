import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { clientOrigins, env } from "./config/env";
import { HttpError } from "./lib/http-error";
import { errorHandler } from "./middleware/error";
import { eventsRouter, meRouter } from "./routes";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (curl, health checks) are allowed.
      if (!origin || clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new HttpError(403, "This origin is not allowed to call the API."));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);
app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down and try again shortly." },
});
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sahajjo-api",
    environment: env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

app.use("/api/events", eventsRouter);
app.use("/api", meRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "That API route does not exist." });
});

app.use(errorHandler);
