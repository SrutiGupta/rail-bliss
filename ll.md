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
========================================
UNIVERSITY INSTITUTE OF TECHNOLOGY, THE
UNIVERSITY OF BURDWAN
PAPER CODE: PCC-IT 651
OBJECTIVE: RAILWAY TICKET BOOKING SYSTEM
(SOFTWARE REQUIREMENTS SPECIFICATION
DOCUMENT)
SUBJECT NAME: SOFTWARE ENGINEERING LAB
DATE OF SUBMISSION: 07/04/2026
TEAM MEMBERS:
1.Anushree Guin (2023-3054)
2.Rajnish Kumar (2023-3055)
3.Sruti Gupta (2023-3057)
4.Shreya Biswas (2023-3058)
RAILWAY TICKET BOOKING SYSTEM
(SOFTWARE REQUIREMENTS SPECIFICATION
DOCUMENT)
THIS IS BEING PRESENTED BY 6
TH SEMESTER STUDENTS
OF INFORMATION TECHNOLOGY DEPARTMENT
1. Anushree Guin (2023-3054)
2. Rajnish Kumar (2023-3055)
3. Sruti Gupta (2023-3057)
4. Shreya Biswas (2023-3058)
UNDER THE GUIDANCE OF:
MR. DIBYADEEP NANDI SIR
UNIVERSITY INSTITUTE OF TECHNOLOGY, BURDWAN
UNIVERSITY INFORMATION TECHNOLOGY
INDEX
Page
 1. INTRODUCTION
1.1. PURPOSE 01
1.2. OVERVIEW 01
1.3. ENVIRONMENTAL CHARACTERISTICS
1.3.1 HARDWARE 02
1.3.2 PERIFERALS 02
1.3.3 PEOPLE 02-03
2. GOALS OF IMPLEMENTATION 03-04
3. FUNCTIONAL REQUIREMENTS
3.1. USER CLASS 1 04
3.1.1. FUNCTIONAL REQUIREMENT 1:1
3.1.2. FUNCTIONAL REQUIREMENT 1:2
3.2. USER CLASS 2 05
3.2.1. FUNCTIONAL REQUIREMENT 2:1
3.2.2. FUNCTIONAL REQUIREMENT 2:2
4. NON-FUNCTIONAL REQUIREMENTS
4.1. EXTERNAL INTERFACES 06
4.2. USER INTERFACES 06
4.3. SOFTWARE INTERFACES 06
4.4. COMMUNICATION INTERFACES 07
5. BEHAVIORAL DESCRIPTION
5.1. SYSTEM 08
5.2. EVENTS AND ACTION 08-09
1.INTRODUCTION
1.1. Purpose
The purpose of this document is to describe the requirements of the
Railway Ticket Booking System. It explains how the system will function
and what features it will provide. This document helps developers
understand system design clearly. It also acts as a reference for testing
and maintenance. The goal is to ensure correct and efficient system
development.
Points:
● Define system requirements
● Guide developers
● Support testing process
● Provide clear documentation
● Help future maintenance
1.2. Overview
The system is an online platform that allows users to book railway tickets
easily. It provides features like train search, ticket booking, cancellation,
and status checking. It reduces manual effort and long queues. The
system ensures faster and more accurate processing. It improves overall
user convenience.
● Online booking system
● Train search facility
● Ticket management
● Reduces manual work
● Improves efficiency
1
1.3. Environmental Characteristics
1.3.1. Hardware
The system requires a basic computer or laptop to operate. It should
have minimum 4GB RAM for smooth functioning. A stable internet
connection is necessary. The system does not require high-end
hardware. It can run on standard devices.
● Computer/Laptop
● Minimum 4GB RAM
● Internet connection
● Basic processor
● Storage for data
1.3.2. Peripherals
The system requires a basic computer or laptop to operate. It should
have minimum 4GB RAM for smooth functioning. A stable internet
connection is necessary. The system does not require high-end
hardware. It can run on standard devices.
● Computer/Laptop
● Minimum 4GB RAM
● Internet connection
● Basic processor
● Storage for data
1.3.3. People
Different users interact with the system. Passengers use it to book
tickets. Admin manages trains and bookings. System administrators
maintain the system. Users should have basic computer knowledge.
Proper roles ensure smooth operation.
2
● Passengers
● Admin
● System administrator
● Basic computer users
● Authorized users
2. Goals of Implementation
2.1. Functional Goals
● Define the main operations like booking, cancellation, and status
checking
● Ensure the system performs all required tasks correctly
2.2. Performance Goals
● System should respond quickly to user requests
● Should handle multiple users at the same time
2.3. Security Goals
● Protect user data through authentication
● Prevent unauthorized access and ensure safe transactions
2.4. Usability Goals
● Provide a simple and user-friendly interface
● Ensure easy navigation and clear instructions
3
2.5. Reliability Goals
● System should work without failure most of the time
● Ensure proper data storage and error handling
2.6. Scalability Goals
● System should support increasing number of users
● Allow future upgrades and expansion easily
3.FUNCTIONAL REQUIREMENTS
3.1. User Class 1: Passenger
3.1.1. Functional Requirement 1.1 (Login/Register)
Passengers must be able to create an account and log in securely.
The system validates credentials before access. It ensures only
authorized users can use the system. Error messages are shown
for incorrect details. This maintains security.
● User registration
● Login system
● Credential validation
● Error handling
● Secure access
3.1.2. Functional Requirement 1.2 (Book Ticket)
Passengers can search trains using travel details. The system
shows available trains and seats. Users enter passenger details
and confirm booking. A PNR number is generated after booking.
This confirms ticket reservation.
4
● Train search
● Seat availability
● Enter passenger details
● Ticket booking
● Generate PNR
3.2. User Class 2: Admin
3.2.1. Functional Requirement 2.1 (Manage Trains)
Admin can add new train details into the system. They can update
schedules and seat availability. Admin can also delete incorrect
data. This keeps system information accurate. Proper validation is
applied.
● Add trains
● Update schedules
● Manage routes
● Delete records
● Maintain accuracy
3.2.2. Functional Requirement 2.2 (Manage Bookings)
Admin can view all bookings made by users. They can monitor
ticket status and cancellations. Admin ensures smooth system
operation. They can handle issues related to bookings. This
improves reliability.
● View bookings
● Monitor status
● Manage cancellations
● Resolve issues
● Maintain system
5
4. Non-Functional Requirement
4.1. External Interfaces
The system interacts with external services like payment gateways.
It requires internet connectivity for communication. APIs are used
for secure transactions. External interfaces ensure smooth
operations. Security is maintained during data exchange.
● Payment gateway interface
● Internet connectivity
4.2. User Interfaces
The interface should be simple and easy to use. Users should
easily navigate between options. Clear messages and instructions
should be displayed. The design should reduce user errors. It
improves overall usability.
● Simple and user-friendly interface
● Easy navigation
4.3 Software Interfaces
The system connects with databases like MySQL or Oracle.
Backend technologies like Java are used. Different modules
communicate with each other. APIs help in integration. This ensures
proper functioning.
● Database connection
● Backend system
6
4.4. Communication Interface
The system uses HTTP/HTTPS for communication. Data is transferred
securely between client and server. It interacts with payment systems
using APIs. Real-time updates are provided. Security measures protect
user data.
● System uses internet (HTTP/HTTPS) for communication
● Secure data transfer between client and server
● Supports real-time data exchange for booking and status
updates
5. Behavioural Description
5.1. System
The system accepts user inputs, processes booking or cancellation,
updates the database, and provides output such as ticket
confirmation or status.
5.2. Events & Actions
The system responds to user actions with appropriate outputs.
Each event triggers a specific process. For example, login triggers
validation. Booking generates PNR. This ensures proper workflow.
Event Action
User login Validate credentials
8
 Train search Display available trains
Ticket booking Generate PNR and confirm
booking
Ticket
cancellation
Update database and show
confirmation
Status check Display ticket status
===================================
