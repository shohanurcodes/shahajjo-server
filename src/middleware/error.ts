import type { ErrorRequestHandler } from "express";
import { MongoServerError } from "mongodb";
import { ZodError } from "zod";
import { env } from "../config/env";
import { HttpError } from "../lib/http-error";

function zodFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message, errors: error.errors });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Please check the highlighted fields and try again.",
      errors: zodFieldErrors(error),
    });
    return;
  }

  if (error instanceof MongoServerError && error.code === 11000) {
    res.status(409).json({ message: "You have already joined this event." });
    return;
  }

  console.error("Unhandled API error:", error);
  res.status(500).json({
    message: "Something went wrong on our side. Please try again.",
    ...(env.NODE_ENV === "development" && error instanceof Error ? { detail: error.message } : {}),
  });
};
