
/* =====================================================
   HOTELSPHERE - ADMIN BOOKING MANAGEMENT
   File: frontend/js/bookings.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const bookingTableBody =
        document.getElementById("bookingsTableBody");

    const bookingSearch =
        document.getElementById("bookingSearch");

    const bookingStatusFilter =
        document.getElementById("bookingStatusFilter");

    const refreshButton =
        document.getElementById("refreshBookings");

    const loadingMessage =
        document.getElementById("bookingsLoading");

    const errorMessage =
        document.getElementById("bookingsError");

    const emptyMessage =
        document.getElementById("bookingsEmpty");

    const totalBookings =
        document.getElementById("totalBookings");

    const confirmedBookings =
        document.getElementById("confirmedBookings");

    const cancelledBookings =
        document.getElementById("cancelledBookings");

    const pendingBookings =
        document.getElementById("pendingBookings");

    let allBookings = [];


    // -------------------------------------------------
    // 2. HELPER FUNCTIONS
    // -------------------------------------------------

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

    function showMessage(element, message) {

        if (!element) return;

        element.textContent = message;
        element.style.display = "block";

    }

    function hideMessage(element) {

        if (!element) return;

        element.style.display = "none";

    }

    function normalizeStatus(status) {

        return String(status || "UNKNOWN")
            .trim()
            .toUpperCase();

    }

    function getStatusClass(status) {

        const value = normalizeStatus(status);

        if (["CONFIRMED", "BOOKED"].includes(value)) {
            return "confirmed";
        }

        if (["CANCELLED", "CANCELED"].includes(value)) {
            return "cancelled";
        }

        if (["PENDING", "PROCESSING"].includes(value)) {
            return "pending";
        }

        if (value === "COMPLETED") {
            return "completed";
        }

        return "unknown";

    }

    function formatMoney(amount) {

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);

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


    // -------------------------------------------------
    // 3. READ BOOKING VALUES SAFELY
    // -------------------------------------------------

    function getBookingId(booking) {

        return booking.booking_id ?? booking.id ?? "";

    }

    function getBookingCustomer(booking) {

        return (
            booking.customer_name ??
            booking.full_name ??
            booking.guest_name ??
            "N/A"
        );

    }

    function getBookingRoom(booking) {

        return (
            booking.room_number ??
            booking.room_name ??
            booking.room_id ??
            "N/A"
        );

    }

    function getBookingAmount(booking) {

        return (
            booking.total_amount ??
            booking.amount ??
            booking.total ??
            0
        );

    }


    // -------------------------------------------------
    // 4. UPDATE BOOKING STATISTICS
    // -------------------------------------------------

    function updateStatistics(bookings) {

        const total = bookings.length;

        const confirmed = bookings.filter(booking =>
            ["CONFIRMED", "BOOKED"].includes(
                normalizeStatus(booking.status)
            )
        ).length;

        const cancelled = bookings.filter(booking =>
            ["CANCELLED", "CANCELED"].includes(
                normalizeStatus(booking.status)
            )
        ).length;

        const pending = bookings.filter(booking =>
            ["PENDING", "PROCESSING"].includes(
                normalizeStatus(booking.status)
            )
        ).length;

        if (totalBookings) {
            totalBookings.textContent = total;
        }

        if (confirmedBookings) {
            confirmedBookings.textContent = confirmed;
        }

        if (cancelledBookings) {
            cancelledBookings.textContent = cancelled;
        }

        if (pendingBookings) {
            pendingBookings.textContent = pending;
        }

    }


    // -------------------------------------------------
    // 5. RENDER BOOKING TABLE
    // -------------------------------------------------

    function renderBookings(bookings) {

        if (!bookingTableBody) return;

        bookingTableBody.innerHTML = "";

        if (bookings.length === 0) {

            showMessage(
                emptyMessage,
                "No bookings found."
            );

            return;

        }

        hideMessage(emptyMessage);

        bookings.forEach(function (booking) {

            const status = normalizeStatus(booking.status);

            const row = document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${escapeHTML(getBookingId(booking))}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(getBookingCustomer(booking))}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(getBookingRoom(booking))}
                </td>

                <td>
                    ${escapeHTML(formatDate(booking.check_in))}
                </td>

                <td>
                    ${escapeHTML(formatDate(booking.check_out))}
                </td>

                <td>
                    ${formatMoney(getBookingAmount(booking))}
                </td>

                <td>
                    <span
                        class="status-badge ${getStatusClass(status)}"
                        data-status="${escapeHTML(status)}">

                        ${escapeHTML(status)}

                    </span>
                </td>

                <td class="action-column">

                    <button
                        type="button"
                        class="btn btn-sm btn-outline"
                        data-view-booking="${escapeHTML(getBookingId(booking))}">

                        View

                    </button>

                    ${
                        ["CONFIRMED", "BOOKED", "PENDING"].includes(status)
                        ? `
                            <button
                                type="button"
                                class="btn btn-sm btn-danger"
                                data-cancel-booking="${escapeHTML(getBookingId(booking))}">

                                Cancel

                            </button>
                        `
                        : ""
                    }

                </td>

            `;

            bookingTableBody.appendChild(row);

        });

    }


    // -------------------------------------------------
    // 6. SEARCH AND FILTER BOOKINGS
    // -------------------------------------------------

    function filterBookings() {

        const searchText = bookingSearch
            ? bookingSearch.value.trim().toLowerCase()
            : "";

        const selectedStatus = bookingStatusFilter
            ? bookingStatusFilter.value.toUpperCase()
            : "ALL";

        const filteredBookings = allBookings.filter(
            function (booking) {

                const searchValues = [

                    getBookingId(booking),
                    getBookingCustomer(booking),
                    getBookingRoom(booking),
                    booking.email,
                    booking.status

                ];

                const matchesSearch = searchValues.some(
                    value =>
                        String(value ?? "")
                            .toLowerCase()
                            .includes(searchText)
                );

                const matchesStatus =
                    selectedStatus === "ALL" ||
                    normalizeStatus(booking.status) === selectedStatus;

                return matchesSearch && matchesStatus;

            }
        );

        renderBookings(filteredBookings);

    }

    if (bookingSearch) {

        bookingSearch.addEventListener(
            "input",
            filterBookings
        );

    }

    if (bookingStatusFilter) {

        bookingStatusFilter.addEventListener(
            "change",
            filterBookings
        );

    }


    // -------------------------------------------------
    // 7. VIEW BOOKING DETAILS
    // -------------------------------------------------

    if (bookingTableBody) {

        bookingTableBody.addEventListener(
            "click",
            function (event) {

                const viewButton = event.target.closest(
                    "[data-view-booking]"
                );

                if (!viewButton) return;

                const bookingId = viewButton.dataset.viewBooking;

                const booking = allBookings.find(
                    item =>
                        String(getBookingId(item)) === String(bookingId)
                );

                if (!booking) return;

                alert(

                    "HOTELSPHERE BOOKING DETAILS\n\n" +

                    "Booking ID: " +
                    getBookingId(booking) + "\n\n" +

                    "Customer: " +
                    getBookingCustomer(booking) + "\n\n" +

                    "Room: " +
                    getBookingRoom(booking) + "\n\n" +

                    "Check-in: " +
                    formatDate(booking.check_in) + "\n\n" +

                    "Check-out: " +
                    formatDate(booking.check_out) + "\n\n" +

                    "Guests: " +
                    (booking.guests ?? "N/A") + "\n\n" +

                    "Amount: " +
                    formatMoney(getBookingAmount(booking)) + "\n\n" +

                    "Status: " +
                    normalizeStatus(booking.status)

                );

            }
        );

    }


    // -------------------------------------------------
    // 8. CANCEL BOOKING THROUGH API
    // -------------------------------------------------

    if (bookingTableBody) {

        bookingTableBody.addEventListener(
            "click",
            async function (event) {

                const cancelButton = event.target.closest(
                    "[data-cancel-booking]"
                );

                if (!cancelButton) return;

                const bookingId =
                    cancelButton.dataset.cancelBooking;

                const booking = allBookings.find(
                    item =>
                        String(getBookingId(item)) === String(bookingId)
                );

                if (!booking) return;

                const confirmed = confirm(
                    "Are you sure you want to cancel booking #" +
                    bookingId + "?"
                );

                if (!confirmed) return;

                try {

                    if (
                        !window.HSApi ||
                        typeof window.HSApi.cancelBooking !== "function"
                    ) {

                        throw new Error(
                            "Booking cancellation API is not available."
                        );

                    }

                    cancelButton.disabled = true;

                    cancelButton.textContent = "Cancelling...";

                    await window.HSApi.cancelBooking(bookingId);

                    alert("Booking cancellation request completed.");

                    await loadBookings();

                } catch (error) {

                    console.error(
                        "Booking cancellation error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Unable to cancel this booking."
                    );

                    cancelButton.disabled = false;

                    cancelButton.textContent = "Cancel";

                }

            }
        );

    }


    // -------------------------------------------------
    // 9. LOAD BOOKINGS FROM ORACLE API
    // -------------------------------------------------

    async function loadBookings() {

        hideMessage(errorMessage);
        hideMessage(emptyMessage);

        showMessage(
            loadingMessage,
            "Loading booking records..."
        );

        if (refreshButton) {
            refreshButton.disabled = true;
        }

        try {

            if (
                !window.HSApi ||
                typeof window.HSApi.bookings !== "function"
            ) {

                throw new Error(
                    "Bookings API is not available. Check api.js."
                );

            }

            const response = await window.HSApi.bookings();

            const bookings = Array.isArray(response)
                ? response
                : response?.items;

            if (!Array.isArray(bookings)) {

                throw new Error(
                    "Invalid booking data received from server."
                );

            }

            allBookings = bookings;

            updateStatistics(allBookings);

            filterBookings();

        } catch (error) {

            console.error(
                "Booking loading error:",
                error
            );

            showMessage(
                errorMessage,
                error.message || "Unable to load bookings."
            );

        } finally {

            hideMessage(loadingMessage);

            if (refreshButton) {
                refreshButton.disabled = false;
            }

        }

    }


    // -------------------------------------------------
    // 10. REFRESH BOOKINGS
    // -------------------------------------------------

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadBookings
        );

    }


    // -------------------------------------------------
    // 11. INITIALIZE BOOKING MANAGEMENT
    // -------------------------------------------------

    if (bookingTableBody) {

        loadBookings();

    }

});
