# HotelSphere — Frontend + Oracle PL/SQL + ORDS

Academic project package built from the supplied HotelSphere ZIP.

## Stack
- Frontend: HTML5, CSS3, JavaScript
- Database: Oracle Database 26ai Free (schema `HOTELSPHERE`)
- Business logic: PL/SQL packages
- REST layer: Oracle REST Data Services (ORDS)

## Project layout
- `frontend/` — website pages, styles and browser JavaScript
- `database/01_schema.sql` — tables, constraints, indexes and core views
- `database/02_packages.sql` — booking, customer and billing PL/SQL packages
- `database/03_seed_data.sql` — demo hotel, room and customer records
- `database/04_reports.sql` — reporting views
- `database/05_ords_api.sql` — ORDS REST module and handlers
- `database/06_demo_tests.sql` — rollback-only booking test
- `docs/` — project guide and implementation notes

## Installation

1. Create/use a dedicated Oracle project schema. Do not use `SYS` or `SYSTEM`.
2. In SQL Developer, connect as that schema and run scripts in this order:
   1. `database/01_schema.sql`
   2. `database/02_packages.sql`
   3. `database/03_seed_data.sql`
   4. `database/04_reports.sql`
   5. `database/05_ords_api.sql`
3. Run `database/06_demo_tests.sql` to test the PL/SQL booking package. It rolls back its demo booking.
4. Start ORDS using your existing configuration. Example:
   ```powershell
   & "C:\Users\choud\Downloads\ords-latest\bin\ords.exe" --config "C:\HotelSphere\ords-config" serve
   ```
5. Confirm the health endpoint:
   `http://localhost:8080/ords/hotelsphere/api/health`
6. Edit `frontend/js/config.js` if your ORDS URL differs.
7. Open `frontend/` using VS Code Live Server (not `file://`).

## Booking API integration

The checkout page submits room/date/guest details and guest name/email/phone to `POST /bookings`.
The ORDS handler now:
- Uses `customer_id` if explicitly supplied by a trusted caller.
- Otherwise finds a customer by email or creates a guest customer.
- Calls `HS_BOOKING_PKG.CREATE_BOOKING`, which validates dates, capacity and overlapping reservations.
- Returns `booking_id`, `booking_code` and `customer_id`.

The database package calculates the authoritative room-rate total. The browser's displayed tax estimate is a demo calculation and is not persisted as a tax invoice.

## API endpoints included
- `GET /health`
- `GET /dashboard`
- `GET /rooms`
- `GET /customers`
- `POST /customers`
- `GET /bookings`
- `POST /bookings`
- `POST /bookings/{booking_id}/cancel`
- `GET /payments`
- `POST /payments`

## Important limitations — read before demo/deployment

This is an academic/demo foundation, **not a production-ready hotel platform**:
- Login/signup screens in the supplied frontend are not backed by secure authentication yet. Do not treat a browser session or localStorage value as proof of identity.
- Booking/customer/payment list endpoints currently expose broad data and must be protected with ORDS privileges and customer/admin authorization before public deployment.
- Payment recording is a ledger/demo endpoint, not a real card/UPI gateway. Never collect or store card numbers/CVV.
- Favorites, profile preferences, reviews and some settings are browser-local features unless separately integrated.
- Password reset, email/SMS notifications and contact-message delivery require additional server-side services.
- Configure HTTPS, CORS allowlist, ORDS authentication/authorization, rate limiting, backups and secrets before exposing the service outside localhost.

## Verification performed on this package
- All 28 frontend JavaScript files passed Node.js syntax checks.
- All local script `src` references in the HTML pages resolve to files in this ZIP.
- Oracle SQL/PLSQL was statically reviewed but **not executed** against your local Oracle/ORDS instance. Run the scripts in SQL Developer and share any compilation/runtime errors for environment-specific correction.
