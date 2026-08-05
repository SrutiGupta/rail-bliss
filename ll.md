Portal 1 — Passenger Portal
Register / Login (FR 1.1) → credential validation → error handling on wrong creds
Search trains by travel details (FR 1.2) → view available trains/seats
Enter passenger details → confirm booking → system generates PNR
(Implied from goals/interfaces, not explicit FRs, but you'll need them for a working app) → cancel ticket, check ticket status, pay via payment gateway
Portal 2 — Admin Portal
Manage Trains (FR 2.1): add trains, update schedules/seat availability, delete incorrect records
Manage Bookings (FR 2.2): view all bookings, monitor status/cancellations, resolve booking issues

Connection flow (from section 5.2 Events & Actions + 4.3/4.4 interfaces):
Passenger Portal                    Admin Portal
      |                                       |
      | login/register                  | login (implied, no FR given)
      v                                       v
   [Auth/Validation] <----shared DB----> [Auth/Validation]
      |                                  |
      v                                  v
 Search Trains -----> [Train DB] <----- Manage Trains (CRUD)
      |                                  |
      v                                  v
 Book Ticket ---> generates PNR ---> [Booking DB] <----- View/Manage Bookings
      |
      v
 Payment Gateway (external API, HTTPS)
      |
      v
 Booking confirmed / Status check / Cancellation

Both portals sit on top of the same backend + database (MySQL/Oracle per 4.3) — it's not two separate systems, just role-gated views into shared train and booking data. Communication layer is HTTP/HTTPS with real-time updates (4.4).
