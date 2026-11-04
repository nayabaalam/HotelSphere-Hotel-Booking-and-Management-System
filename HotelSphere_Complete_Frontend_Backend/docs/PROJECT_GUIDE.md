# HotelSphere Project Guide

## Abstract
HotelSphere is a browser-based hotel booking and management system. It uses Oracle tables for structured records, PL/SQL packages for business rules, ORDS for REST access and HTML/CSS/JavaScript for the management interface.

## Core modules
- Room inventory and room-type pricing
- Guest/customer directory and loyalty profile fields
- Reservation creation, cancellation and overlap prevention
- Payment recording with partial-payment / due-balance validation
- Housekeeping task creation after checkout
- Maintenance and employee data foundations
- Dashboard metrics, occupancy and revenue reporting
- Audit trail for key actions

## Main workflow
Install schema → compile PL/SQL packages → insert sample data → create report views → publish ORDS endpoints → configure frontend API URL → run frontend using Live Server.

## Business rules
Check-out date must be later than check-in; guest count must fit room capacity; room cannot have overlapping confirmed/checked-in bookings; unavailable rooms cannot be booked; only confirmed bookings can be cancelled; payments must be positive and cannot exceed the outstanding balance.

## Architecture
Web browser → ORDS → PL/SQL packages → Oracle Database. SQL Developer is the development/admin tool, not the browser's database connector.

## Future extensions
Dedicated check-in/out API handlers, ORDS authentication and role permissions, dynamic pricing, invoices/refunds, email/SMS notifications, multi-branch reports, restaurant services, HR and advanced analytics.

## Validation note
This deliverable has not been executed against your Oracle and ORDS installation. Check the SQL Developer compiler output and adapt ORDS setup to the version/configuration installed on your machine. The demo API currently has no authentication; do not expose it publicly without configuring access controls.


## Integration update
The checkout POST payload includes guest name, email, phone and address. The ORDS booking handler resolves or creates the customer by email when no customer_id is provided, then delegates reservation validation and persistence to HS_BOOKING_PKG. This is guest booking, not authenticated account booking. See README.md for security and deployment limitations.
