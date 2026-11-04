
/* =====================================================
   HOTELSPHERE - BOOKING CONFIRMATION
   File: frontend/js/confirmation.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. GET HTML ELEMENTS
    // -------------------------------------------------

    const bookingStatus = document.getElementById("bookingStatus");
    const bookingIdElement = document.getElementById("confirmationBookingId");

    const copyBookingButton = document.getElementById("copyBookingId");

    const roomElement = document.getElementById("confirmationRoomName");
    const hotelElement = document.getElementById("confirmationHotelName");

    const guestElement = document.getElementById("confirmationGuestName");
    const emailElement = document.getElementById("confirmationEmail");
    const phoneElement = document.getElementById("confirmationPhone");

    const checkInElement = document.getElementById("confirmationCheckIn");
    const checkOutElement = document.getElementById("confirmationCheckOut");
    const guestsElement = document.getElementById("confirmationGuests");
    const nightsElement = document.getElementById("confirmationNights");

    const paymentElement = document.getElementById("confirmationPaymentMethod");
    const totalElement = document.getElementById("confirmationTotal");

    const invoiceButton = document.getElementById("downloadInvoiceButton");
    const printButton = document.getElementById("printConfirmationButton");

    // -------------------------------------------------
    // 2. HELPER FUNCTIONS
    // -------------------------------------------------

    function formatPrice(amount) {

        return "₹" + Number(amount || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });

    }

    function formatDate(dateString) {

        if (!dateString) {
            return "--";
        }

        const date = new Date(dateString + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    }

    function setText(element, value) {

        if (element) {
            element.textContent =
                value !== undefined && value !== null && value !== ""
                    ? value
                    : "--";
        }

    }

    function getBookingId(response) {

        if (!response) {
            return null;
        }

        const booking = response.booking || response.data || response;

        return (
            booking.booking_id ||
            booking.bookingId ||
            booking.id ||
            booking.reference_number ||
            booking.referenceNumber ||
            null
        );

    }

    function getBookingStatus(response) {

        if (!response) {
            return "CONFIRMED";
        }

        const booking = response.booking || response.data || response;

        return (
            booking.booking_status ||
            booking.status ||
            booking.bookingStatus ||
            "CONFIRMED"
        );

    }

    // -------------------------------------------------
    // 3. LOAD CONFIRMATION DATA
    // -------------------------------------------------

    let confirmationData = null;

    try {

        const savedData = sessionStorage.getItem(
            "hotelsphere-confirmation"
        );

        if (savedData) {
            confirmationData = JSON.parse(savedData);
        }

    } catch (error) {

        console.error("Confirmation data error:", error);

    }

    if (!confirmationData) {

        setText(bookingStatus, "Confirmation details unavailable");
        setText(bookingIdElement, "Not available");

        if (invoiceButton) {
            invoiceButton.disabled = true;
        }

        return;

    }

    // -------------------------------------------------
    // 4. EXTRACT BOOKING INFORMATION
    // -------------------------------------------------

    const response = confirmationData.booking || {};
    const guest = confirmationData.guest || {};
    const room = confirmationData.room || {};

    const bookingId = getBookingId(response);
    const status = getBookingStatus(response);

    const fullName = [
        guest.first_name,
        guest.last_name
    ].filter(Boolean).join(" ");

    // -------------------------------------------------
    // 5. DISPLAY BOOKING STATUS AND ID
    // -------------------------------------------------

    setText(bookingStatus, status);
    setText(bookingIdElement, bookingId || "Not available");

    if (bookingStatus) {

        bookingStatus.classList.remove(
            "confirmed",
            "pending",
            "cancelled"
        );

        const normalizedStatus = String(status).toLowerCase();

        if (normalizedStatus.includes("confirm")) {
            bookingStatus.classList.add("confirmed");
        } else if (normalizedStatus.includes("cancel")) {
            bookingStatus.classList.add("cancelled");
        } else {
            bookingStatus.classList.add("pending");
        }

    }

    // -------------------------------------------------
    // 6. DISPLAY GUEST DETAILS
    // -------------------------------------------------

    setText(guestElement, fullName);
    setText(emailElement, guest.email);
    setText(phoneElement, guest.phone);

    // -------------------------------------------------
    // 7. DISPLAY ROOM DETAILS
    // -------------------------------------------------

    setText(roomElement, room.roomName);
    setText(hotelElement, room.hotelName || "HotelSphere");

    setText(checkInElement, formatDate(room.checkIn));
    setText(checkOutElement, formatDate(room.checkOut));

    setText(guestsElement, room.guests);

    setText(
        nightsElement,
        room.nights || confirmationData.room?.nights
    );

    // -------------------------------------------------
    // 8. DISPLAY PAYMENT DETAILS
    // -------------------------------------------------

    const paymentMethod =
        confirmationData.paymentMethod || "PAY_AT_HOTEL";

    const paymentLabels = {
        ONLINE: "Online Payment",
        UPI: "UPI Payment",
        PAY_AT_HOTEL: "Pay at Hotel"
    };

    setText(
        paymentElement,
        paymentLabels[paymentMethod] || paymentMethod
    );

    setText(
        totalElement,
        formatPrice(confirmationData.total)
    );

    // -------------------------------------------------
    // 9. COPY BOOKING REFERENCE
    // -------------------------------------------------

    if (copyBookingButton) {

        copyBookingButton.addEventListener("click", async function () {

            if (!bookingId) {
                alert("Booking reference is not available.");
                return;
            }

            try {

                await navigator.clipboard.writeText(String(bookingId));

                const originalText = copyBookingButton.textContent;

                copyBookingButton.textContent = "Copied!";

                setTimeout(function () {
                    copyBookingButton.textContent = originalText;
                }, 1500);

            } catch (error) {

                console.error("Copy error:", error);

                alert("Unable to copy booking reference.");

            }

        });

    }

    // -------------------------------------------------
    // 10. DOWNLOAD INVOICE
    // -------------------------------------------------

    if (invoiceButton) {

        invoiceButton.addEventListener("click", function () {

            const invoiceContent = `
HOTELSPHERE
Booking Confirmation / Invoice
========================================

Booking Reference: ${bookingId || "Not available"}
Booking Status: ${status}

Guest Name: ${fullName || "--"}
Email: ${guest.email || "--"}
Phone: ${guest.phone || "--"}

Hotel: ${room.hotelName || "HotelSphere"}
Room: ${room.roomName || "--"}

Check-in: ${formatDate(room.checkIn)}
Check-out: ${formatDate(room.checkOut)}
Guests: ${room.guests || "--"}
Nights: ${room.nights || "--"}

Room Subtotal: ${formatPrice(confirmationData.subtotal)}
Taxes: ${formatPrice(confirmationData.taxes)}
Discount: ${formatPrice(confirmationData.discount)}
Total Amount: ${formatPrice(confirmationData.total)}

Payment Method: ${paymentLabels[paymentMethod] || paymentMethod}

========================================
Thank you for choosing HotelSphere!
This is a booking summary generated by the website.
Final tax invoice and payment status are subject to server records.
            `.trim();

            const blob = new Blob(
                [invoiceContent],
                { type: "text/plain;charset=utf-8" }
            );

            const downloadURL = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = downloadURL;
            link.download = `HotelSphere-Invoice-${bookingId || "Booking"}.txt`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(downloadURL);

        });

    }

    // -------------------------------------------------
    // 11. PRINT CONFIRMATION
    // -------------------------------------------------

    if (printButton) {

        printButton.addEventListener("click", function () {

            window.print();

        });

    }

});
