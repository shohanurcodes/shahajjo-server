import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "../controllers/events.controller";
import {
  getEventById,
  getUpcomingEvents,
} from "../controllers/discovery.controller";
import {
  getJoinedEvents,
  getMyEvents,
  getMyStats,
  joinEvent,
} from "../controllers/joins.controller";
import { optionalAuth, requireAuth } from "../middleware/auth";

export const eventsRouter = Router();

// Public discovery
eventsRouter.get("/upcoming", optionalAuth, getUpcomingEvents);
// "mine" must be declared before "/:id" so it is not treated as an id.
eventsRouter.get("/mine", requireAuth, getMyEvents);
eventsRouter.get("/:id", optionalAuth, getEventById);

// Owner actions
eventsRouter.post("/", requireAuth, createEvent);
eventsRouter.patch("/:id", requireAuth, updateEvent);
eventsRouter.delete("/:id", requireAuth, deleteEvent);

// Attendee actions
eventsRouter.post("/:id/join", requireAuth, joinEvent);

export const meRouter = Router();
meRouter.get("/joined-events", requireAuth, getJoinedEvents);
meRouter.get("/me/stats", requireAuth, getMyStats);
