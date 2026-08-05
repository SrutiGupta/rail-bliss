import type { Response } from "express";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export function sendError(res: Response, statusCode: number, message: string) {
  return res.status(statusCode).json({ error: message });
}
