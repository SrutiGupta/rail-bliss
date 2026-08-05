import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db";
import { Train } from "./models/Train";
import { User } from "./models/User";
import { Booking } from "./models/Booking";

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/rail_bliss_booking";

const seedTrains = [
  ["12301", "Howrah Rajdhani Express", "Howrah", "New Delhi", "16:50", "10:00", 1030, 120, 2450.0, "AC 3 Tier"],
  ["12259", "Sealdah Duronto Express", "Sealdah", "New Delhi", "20:05", "12:30", 985, 110, 2280.0, "AC 3 Tier"],
  ["12841", "Coromandel Express", "Howrah", "Chennai", "14:30", "17:00", 1590, 150, 1350.0, "Sleeper"],
  ["12809", "Howrah Mumbai Mail", "Howrah", "Mumbai CSMT", "20:15", "04:30", 1935, 160, 1180.0, "Sleeper"],
  ["13007", "Udyan Abha Toofan Express", "Howrah", "Varanasi", "07:20", "23:45", 985, 180, 640.0, "Sleeper"],
  ["12019", "Howrah Ranchi Shatabdi", "Howrah", "Ranchi", "06:05", "13:15", 430, 90, 1090.0, "AC Chair Car"],
  ["12303", "Poorva Express", "Howrah", "New Delhi", "08:15", "09:55", 1540, 140, 1420.0, "Sleeper"],
  ["22308", "Bhubaneswar Superfast", "Howrah", "Bhubaneswar", "22:35", "05:40", 425, 130, 760.0, "AC 3 Tier"],
  ["12345", "Saraighat Express", "Howrah", "Guwahati", "15:50", "09:30", 1060, 150, 1260.0, "Sleeper"],
  ["12987", "Sealdah Ajmer Express", "Sealdah", "Ajmer", "23:10", "08:20", 1870, 140, 1560.0, "Sleeper"],
  ["12313", "Sealdah Rajdhani", "Sealdah", "New Delhi", "16:50", "10:10", 1040, 120, 2510.0, "AC 2 Tier"],
  ["18183", "Tatanagar Express", "Danapur", "Tatanagar", "06:40", "18:05", 685, 170, 410.0, "Sleeper"],
] as const;

async function seed() {
  await connectDB(MONGODB_URI);

  const sessions = await mongoose.connection.db!.admin().command({ ping: 1 });
  if (!sessions.ok) throw new Error("MongoDB ping failed");

  // Reset bookings so availability starts fresh.
  await Booking.deleteMany({});

  // Reset trains and re-seed the timetable from the original migration.
  await Train.deleteMany({});
  const docs = seedTrains.map(
    ([trainNumber, trainName, source, destination, departureTime, arrivalTime, durationMinutes, totalSeats, fare, coachClass]) => ({
      trainNumber,
      trainName,
      source,
      destination,
      departureTime,
      arrivalTime,
      durationMinutes,
      totalSeats,
      fare,
      coachClass,
    }),
  );
  await Train.insertMany(docs);
  console.log(`[seed] inserted ${docs.length} trains`);

  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);

  const admin = await User.findOne({ email: "admin@railyatra.dev" });
  if (!admin) {
    await User.create({
      email: "admin@railyatra.dev",
      passwordHash: await bcrypt.hash("admin123", rounds),
      fullName: "System Administrator",
      phone: null,
      roles: [{ role: "admin" }, { role: "passenger" }],
    });
    console.log("[seed] created admin user (admin@railyatra.dev / admin123)");
  }

  const passenger = await User.findOne({ email: "passenger@railyatra.dev" });
  if (!passenger) {
    await User.create({
      email: "passenger@railyatra.dev",
      passwordHash: await bcrypt.hash("password123", rounds),
      fullName: "Demo Passenger",
      phone: null,
      roles: [{ role: "passenger" }],
    });
    console.log("[seed] created demo passenger (passenger@railyatra.dev / password123)");
  }

  await mongoose.disconnect();
  console.log("[seed] done");
}

seed().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});