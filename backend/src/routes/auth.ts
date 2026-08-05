import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User";
import { requireAuth, signToken, type AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { AppError } from "../utils/errors";

const router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const registerSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

function serializeUser(user: InstanceType<typeof User>) {
  return {
    id: String(user._id),
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    roles: (user.roles ?? []).map((r) => r.role),
  };
}

// POST /api/auth/register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0]!.message);

    const { email, password, fullName, phone } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError("An account with this email already exists", 409);

    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 10));
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      phone: phone || null,
      roles: [{ role: "passenger" }],
    });

    const token = signToken(String(user._id));
    res.status(201).json({ token, user: serializeUser(user) });
  }),
);

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0]!.message);

    const { email, password } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new AppError("Invalid email or password", 401);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError("Invalid email or password", 401);

    const token = signToken(String(user._id));
    res.json({ token, user: serializeUser(user) });
  }),
);

// POST /api/auth/google
router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const parsed = z.object({ credential: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) throw new AppError("Google credential is required", 400);

    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new AppError("Google account has no email", 400);

    const email = payload.email.toLowerCase();
    const fullName = payload.name ?? email.split("@")[0]!;
    const picture = payload.picture ?? null;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
        fullName,
        phone: null,
        roles: [{ role: "passenger" }],
        avatar: picture,
      });
    }

    const token = signToken(String(user._id));
    res.json({ token, user: serializeUser(user) });
  }),
);

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    res.json({ user: serializeUser(req.user!) });
  }),
);

export default router;