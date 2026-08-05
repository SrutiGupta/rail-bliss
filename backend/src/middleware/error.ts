import type { Request, Response, NextFunction } from "express";
import { MongoServerError } from "mongodb";
import { AppError } from "../utils/errors";

// Wraps async route handlers so thrown errors reach the error middleware.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    const key = Object.keys(err.keyValue ?? {})[0] ?? "record";
    res.status(409).json({ error: `That ${key} is already in use` });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end" });
}