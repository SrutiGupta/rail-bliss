import { Schema, model, type InferSchemaType } from "mongoose";

const trainSchema = new Schema(
  {
    trainNumber: { type: String, required: true, unique: true, trim: true },
    trainName: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true, default: 0, min: 0 },
    totalSeats: { type: Number, required: true, default: 100, min: 0 },
    fare: { type: Number, required: true, default: 0, min: 0 },
    coachClass: { type: String, required: true, default: "Sleeper", trim: true },
  },
  { timestamps: true },
);

trainSchema.index({ source: 1, destination: 1 });

export type TrainDoc = InferSchemaType<typeof trainSchema>;

export const Train = model("Train", trainSchema);
