
/* =====================================================
   HOTELSPHERE - MY BOOKINGS
   File: frontend/js/my-bookings.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. GET HTML ELEMENTS
    // -------------------------------------------------

    const bookingContainer =
        document.getElementById("myBookingsContainer") ||
        document.getElementById("bookingsContainer");

    const searchInput = document.getElementById("bookingSearch");
    const statusFilter = document.getElementById("bookingStatusFilter");

    const loadingElement = document.getElementById("bookingsLoading");
    const emptyElement = document.getElementById("bookingsEmpty");
    const errorElement = document.getElementById("bookingsError");

    const refreshButton = document.getElementById("refreshBookings");

    let allBookings = [];

    // -------------------------------------------------
    // 2. HELPER FUNCTIONS
    // -------------------------------------------------

    function money(amount) {
        return "₹" + Number(amount || 0).toLocaleString("en-IN");
    }

    function formatDate(value) {

        if (!value) return "--";

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

    function showElement(element) {
        if (element) element.style.display = "";
    }

    function hideElement(element) {
        if (element) element.style.display = "none";
    }

    function showLoading() {
        showElement(loadingElement);
        hideElement(emptyElement);
        hideElement(errorElement);
    }

    function hideLoading() {
        hideElement(loadingElement);
    }

    function showError(message) {

        if (errorElement) {
            errorElement.textContent = message;
            showElement(errorElement);
        } else {
            alert(message);
        }

    }

    function normalizeBookings(response) {

        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response?.items)) {
            return response.items;
        }

        if (Array.isArray(response?.data)) {
            return response.data;
        }

        if (Array.isArray(response?.bookings)) {
            return response.bookings;
        }

        return [];
    }

    function getStatusClass(status) {

        const normalized = String(status || "").toLowerCase();

        if (normalized.includes("confirm")) return "confirmed";
        if (normalized.includes("cancel")) return "cancelled";
        if (normalized.includes("complete")) return "completed";
        if (normalized.includes("pending")) return "pending";

        return "pending";
    }

    // -------------------------------------------------
    // 3. RENDER BOOKING CARD
    // -------------------------------------------------

    function createBookingCard(booking) {

        const bookingId =
            booking.booking_id ??
            booking.bookingId ??
            booking.id ??
            "";

        const roomName =
            booking.room_type ||
            booking.room_name ||
            booking.roomName ||
            "Hotel Room";

        const hotelName =
            booking.branch ||
            booking.hotel_name ||
            booking.hotelName ||
            "HotelSphere";

        const checkIn =
            booking.check_in ||
            booking.check_in_date ||
            booking.checkIn;

        const checkOut =
            booking.check_out ||
            booking.check_out_date ||
            booking.checkOut;

        const guests =
            booking.guests ??
            booking.guest_count ??
            booking.number_of_guests ??
            "--";

        const amount =
            booking.total_amount ??
            booking.total ??
            booking.amount ??
            0;

        const status =
            booking.booking_status ||
            booking.status ||
            "PENDING";

        const safeId = escapeHTML(bookingId);
        const safeStatus = escapeHTML(status);

        const canCancel =
            !String(status).toLowerCase().includes("cancel") &&
            !String(status).toLowerCase().includes("complete");

        return `
            <article class="booking-card"
                     data-booking-id="${safeId}">

                <div class="booking-card-header">

                    <div>
                        <h3>${escapeHTML(roomName)}</h3>
                        <p>${escapeHTML(hotelName)}</p>
                    </div>

                    <span class="status-badge ${getStatusClass(status)}">
                        ${safeStatus}
                    </span>

                </div>

                <div class="booking-card-body">

                    <div class="booking-info">
                        <span>Booking ID</span>
                        <strong>${safeId || "--"}</strong>
                    </div>

                    <div class="booking-info">
                        <span>Check-in</span>
                        <strong>${escapeHTML(formatDate(checkIn))}</strong>
                    </div>

                    <div class="booking-info">
                        <span>Check-out</span>
                        <strong>${escapeHTML(formatDate(checkOut))}</strong>
                    </div>

                    <div class="booking-info">
                        <span>Guests</span>
                        <strong>${escapeHTML(guests)}</strong>
                    </div>

                    <div class="booking-info">
                        <span>Total Amount</span>
                        <strong>${money(amount)}</strong>
                    </div>

                </div>

                <div class="booking-card-actions">

                    <button type="button"
                            class="btn btn-outline view-booking-btn"
                            data-id="${safeId}">
                        View Details
                    </button>

                    ${
                        canCancel
                        ? `
                            <button type="button"
                                    class="btn btn-danger cancel-booking-btn"
                                    data-id="${safeId}">
                                Cancel Booking
                            </button>
                          `
                        : ""
                    }

                </div>

            </article>
        `;
    }

    // -------------------------------------------------
    // 4. DISPLAY BOOKINGS
    // -------------------------------------------------

    function renderBookings(bookings) {

        if (!bookingContainer) {
            console.error("Bookings container not found.");
            return;
        }

        if (!bookings.length) {

            bookingContainer.innerHTML = "";

            showElement(emptyElement);

            if (emptyElement) {
                emptyElement.textContent = "No bookings found.";
            }

            return;
        }

        hideElement(emptyElement);

        bookingContainer.innerHTML = bookings
            .map(createBookingCard)
            .join("");

    }

    // -------------------------------------------------
    // 5. LOAD BOOKINGS FROM ORACLE API
    // -------------------------------------------------

    async function loadBookings() {

        if (!bookingContainer) {
            console.error(
                "Add #myBookingsContainer to my-bookings.html."
            );
            return;
        }

        showLoading();

        try {

            if (
                !window.HSApi ||
                typeof window.HSApi.bookings !== "function"
            ) {
                throw new Error("Bookings API is not available.");
            }

            const response = await window.HSApi.bookings();

            allBookings = normalizeBookings(response);

            hideLoading();

            applyFilters();

        } catch (error) {

            hideLoading();

            console.error("Load bookings error:", error);

            showError(
                error.message || "Unable to load bookings."
            );

        }

    }

    // -------------------------------------------------
    // 6. SEARCH AND STATUS FILTER
    // -------------------------------------------------

    function applyFilters() {

        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedStatus = statusFilter
            ? statusFilter.value.toLowerCase()
            : "all";

        const filteredBookings = allBookings.filter(function (booking) {

            const searchableText = [

                booking.booking_id,
                booking.bookingId,
                booking.room_type,
                booking.room_name,
                booking.branch,
                booking.status,
                booking.booking_status

            ].join(" ").toLowerCase();

            const matchesSearch =
                searchableText.includes(searchTerm);

            const status = String(
                booking.booking_status || booking.status || ""
            ).toLowerCase();

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return matchesSearch && matchesStatus;

        });

        renderBookings(filteredBookings);

    }

    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", applyFilters);
    }

    // -------------------------------------------------
    // 7. BOOKING ACTIONS
    // -------------------------------------------------

    if (bookingContainer) {

        bookingContainer.addEventListener("click", async function (event) {

            const viewButton = event.target.closest(
                ".view-booking-btn"
            );

            const cancelButton = event.target.closest(
                ".cancel-booking-btn"
            );

            // View booking details
            if (viewButton) {

                const bookingId = viewButton.dataset.id;

                const selectedBooking = allBookings.find(function (booking) {

                    return String(
                        booking.booking_id ??
                        booking.bookingId ??
                        booking.id
                    ) === String(bookingId);

                });

                if (selectedBooking) {

                    try {

                        sessionStorage.setItem(
                            "hotelsphere-selected-booking",
                            JSON.stringify(selectedBooking)
                        );

                    } catch (error) {

                        console.error("Unable to save booking:", error);

                    }

                }

                const params = new URLSearchParams();

                params.set("bookingId", bookingId);

                window.location.href =
                    "booking-confirmation.html?" + params.toString();

                return;
            }

            // Cancel booking
            if (cancelButton) {

                const bookingId = cancelButton.dataset.id;

                const confirmed = window.confirm(
                    `Are you sure you want to cancel booking #${bookingId}?`
                );

                if (!confirmed) return;

                try {

                    cancelButton.disabled = true;
                    cancelButton.textContent = "Cancelling...";

                    if (
                        !window.HSApi ||
                        typeof window.HSApi.cancelBooking !== "function"
                    ) {
                        throw new Error("Cancellation API is not available.");
                    }

                    await window.HSApi.cancelBooking(bookingId);

                    alert("Cancellation request processed.");

                    await loadBookings();

                } catch (error) {

                    console.error("Cancel booking error:", error);

                    alert(
                        error.message || "Unable to cancel booking."
                    );

                    cancelButton.disabled = false;
                    cancelButton.textContent = "Cancel Booking";

                }

            }

        });

    }

    // -------------------------------------------------
    // 8. REFRESH BUTTON
    // -------------------------------------------------

    if (refreshButton) {

        refreshButton.addEventListener("click", function () {
            loadBookings();
        });

    }

    // -------------------------------------------------
    // 9. INITIALIZE PAGE
    // -------------------------------------------------

    loadBookings();

});
