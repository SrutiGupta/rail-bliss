import { Router } from "express";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { Booking } from "../models/Booking";
import { Train } from "../models/Train";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { AppError } from "../utils/errors";
import { generatePNR } from "../services/pnr";
import { seatsAvailable } from "../services/availability";
import { chargePayment } from "../services/payments";

const router = Router();

const passengerSchema = z.object({
  name: z.string().trim().min(2, "Passenger name is too short").max(100),
  age: z.coerce.number().int().min(1, "Enter a valid age").max(120),
  gender: z.enum(["Male", "Female", "Other"]),
});

const createBookingSchema = z.object({
  trainId: z.string().min(1, "Train is required"),
  journeyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid journey date"),
  passengers: z.array(passengerSchema).min(1, "Add at least one passenger").max(6),
  contactPhone: z.string().trim().max(20).optional().or(z.literal("")),
});

async function uniquePNR(): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const candidate = generatePNR();
    const exists = await Booking.exists({ pnr: candidate });
    if (!exists) return candidate;
  }
  throw new AppError("Could not generate a unique PNR, please retry", 500);
}

function serializeBooking(b: Record<string, unknown>) {
  return {
    id: String(b._id),
    pnr: b.pnr,
    trainId: String((b.train as { _id: unknown })._id ?? b.trainId),
    journeyDate: b.journeyDate,
    passengers: b.passengers,
    seatCount: b.seatCount,
    totalFare: b.totalFare,
    contactEmail: b.contactEmail ?? null,
    contactPhone: b.contactPhone ?? null,
    status: b.status,
    createdAt: b.createdAt,
  };
}

// POST /api/bookings — validates availability, runs the payment gateway, issues a PNR.
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0]!.message);
    const { trainId, journeyDate, passengers, contactPhone } = parsed.data;
    if (!isValidObjectId(trainId)) throw new AppError("Train not found", 404);

    const train = await Train.findById(trainId);
    if (!train) throw new AppError("Train not found", 404);

    const available = await seatsAvailable(trainId, journeyDate, train.totalSeats);
    if (available < passengers.length)
      throw new AppError("Not enough seats available on this date", 409);

    const seatCount = passengers.length;
    const totalFare = Math.round(train.fare * seatCount * 100) / 100;

    const payment = await chargePayment({
      amount: totalFare,
      currency: "INR",
      description: `${train.trainNumber} · ${train.trainName} · ${seatCount} seat(s) · ${journeyDate}`,
      referenceId: `${trainId}-${journeyDate}-${Date.now()}`,
    });
    if (payment.status !== "SUCCESS")
      throw new AppError("Payment could not be completed. Please try again.", 402);

    const pnr = await uniquePNR();
    const booking = await Booking.create({
      pnr,
      user: req.userId!,
      train: trainId,
      journeyDate,
      passengers,
      seatCount,
      totalFare,
      contactEmail: req.user!.email,
      contactPhone: contactPhone || null,
      status: "CONFIRMED",
    });

    res.status(201).json({ pnr, booking: serializeBooking(booking.toObject()) });
  }),
);

// GET /api/bookings — current user's bookings, newest first.
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const bookings = await Booking.find({ user: req.userId })
      .populate<{ train: { trainNumber: string; trainName: string; source: string; destination: string; departureTime: string; arrivalTime: string } }>(
        "train",
        "trainNumber trainName source destination departureTime arrivalTime",
      )
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      bookings.map((b) => ({
        ...serializeBooking(b as unknown as Record<string, unknown>),
        train: b.train,
      })),
    );
  }),
);

// POST /api/bookings/:id/cancel
router.post(
  "/:id/cancel",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new AppError("Booking not found", 404);

    const booking = await Booking.findOne({ _id: id, user: req.userId });
    if (!booking) throw new AppError("Booking not found", 404);
    if (booking.status !== "CONFIRMED")
      throw new AppError("Only confirmed tickets can be cancelled", 409);

    booking.status = "CANCELLED";
    await booking.save();

    res.json({
      id: String(booking._id),
      pnr: booking.pnr,
      status: booking.status,
      message: "Ticket cancelled and seats released",
    });
  }),
);

export default router;