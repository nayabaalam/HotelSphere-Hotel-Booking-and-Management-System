
/* =====================================================
   HOTELSPHERE - ADMIN DASHBOARD
   File: frontend/js/dashboard.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const refreshButton = document.getElementById("refreshDashboard");

    const loadingMessage = document.getElementById("dashboardLoading");
    const errorMessage = document.getElementById("dashboardError");

    // Main statistics
    const totalRooms = document.getElementById("dashboardTotalRooms");
    const totalCustomers = document.getElementById("dashboardTotalCustomers");
    const totalBookings = document.getElementById("dashboardTotalBookings");
    const totalRevenue = document.getElementById("dashboardTotalRevenue");

    // Room statistics
    const availableRooms = document.getElementById("dashboardAvailableRooms");
    const occupiedRooms = document.getElementById("dashboardOccupiedRooms");
    const maintenanceRooms = document.getElementById("dashboardMaintenanceRooms");

    // Booking statistics
    const confirmedBookings = document.getElementById("dashboardConfirmedBookings");
    const pendingBookings = document.getElementById("dashboardPendingBookings");
    const cancelledBookings = document.getElementById("dashboardCancelledBookings");

    // Payment statistics
    const totalPayments = document.getElementById("dashboardTotalPayments");
    const successfulPayments = document.getElementById("dashboardSuccessfulPayments");

    // Recent bookings
    const recentBookingsBody = document.getElementById("recentBookingsTable");


    // -------------------------------------------------
    // 2. DASHBOARD DATA
    // -------------------------------------------------

    let dashboardData = {
        rooms: [],
        customers: [],
        bookings: [],
        payments: []
    };


    // -------------------------------------------------
    // 3. HELPER FUNCTIONS
    // -------------------------------------------------

    function setText(element, value) {

        if (element) {
            element.textContent = value;
        }

    }

    function showMessage(element, message) {

        if (!element) return;

        element.textContent = message;
        element.style.display = "block";

    }

    function hideMessage(element) {

        if (element) {
            element.style.display = "none";
        }

    }

    function normalizeStatus(status) {

        return String(status || "UNKNOWN").trim().toUpperCase();

    }

    function money(value) {

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);

    }

    function formatDate(value) {

        if (!value) return "N/A";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    }

    function escapeHTML(value) {

        return String(value ?? "").replace(/[&<>"']/g, function (char) {

            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[char];

        });

    }

    function getAmount(booking) {

        return Number(
            booking.total_amount ??
            booking.amount ??
            booking.total ??
            0
        );

    }


    // -------------------------------------------------
    // 4. CALCULATE ROOM STATISTICS
    // -------------------------------------------------

    function calculateRoomStats() {

        const rooms = dashboardData.rooms;

        const total = rooms.length;

        const available = rooms.filter(room =>
            normalizeStatus(room.status) === "AVAILABLE"
        ).length;

        const occupied = rooms.filter(room =>
            normalizeStatus(room.status) === "OCCUPIED"
        ).length;

        const maintenance = rooms.filter(room =>
            normalizeStatus(room.status) === "MAINTENANCE"
        ).length;

        setText(totalRooms, total);
        setText(availableRooms, available);
        setText(occupiedRooms, occupied);
        setText(maintenanceRooms, maintenance);

    }


    // -------------------------------------------------
    // 5. CALCULATE CUSTOMER STATISTICS
    // -------------------------------------------------

    function calculateCustomerStats() {

        setText(
            totalCustomers,
            dashboardData.customers.length
        );

    }


    // -------------------------------------------------
    // 6. CALCULATE BOOKING STATISTICS
    // -------------------------------------------------

    function calculateBookingStats() {

        const bookings = dashboardData.bookings;

        const total = bookings.length;

        const confirmed = bookings.filter(booking =>
            ["CONFIRMED", "BOOKED", "COMPLETED"].includes(
                normalizeStatus(booking.status)
            )
        ).length;

        const pending = bookings.filter(booking =>
            ["PENDING", "PENDING_CONFIRMATION"].includes(
                normalizeStatus(booking.status)
            )
        ).length;

        const cancelled = bookings.filter(booking =>
            ["CANCELLED", "CANCELED"].includes(
                normalizeStatus(booking.status)
            )
        ).length;

        const revenue = bookings
            .filter(booking =>
                !["CANCELLED", "CANCELED"].includes(
                    normalizeStatus(booking.status)
                )
            )
            .reduce(
                (sum, booking) => sum + getAmount(booking),
                0
            );

        setText(totalBookings, total);
        setText(confirmedBookings, confirmed);
        setText(pendingBookings, pending);
        setText(cancelledBookings, cancelled);
        setText(totalRevenue, money(revenue));

    }


    // -------------------------------------------------
    // 7. CALCULATE PAYMENT STATISTICS
    // -------------------------------------------------

    function calculatePaymentStats() {

        const payments = dashboardData.payments;

        const successful = payments.filter(payment =>
            ["SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID"].includes(
                normalizeStatus(payment.status)
            )
        );

        const collected = successful.reduce(
            (sum, payment) =>
                sum + Number(
                    payment.amount ??
                    payment.total_amount ??
                    0
                ),
            0
        );

        setText(totalPayments, payments.length);
        setText(successfulPayments, money(collected));

    }


    // -------------------------------------------------
    // 8. RENDER RECENT BOOKINGS
    // -------------------------------------------------

    function renderRecentBookings() {

        if (!recentBookingsBody) return;

        recentBookingsBody.innerHTML = "";

        const recentBookings = [...dashboardData.bookings]
            .sort(function (a, b) {

                const dateA = new Date(
                    a.created_at ??
                    a.booking_date ??
                    a.check_in ??
                    0
                ).getTime();

                const dateB = new Date(
                    b.created_at ??
                    b.booking_date ??
                    b.check_in ??
                    0
                ).getTime();

                return dateB - dateA;

            })
            .slice(0, 5);

        if (recentBookings.length === 0) {

            const row = document.createElement("tr");

            const cell = document.createElement("td");

            cell.colSpan = 6;
            cell.textContent = "No recent bookings found.";

            row.appendChild(cell);
            recentBookingsBody.appendChild(row);

            return;

        }

        recentBookings.forEach(function (booking) {

            const row = document.createElement("tr");

            const bookingId =
                booking.booking_id ??
                booking.id ??
                "N/A";

            const customer =
                booking.customer_name ??
                booking.full_name ??
                booking.guest_name ??
                "N/A";

            const room =
                booking.room_number ??
                booking.room_name ??
                booking.room_id ??
                "N/A";

            const status = normalizeStatus(booking.status);

            const date = formatDate(
                booking.created_at ??
                booking.booking_date ??
                booking.check_in
            );

            const amount = money(getAmount(booking));

            const cells = [
                bookingId,
                customer,
                room,
                date,
                status,
                amount
            ];

            cells.forEach(function (value) {

                const cell = document.createElement("td");

                cell.textContent = value;

                row.appendChild(cell);

            });

            recentBookingsBody.appendChild(row);

        });

    }


    // -------------------------------------------------
    // 9. UPDATE DASHBOARD
    // -------------------------------------------------

    function updateDashboard() {

        calculateRoomStats();

        calculateCustomerStats();

        calculateBookingStats();

        calculatePaymentStats();

        renderRecentBookings();

    }


    // -------------------------------------------------
    // 10. LOAD DATA FROM ORACLE DATABASE
    // -------------------------------------------------

    async function loadDashboard() {

        showMessage(
            loadingMessage,
            "Loading dashboard data..."
        );

        hideMessage(errorMessage);

        if (refreshButton) {
            refreshButton.disabled = true;
        }

        try {

            if (!window.HSApi) {

                throw new Error(
                    "HotelSphere API is not initialized."
                );

            }

            const results = await Promise.all([

                window.HSApi.rooms(),
                window.HSApi.customers(),
                window.HSApi.bookings(),
                window.HSApi.payments()

            ]);

            const [
                roomsResponse,
                customersResponse,
                bookingsResponse,
                paymentsResponse
            ] = results;

            function getItems(response, name) {

                const items = Array.isArray(response)
                    ? response
                    : response?.items;

                if (!Array.isArray(items)) {

                    throw new Error(
                        "Invalid " + name + " API response."
                    );

                }

                return items;

            }

            dashboardData.rooms = getItems(
                roomsResponse,
                "rooms"
            );

            dashboardData.customers = getItems(
                customersResponse,
                "customers"
            );

            dashboardData.bookings = getItems(
                bookingsResponse,
                "bookings"
            );

            dashboardData.payments = getItems(
                paymentsResponse,
                "payments"
            );

            updateDashboard();

        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

            showMessage(
                errorMessage,
                error.message || "Unable to load dashboard."
            );

        } finally {

            hideMessage(loadingMessage);

            if (refreshButton) {
                refreshButton.disabled = false;
            }

        }

    }


    // -------------------------------------------------
    // 11. REFRESH BUTTON
    // -------------------------------------------------

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadDashboard
        );

    }


    // -------------------------------------------------
    // 12. INITIALIZE DASHBOARD
    // -------------------------------------------------

    if (recentBookingsBody) {

        loadDashboard();

    }

});
