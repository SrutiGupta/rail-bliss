import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { Train } from "../models/Train";
import { seatsAvailable, seatsBooked } from "../services/availability";
import { asyncHandler } from "../middleware/error";
import { AppError } from "../utils/errors";

const router = Router();

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function serializeTrain(t: InstanceType<typeof Train>, available?: number) {
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
    ...(typeof available === "number" ? { available } : {}),
  };
}

// GET /api/trains/stations
router.get(
  "/stations",
  asyncHandler(async (_req, res) => {
    const trains = await Train.find({}, { source: 1, destination: 1 }).lean();
    const set = new Set<string>();
    trains.forEach((t) => {
      set.add(t.source);
      set.add(t.destination);
    });
    res.json([...set].sort());
  }),
);

// GET /api/trains?from=&to=&date=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const date = typeof req.query.date === "string" && req.query.date ? req.query.date : todayISO();

    const filter: Record<string, unknown> = {};
    if (from) filter.source = from;
    if (to) filter.destination = to;

    const trains = await Train.find(filter).sort({ departureTime: 1 }).lean();

    const result = await Promise.all(
      trains.map(async (t) => {
        const booked = await seatsBooked(String(t._id), date);
        return serializeTrain(t as InstanceType<typeof Train>, Math.max(t.totalSeats - booked, 0));
      }),
    );

    res.json(result);
  }),
);

// GET /api/trains/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const trainId = String(id ?? "");
    if (!isValidObjectId(trainId)) throw new AppError("Train not found", 404);
    const train = await Train.findById(trainId).lean();
    if (!train) throw new AppError("Train not found", 404);
    res.json(serializeTrain(train as InstanceType<typeof Train>));
  }),
);

// GET /api/trains/:id/availability?date=
router.get(
  "/:id/availability",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const trainId = String(id ?? "");
    const date = typeof req.query.date === "string" && req.query.date ? req.query.date : todayISO();
    if (!isValidObjectId(trainId)) throw new AppError("Train not found", 404);
    const train = await Train.findById(trainId);
    if (!train) throw new AppError("Train not found", 404);
    const available = await seatsAvailable(trainId, date, train.totalSeats);
    res.json({ available });
  }),
);

export default router;