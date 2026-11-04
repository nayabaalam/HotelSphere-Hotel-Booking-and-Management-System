
/* =====================================================
   HOTELSPHERE - PAYMENT MANAGEMENT
   File: frontend/js/payments.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const paymentTableBody =
        document.getElementById("paymentsTableBody");

    const paymentSearch =
        document.getElementById("paymentSearch");

    const paymentStatusFilter =
        document.getElementById("paymentStatusFilter");

    const refreshButton =
        document.getElementById("refreshPayments");

    const exportButton =
        document.getElementById("exportPayments");

    const loadingMessage =
        document.getElementById("paymentsLoading");

    const errorMessage =
        document.getElementById("paymentsError");

    const emptyMessage =
        document.getElementById("paymentsEmpty");

    const totalPayments =
        document.getElementById("totalPayments");

    const totalCollected =
        document.getElementById("totalCollected");

    const successfulPayments =
        document.getElementById("successfulPayments");

    const failedPayments =
        document.getElementById("failedPayments");

    const pendingPayments =
        document.getElementById("pendingPayments");

    let allPayments = [];


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

        if (
            ["SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID"].includes(value)
        ) {
            return "success";
        }

        if (
            ["FAILED", "FAILURE", "DECLINED"].includes(value)
        ) {
            return "failed";
        }

        if (
            ["PENDING", "PROCESSING"].includes(value)
        ) {
            return "pending";
        }

        if (
            ["REFUNDED", "REVERSED"].includes(value)
        ) {
            return "refunded";
        }

        return "unknown";

    }

    function formatMoney(amount) {

        return new Intl.NumberFormat("en-IN", {

            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2

        }).format(Number(amount) || 0);

    }

    function formatDate(value) {

        if (!value) return "N/A";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString("en-IN", {

            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"

        });

    }


    // -------------------------------------------------
    // 3. READ PAYMENT VALUES
    // -------------------------------------------------

    function getPaymentId(payment) {

        return payment.payment_id ?? payment.id ?? "N/A";

    }

    function getBookingId(payment) {

        return payment.booking_id ?? "N/A";

    }

    function getPaymentAmount(payment) {

        return Number(
            payment.amount ??
            payment.total_amount ??
            0
        );

    }

    function getPaymentMethod(payment) {

        return (
            payment.payment_method ??
            payment.method ??
            "N/A"
        );

    }

    function getPaymentDate(payment) {

        return (
            payment.payment_date ??
            payment.created_at ??
            payment.transaction_date ??
            null
        );

    }


    // -------------------------------------------------
    // 4. UPDATE PAYMENT STATISTICS
    // -------------------------------------------------

    function updateStatistics(payments) {

        const total = payments.length;

        const successful = payments.filter(payment =>
            ["SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID"].includes(
                normalizeStatus(payment.status)
            )
        );

        const failed = payments.filter(payment =>
            ["FAILED", "FAILURE", "DECLINED"].includes(
                normalizeStatus(payment.status)
            )
        );

        const pending = payments.filter(payment =>
            ["PENDING", "PROCESSING"].includes(
                normalizeStatus(payment.status)
            )
        );

        const collectedAmount = successful.reduce(
            (sum, payment) => sum + getPaymentAmount(payment),
            0
        );

        if (totalPayments) {
            totalPayments.textContent = total;
        }

        if (totalCollected) {
            totalCollected.textContent =
                formatMoney(collectedAmount);
        }

        if (successfulPayments) {
            successfulPayments.textContent = successful.length;
        }

        if (failedPayments) {
            failedPayments.textContent = failed.length;
        }

        if (pendingPayments) {
            pendingPayments.textContent = pending.length;
        }

    }


    // -------------------------------------------------
    // 5. RENDER PAYMENT TABLE
    // -------------------------------------------------

    function renderPayments(payments) {

        if (!paymentTableBody) return;

        paymentTableBody.innerHTML = "";

        if (payments.length === 0) {

            showMessage(
                emptyMessage,
                "No payment records found."
            );

            return;

        }

        hideMessage(emptyMessage);

        payments.forEach(function (payment) {

            const status = normalizeStatus(payment.status);

            const row = document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${escapeHTML(getPaymentId(payment))}
                </td>

                <td>
                    ${escapeHTML(getBookingId(payment))}
                </td>

                <td>
                    <strong>
                        ${formatMoney(getPaymentAmount(payment))}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(getPaymentMethod(payment))}
                </td>

                <td>
                    <span
                        class="status-badge ${getStatusClass(status)}"
                        data-status="${escapeHTML(status)}">

                        ${escapeHTML(status)}

                    </span>
                </td>

                <td>
                    ${escapeHTML(formatDate(getPaymentDate(payment)))}
                </td>

                <td class="action-column">

                    <button
                        type="button"
                        class="btn btn-sm btn-outline"
                        data-view-payment="${escapeHTML(getPaymentId(payment))}">

                        View Details

                    </button>

                </td>

            `;

            paymentTableBody.appendChild(row);

        });

    }


    // -------------------------------------------------
    // 6. SEARCH AND FILTER PAYMENTS
    // -------------------------------------------------

    function filterPayments() {

        const searchText = paymentSearch
            ? paymentSearch.value.trim().toLowerCase()
            : "";

        const selectedStatus = paymentStatusFilter
            ? paymentStatusFilter.value.toUpperCase()
            : "ALL";

        const filteredPayments = allPayments.filter(
            function (payment) {

                const searchValues = [

                    getPaymentId(payment),
                    getBookingId(payment),
                    getPaymentMethod(payment),
                    payment.status

                ];

                const matchesSearch = searchValues.some(
                    value =>
                        String(value ?? "")
                            .toLowerCase()
                            .includes(searchText)
                );

                const matchesStatus =
                    selectedStatus === "ALL" ||
                    normalizeStatus(payment.status) === selectedStatus;

                return matchesSearch && matchesStatus;

            }
        );

        renderPayments(filteredPayments);

    }

    if (paymentSearch) {

        paymentSearch.addEventListener(
            "input",
            filterPayments
        );

    }

    if (paymentStatusFilter) {

        paymentStatusFilter.addEventListener(
            "change",
            filterPayments
        );

    }


    // -------------------------------------------------
    // 7. VIEW PAYMENT DETAILS
    // -------------------------------------------------

    if (paymentTableBody) {

        paymentTableBody.addEventListener(
            "click",
            function (event) {

                const button = event.target.closest(
                    "[data-view-payment]"
                );

                if (!button) return;

                const paymentId = button.dataset.viewPayment;

                const payment = allPayments.find(
                    item =>
                        String(getPaymentId(item)) === String(paymentId)
                );

                if (!payment) return;

                alert(

                    "HOTELSPHERE PAYMENT DETAILS\n\n" +

                    "Payment ID: " +
                    getPaymentId(payment) + "\n\n" +

                    "Booking ID: " +
                    getBookingId(payment) + "\n\n" +

                    "Amount: " +
                    formatMoney(getPaymentAmount(payment)) + "\n\n" +

                    "Payment Method: " +
                    getPaymentMethod(payment) + "\n\n" +

                    "Status: " +
                    normalizeStatus(payment.status) + "\n\n" +

                    "Payment Date: " +
                    formatDate(getPaymentDate(payment))

                );

            }
        );

    }


    // -------------------------------------------------
    // 8. EXPORT PAYMENTS TO CSV
    // -------------------------------------------------

    function exportPayments() {

        if (allPayments.length === 0) {

            alert("No payment records available to export.");

            return;

        }

        const headers = [

            "Payment ID",
            "Booking ID",
            "Amount",
            "Payment Method",
            "Status",
            "Payment Date"

        ];

        const rows = allPayments.map(function (payment) {

            return [

                getPaymentId(payment),
                getBookingId(payment),
                getPaymentAmount(payment),
                getPaymentMethod(payment),
                normalizeStatus(payment.status),
                formatDate(getPaymentDate(payment))

            ];

        });

        function escapeCSV(value) {

            let text = String(value ?? "");

            if (/^[=+\-@\t\r]/.test(text)) {
                text = "'" + text;
            }

            return '"' + text.replace(/"/g, '""') + '"';

        }

        const csvContent = [

            headers,
            ...rows

        ].map(row =>

            row.map(escapeCSV).join(",")

        ).join("\n");

        const blob = new Blob(
            ["\uFEFF" + csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = "HotelSphere_Payments.csv";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    }

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportPayments
        );

    }


    // -------------------------------------------------
    // 9. LOAD PAYMENTS FROM ORACLE API
    // -------------------------------------------------

    async function loadPayments() {

        hideMessage(errorMessage);
        hideMessage(emptyMessage);

        showMessage(
            loadingMessage,
            "Loading payment records..."
        );

        if (refreshButton) {
            refreshButton.disabled = true;
        }

        try {

            if (
                !window.HSApi ||
                typeof window.HSApi.payments !== "function"
            ) {

                throw new Error(
                    "Payments API is not available. Check api.js."
                );

            }

            const response = await window.HSApi.payments();

            const payments = Array.isArray(response)
                ? response
                : response?.items;

            if (!Array.isArray(payments)) {

                throw new Error(
                    "Invalid payment data received from server."
                );

            }

            allPayments = payments;

            updateStatistics(allPayments);

            filterPayments();

        } catch (error) {

            console.error(
                "Payment loading error:",
                error
            );

            showMessage(
                errorMessage,
                error.message || "Unable to load payments."
            );

        } finally {

            hideMessage(loadingMessage);

            if (refreshButton) {
                refreshButton.disabled = false;
            }

        }

    }


    // -------------------------------------------------
    // 10. REFRESH PAYMENTS
    // -------------------------------------------------

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadPayments
        );

    }


    // -------------------------------------------------
    // 11. INITIALIZE PAYMENT MANAGEMENT
    // -------------------------------------------------

    if (paymentTableBody) {

        loadPayments();

    }

});
