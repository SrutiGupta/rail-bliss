import { Router } from "express";
import { Booking } from "../models/Booking";
import { asyncHandler } from "../middleware/error";
import { AppError } from "../utils/errors";

const router = Router();

// GET /api/pnr/:pnr
router.get(
  "/:pnr",
  asyncHandler(async (req, res) => {
    const pnr = String(req.params.pnr ?? "");
    if (!/^\d{10}$/.test(pnr)) throw new AppError("Enter a valid 10-digit PNR number", 400);

    const booking = await Booking.findOne({ pnr })
      .populate<{ train: { trainNumber: string; trainName: string; source: string; destination: string; departureTime: string; arrivalTime: string } }>(
        "train",
        "trainNumber trainName source destination departureTime arrivalTime",
      )
      .lean();

    if (!booking || !booking.train) throw new AppError("No ticket found for this PNR", 404);

    res.json({
      pnr: booking.pnr,
      status: booking.status,
      journeyDate: booking.journeyDate,
      seatCount: booking.seatCount,
      totalFare: booking.totalFare,
      trainNumber: booking.train.trainNumber,
      trainName: booking.train.trainName,
      source: booking.train.source,
      destination: booking.train.destination,
      departureTime: booking.train.departureTime,
      arrivalTime: booking.train.arrivalTime,
    });
  }),
);

export default router;