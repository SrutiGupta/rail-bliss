import { Router } from "express";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { Train } from "../models/Train";
import { Booking } from "../models/Booking";
import { requireAuth, requireAdmin, type AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { AppError } from "../utils/errors";

const router = Router();

router.use(requireAuth, requireAdmin);

const trainSchema = z.object({
  trainNumber: z.string().trim().min(1, "Train number is required"),
  trainName: z.string().trim().min(1, "Train name is required"),
  source: z.string().trim().min(1, "Source is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  arrivalTime: z.string().min(1, "Arrival time is required"),
  durationMinutes: z.coerce.number().int().min(0).default(0),
  totalSeats: z.coerce.number().int().min(0).default(100),
  fare: z.coerce.number().min(0).default(0),
  coachClass: z.string().trim().min(1, "Class is required").default("Sleeper"),
});

function serializeTrain(t: InstanceType<typeof Train>) {
  return {
    id: String(t._id),
    trainNumber: t.trainNumber,
    trainName: t.trainName,
    source: t.source,
    destination: t.destination,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    durationMinutes: t.durationMinutes,
    totalSeats: t.totalSeats,
    fare: t.fare,
    coachClass: t.coachClass,
    createdAt: t.createdAt,
  };
}

// GET /api/admin/trains
router.get(
  "/trains",
  asyncHandler(async (_req, res) => {
    const trains = await Train.find().sort({ trainNumber: 1 });
    res.json(trains.map(serializeTrain));
  }),
);

// POST /api/admin/trains
router.post(
  "/trains",
  asyncHandler(async (req, res) => {
    const parsed = trainSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0]!.message);
    const train = await Train.create(parsed.data);
    res.status(201).json(serializeTrain(train));
  }),
);

// PATCH /api/admin/trains/:id
router.patch(
  "/trains/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new AppError("Train not found", 404);

    const parsed = trainSchema.partial().safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0]!.message);

    const train = await Train.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
    if (!train) throw new AppError("Train not found", 404);
    res.json(serializeTrain(train));
  }),
);

// DELETE /api/admin/trains/:id
router.delete(
  "/trains/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new AppError("Train not found", 404);

    const hasBookings = await Booking.exists({ train: id });
    if (hasBookings) throw new AppError("Cannot delete a train that already has bookings", 409);

    await Train.findByIdAndDelete(id);
    res.status(204).end();
  }),
);

// GET /api/admin/bookings
router.get(
  "/bookings",
  asyncHandler(async (_req, res) => {
    const bookings = await Booking.find()
      .populate<{ train: { trainNumber: string; trainName: string } }>("train", "trainNumber trainName")
      .populate<{ user: { email: string; fullName: string } }>("user", "email fullName")
      .sort({ createdAt: -1 });

    res.json(
      bookings.map((b) => ({
        id: String(b._id),
        pnr: b.pnr,
        train: b.train,
        user: b.user,
        journeyDate: b.journeyDate,
        seatCount: b.seatCount,
        totalFare: b.totalFare,
        status: b.status,
        createdAt: b.createdAt,
      })),
    );
  }),
);

// PATCH /api/admin/bookings/:id/status
router.patch(
  "/bookings/:id/status",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new AppError("Booking not found", 404);

    const parsed = z
      .object({ status: z.enum(["CONFIRMED", "CANCELLED"]) })
      .safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid booking status", 400);

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: parsed.data.status },
      { new: true },
    );
    if (!booking) throw new AppError("Booking not found", 404);

    res.json({ id: String(booking._id), pnr: booking.pnr, status: booking.status });
  }),
);

export default router;