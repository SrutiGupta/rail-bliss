import { Types } from "mongoose";
import { Booking } from "../models/Booking";

/**
 * Total seats already booked (CONFIRMED) for a train on a journey date.
 */
export async function seatsBooked(
  trainId: string,
  date: string,
): Promise<number> {
  const result = await Booking.aggregate<{ total: number }>([
    {
      $match: {
        train: new Types.ObjectId(trainId),
        journeyDate: date,
        status: "CONFIRMED",
      },
    },
    { $group: { _id: null, total: { $sum: "$seatCount" } } },
  ]);
  return result[0]?.total ?? 0;
}

/** Number of seats still available on a train for a date. */
export async function seatsAvailable(
  trainId: string,
  date: string,
  totalSeats: number,
): Promise<number> {
  const booked = await seatsBooked(trainId, date);
  return Math.max(totalSeats - booked, 0);
}