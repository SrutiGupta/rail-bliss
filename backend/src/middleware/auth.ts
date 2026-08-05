import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AppError } from "../utils/errors";

export interface AuthRequest extends Request {
  userId?: string;
  user?: InstanceType<typeof User>;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "rail-bliss-booking-dev-secret-change-me";

export function signToken(userId: string): string {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId }, JWT_SECRET, options);
}

// Requires a valid Bearer token and loads the fresh user doc (with roles).
export async function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header) throw new AppError("Not signed in", 401);
    if (!header.startsWith("Bearer ")) throw new AppError("Invalid authorization header", 401);
    const token = header.slice(7).trim();
    if (!token) throw new AppError("Missing token", 401);

    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    if (!payload.sub) throw new AppError("Invalid token", 401);

    const user = await User.findById(payload.sub);
    if (!user) throw new AppError("Account not found", 401);

    req.userId = String(user._id);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  const user = req.user;
  if (!user) return next(new AppError("Not signed in", 401));
  const isAdmin = user.roles?.some((r) => r.role === "admin");
  if (!isAdmin) return next(new AppError("Administrator access only", 403));
  next();
}