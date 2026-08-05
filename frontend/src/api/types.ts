export type Role = "admin" | "passenger";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  roles: Role[];
}

export interface Train {
  id: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  totalSeats: number;
  fare: number;
  coachClass: string;
  available?: number;
}

export interface Passenger {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
}

export interface Booking {
  id: string;
  pnr: string;
  trainId: string;
  journeyDate: string;
  passengers: Passenger[];
  seatCount: number;
  totalFare: number;
  contactEmail: string | null;
  contactPhone: string | null;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
  train?: {
    trainNumber: string;
    trainName: string;
    source: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
  };
  user?: { email: string; fullName: string };
}

export interface PnrStatus {
  pnr: string;
  status: "CONFIRMED" | "CANCELLED";
  journeyDate: string;
  seatCount: number;
  totalFare: number;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
}

export interface AdminBooking extends Booking {
  user?: { email: string; fullName: string };
}
