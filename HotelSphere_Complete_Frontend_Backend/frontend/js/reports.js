
/* =====================================================
   HOTELSPHERE - REPORTS & ANALYTICS
   File: frontend/js/reports.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const startDate = document.getElementById("reportStartDate");
    const endDate = document.getElementById("reportEndDate");

    const generateButton = document.getElementById("generateReport");
    const exportButton = document.getElementById("exportReport");

    const loadingMessage = document.getElementById("reportsLoading");
    const errorMessage = document.getElementById("reportsError");
    const emptyMessage = document.getElementById("reportsEmpty");

    const reportTotalBookings = document.getElementById("reportTotalBookings");
    const reportRevenue = document.getElementById("reportRevenue");
    const reportConfirmed = document.getElementById("reportConfirmed");
    const reportCancelled = document.getElementById("reportCancelled");

    const reportTotalPayments = document.getElementById("reportTotalPayments");
    const reportSuccessfulPayments = document.getElementById("reportSuccessfulPayments");

    const reportTotalRooms = document.getElementById("reportTotalRooms");
    const reportAvailableRooms = document.getElementById("reportAvailableRooms");
    const reportOccupiedRooms = document.getElementById("reportOccupiedRooms");
    const reportOccupancyRate = document.getElementById("reportOccupancyRate");

    const reportTableBody = document.getElementById("reportsTableBody");

    let allBookings = [];
    let allPayments = [];
    let allRooms = [];

    let filteredBookings = [];
    let filteredPayments = [];


    // -------------------------------------------------
    // 2. HELPER FUNCTIONS
    // -------------------------------------------------

    function showMessage(element, message) {

        if (!element) return;

        element.textContent = message;
        element.style.display = "block";

    }

    function hideMessage(element) {

        if (!element) return;

        element.style.display = "none";

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

    function normalizeStatus(status) {

        return String(status || "UNKNOWN")
            .trim()
            .toUpperCase();

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

    function getAmount(booking) {

        return Number(
            booking.total_amount ??
            booking.amount ??
            booking.total ??
            0
        );

    }

    function getBookingId(booking) {

        return booking.booking_id ?? booking.id ?? "N/A";

    }

    function getBookingCustomer(booking) {

        return (
            booking.customer_name ??
            booking.full_name ??
            booking.guest_name ??
            "N/A"
        );

    }


    // -------------------------------------------------
    // 3. DATE FILTER
    // -------------------------------------------------

    function filterDataByDate() {

        const fromDate = startDate?.value
            ? new Date(startDate.value + "T00:00:00")
            : null;

        const toDate = endDate?.value
            ? new Date(endDate.value + "T23:59:59.999")
            : null;

        if (fromDate && toDate && fromDate > toDate) {

            throw new Error(
                "Start date cannot be after end date."
            );

        }

        function isWithinDateRange(value) {

            if (!fromDate && !toDate) return true;

            if (!value) return false;

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) return false;

            if (fromDate && date < fromDate) return false;

            if (toDate && date > toDate) return false;

            return true;

        }

        filteredBookings = allBookings.filter(booking =>
            isWithinDateRange(
                booking.created_at ??
                booking.booking_date ??
                booking.check_in
            )
        );

        filteredPayments = allPayments.filter(payment =>
            isWithinDateRange(
                payment.payment_date ??
                payment.created_at ??
                payment.transaction_date
            )
        );

    }


    // -------------------------------------------------
    // 4. CALCULATE BOOKING STATISTICS
    // -------------------------------------------------

    function calculateBookingStatistics() {

        const total = filteredBookings.length;

        const confirmed = filteredBookings.filter(booking =>
            ["CONFIRMED", "BOOKED", "COMPLETED"].includes(
                normalizeStatus(booking.status)
            )
        ).length;

        const cancelled = filteredBookings.filter(booking =>
            ["CANCELLED", "CANCELED"].includes(
                normalizeStatus(booking.status)
            )
        ).length;

        const revenue = filteredBookings
            .filter(booking =>
                !["CANCELLED", "CANCELED"].includes(
                    normalizeStatus(booking.status)
                )
            )
            .reduce(
                (sum, booking) => sum + getAmount(booking),
                0
            );

        if (reportTotalBookings) {
            reportTotalBookings.textContent = total;
        }

        if (reportConfirmed) {
            reportConfirmed.textContent = confirmed;
        }

        if (reportCancelled) {
            reportCancelled.textContent = cancelled;
        }

        if (reportRevenue) {
            reportRevenue.textContent = formatMoney(revenue);
        }

    }


    // -------------------------------------------------
    // 5. CALCULATE PAYMENT STATISTICS
    // -------------------------------------------------

    function calculatePaymentStatistics() {

        const total = filteredPayments.length;

        const successful = filteredPayments.filter(payment =>
            ["SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID"].includes(
                normalizeStatus(payment.status)
            )
        );

        const collected = successful.reduce(
            (sum, payment) =>
                sum + Number(payment.amount ?? payment.total_amount ?? 0),
            0
        );

        if (reportTotalPayments) {
            reportTotalPayments.textContent = total;
        }

        if (reportSuccessfulPayments) {
            reportSuccessfulPayments.textContent =
                formatMoney(collected);
        }

    }


    // -------------------------------------------------
    // 6. CALCULATE ROOM OCCUPANCY
    // -------------------------------------------------

    function calculateRoomStatistics() {

        const total = allRooms.length;

        const available = allRooms.filter(room =>
            normalizeStatus(room.status) === "AVAILABLE"
        ).length;

        const occupied = allRooms.filter(room =>
            normalizeStatus(room.status) === "OCCUPIED"
        ).length;

        const occupancyRate = total > 0
            ? (occupied / total) * 100
            : 0;

        if (reportTotalRooms) {
            reportTotalRooms.textContent = total;
        }

        if (reportAvailableRooms) {
            reportAvailableRooms.textContent = available;
        }

        if (reportOccupiedRooms) {
            reportOccupiedRooms.textContent = occupied;
        }

        if (reportOccupancyRate) {
            reportOccupancyRate.textContent =
                occupancyRate.toFixed(1) + "%";
        }

    }


    // -------------------------------------------------
    // 7. RENDER REPORT TABLE
    // -------------------------------------------------

    function renderReportTable() {

        if (!reportTableBody) return;

        reportTableBody.innerHTML = "";

        if (filteredBookings.length === 0) {

            showMessage(
                emptyMessage,
                "No booking records available for this period."
            );

            return;

        }

        hideMessage(emptyMessage);

        filteredBookings.forEach(function (booking) {

            const row = document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${escapeHTML(getBookingId(booking))}
                </td>

                <td>
                    ${escapeHTML(getBookingCustomer(booking))}
                </td>

                <td>
                    ${escapeHTML(formatDate(
                        booking.created_at ??
                        booking.booking_date ??
                        booking.check_in
                    ))}
                </td>

                <td>
                    ${escapeHTML(normalizeStatus(booking.status))}
                </td>

                <td>
                    ${formatMoney(getAmount(booking))}
                </td>

            `;

            reportTableBody.appendChild(row);

        });

    }


    // -------------------------------------------------
    // 8. GENERATE REPORT
    // -------------------------------------------------

    function generateReport() {

        try {

            hideMessage(errorMessage);
            hideMessage(emptyMessage);

            filterDataByDate();

            calculateBookingStatistics();

            calculatePaymentStatistics();

            calculateRoomStatistics();

            renderReportTable();

        } catch (error) {

            showMessage(errorMessage, error.message);

        }

    }


    // -------------------------------------------------
    // 9. EXPORT REPORT TO CSV
    // -------------------------------------------------

    function exportReportCSV() {

        if (filteredBookings.length === 0) {

            alert("No booking data available to export.");

            return;

        }

        const headers = [
            "Booking ID",
            "Customer",
            "Booking Date",
            "Status",
            "Amount"
        ];

        const rows = filteredBookings.map(booking => [

            getBookingId(booking),
            getBookingCustomer(booking),

            formatDate(
                booking.created_at ??
                booking.booking_date ??
                booking.check_in
            ),

            normalizeStatus(booking.status),
            getAmount(booking)

        ]);

        function escapeCSV(value) {

            let text = String(value ?? "");

            if (/^[=+\-@\t\r]/.test(text)) {
                text = "'" + text;
            }

            return '"' + text.replace(/"/g, '""') + '"';

        }

        const csv = [
            headers,
            ...rows
        ].map(row =>
            row.map(escapeCSV).join(",")
        ).join("\n");

        const blob = new Blob(
            ["\uFEFF" + csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "HotelSphere_Report.csv";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    }


    // -------------------------------------------------
    // 10. LOAD DATA FROM ORACLE APIs
    // -------------------------------------------------

    async function loadReportData() {

        showMessage(
            loadingMessage,
            "Loading HotelSphere reports..."
        );

        hideMessage(errorMessage);

        if (generateButton) {
            generateButton.disabled = true;
        }

        try {

            if (!window.HSApi) {

                throw new Error(
                    "HotelSphere API is not initialized."
                );

            }

            const [bookingResponse, paymentResponse, roomResponse] =
                await Promise.all([

                    window.HSApi.bookings(),
                    window.HSApi.payments(),
                    window.HSApi.rooms()

                ]);

            allBookings = Array.isArray(bookingResponse)
                ? bookingResponse
                : bookingResponse?.items;

            allPayments = Array.isArray(paymentResponse)
                ? paymentResponse
                : paymentResponse?.items;

            allRooms = Array.isArray(roomResponse)
                ? roomResponse
                : roomResponse?.items;

            if (
                !Array.isArray(allBookings) ||
                !Array.isArray(allPayments) ||
                !Array.isArray(allRooms)
            ) {

                throw new Error(
                    "One or more APIs returned invalid data."
                );

            }

            generateReport();

        } catch (error) {

            console.error(
                "Report loading error:",
                error
            );

            showMessage(
                errorMessage,
                error.message || "Unable to load reports."
            );

        } finally {

            hideMessage(loadingMessage);

            if (generateButton) {
                generateButton.disabled = false;
            }

        }

    }


    // -------------------------------------------------
    // 11. EVENT LISTENERS
    // -------------------------------------------------

    if (generateButton) {

        generateButton.addEventListener(
            "click",
            generateReport
        );

    }

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportReportCSV
        );

    }


    // -------------------------------------------------
    // 12. INITIALIZE REPORTS
    // -------------------------------------------------

    if (reportTableBody) {

        loadReportData();

    }

});
