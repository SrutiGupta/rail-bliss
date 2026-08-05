import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const passengerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    pnr: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    train: { type: Schema.Types.ObjectId, ref: "Train", required: true },
    journeyDate: { type: String, required: true },
    passengers: { type: [passengerSchema], default: [] },
    seatCount: { type: Number, required: true, default: 1, min: 1 },
    totalFare: { type: Number, required: true, default: 0, min: 0 },
    contactEmail: { type: String, default: null },
    contactPhone: { type: String, maxlength: 20, default: null },
    status: { type: String, enum: ["CONFIRMED", "CANCELLED"], default: "CONFIRMED" },
  },
  { timestamps: true },
);

bookingSchema.index({ train: 1, journeyDate: 1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema>;
export interface BookingWithId extends BookingDoc {
  _id: Types.ObjectId;
}

export const Booking = model("Booking", bookingSchema);
