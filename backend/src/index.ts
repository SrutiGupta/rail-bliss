import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { errorHandler, notFound } from "./middleware/error";

import authRoutes from "./routes/auth";
import trainRoutes from "./routes/trains";
import pnrRoutes from "./routes/pnr";
import bookingRoutes from "./routes/bookings";
import paymentRoutes from "./routes/payments";
import adminRoutes from "./routes/admin";

const PORT = Number(process.env.PORT ?? 4000);
const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/rail_bliss_booking";

async function main() {
  await connectDB(MONGODB_URI);

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRoutes);
  app.use("/api/trains", trainRoutes);
  app.use("/api/pnr", pnrRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`[server] RailYatra API listening on http://localhost:${PORT}/api`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start", err);
  process.exit(1);
});