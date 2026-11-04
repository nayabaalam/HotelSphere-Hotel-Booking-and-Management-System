
/* =====================================================
   HOTELSPHERE - BOOKING CHECKOUT
   File: frontend/js/checkout.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // 1. HTML ELEMENTS
    const checkoutForm = document.getElementById("checkoutForm");

    const roomNameElement = document.getElementById("checkoutRoomName");
    const hotelNameElement = document.getElementById("checkoutHotelName");

    // Optional room category element
    const roomCategoryElement =
        document.getElementById("checkoutRoomCategory") ||
        document.getElementById("checkoutRoomCollection") ||
        document.getElementById("checkoutRoomType");

    const checkInElement = document.getElementById("checkoutCheckIn");
    const checkOutElement = document.getElementById("checkoutCheckOut");
    const guestsElement = document.getElementById("checkoutGuests");
    const nightsElement = document.getElementById("checkoutNights");

    const roomPriceElement = document.getElementById("checkoutRoomPrice");
    const nightCountElement = document.getElementById("checkoutNightCount");

    const subtotalElement = document.getElementById("checkoutSubtotal");
    const taxesElement = document.getElementById("checkoutTaxes");
    const discountElement = document.getElementById("checkoutDiscount");
    const totalElement = document.getElementById("checkoutTotal");

    const messageElement = document.getElementById("checkoutMessage");
    const submitButton = document.getElementById("confirmBookingButton");

    // 2. HELPER FUNCTIONS

    function formatPrice(amount) {
        return "₹" + Number(amount).toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });
    }

    function showMessage(message, type = "error") {
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = "form-message " + type;
            messageElement.style.display = "block";
        } else {
            alert(message);
        }
    }

    function hideMessage() {
        if (messageElement) {
            messageElement.textContent = "";
            messageElement.style.display = "none";
        }
    }

    function getNights(checkIn, checkOut) {
        if (!checkIn || !checkOut) return 0;

        const [y1, m1, d1] = checkIn.split("-").map(Number);
        const [y2, m2, d2] = checkOut.split("-").map(Number);

        const start = Date.UTC(y1, m1 - 1, d1);
        const end = Date.UTC(y2, m2 - 1, d2);

        return Math.round((end - start) / 86400000);
    }

    function getFieldValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    }

    function getSelectedPaymentMethod() {
        const selected = document.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        return selected ? selected.value : "PAY_AT_HOTEL";
    }

    // 3. LOAD PENDING BOOKING

    let pendingBooking = null;

    try {
        const savedData = sessionStorage.getItem(
            "hotelsphere-pending-booking"
        );

        if (savedData) {
            pendingBooking = JSON.parse(savedData);
        }
    } catch (error) {
        console.error("Booking data error:", error);
        showMessage("Unable to read booking information. Please select your room again.");
    }

    if (!pendingBooking) {
        showMessage("No booking information found. Please select a room first.");

        if (submitButton) {
            submitButton.disabled = true;
        }

        return;
    }

    // 4. DISPLAY ROOM INFORMATION

    const roomType = pendingBooking.roomType || "Room";
    const roomName = pendingBooking.roomName || "Selected Room";
    const branchName =
        pendingBooking.branch ||
        pendingBooking.hotelName ||
        "HotelSphere";

    if (roomNameElement) {
        roomNameElement.textContent = roomName;
    }

    if (hotelNameElement) {
        hotelNameElement.textContent = branchName;
    }

    if (roomCategoryElement) {
        roomCategoryElement.textContent = roomType.toUpperCase();
    }

    if (checkInElement) {
        checkInElement.textContent = pendingBooking.checkIn || "--";
    }

    if (checkOutElement) {
        checkOutElement.textContent = pendingBooking.checkOut || "--";
    }

    if (guestsElement) {
        guestsElement.textContent = pendingBooking.guests || 1;
    }

    const nights = getNights(
        pendingBooking.checkIn,
        pendingBooking.checkOut
    );

    if (nightsElement) {
        nightsElement.textContent = nights;
    }

    if (nightCountElement) {
        nightCountElement.textContent = nights;
    }

    const roomPrice = Number(pendingBooking.roomPrice) || 0;

    if (roomPriceElement) {
        roomPriceElement.textContent = formatPrice(roomPrice);
    }

    // 5. CALCULATE BILL

    const subtotal = roomPrice * nights;

    // Demo tax rate: 12%
    const taxRate = 0.12;
    const taxes = subtotal * taxRate;

    const discount = 0;
    const total = subtotal + taxes - discount;

    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(subtotal);
    }

    if (taxesElement) {
        taxesElement.textContent = formatPrice(taxes);
    }

    if (discountElement) {
        discountElement.textContent = formatPrice(discount);
    }

    if (totalElement) {
        totalElement.textContent = formatPrice(total);
    }

    // 6. VALIDATE CHECKOUT

    function validateCheckout() {
        const firstName = getFieldValue("firstName");
        const lastName = getFieldValue("lastName");
        const email = getFieldValue("email");
        const phone = getFieldValue("phone");
        const country = getFieldValue("country");
        const city = getFieldValue("city");

        if (!firstName || !lastName) {
            showMessage("Please enter your full name.");
            return false;
        }

        if (!email) {
            showMessage("Please enter your email address.");
            return false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            showMessage("Please enter a valid email address.");
            return false;
        }

        if (!phone) {
            showMessage("Please enter your phone number.");
            return false;
        }

        const phoneDigits = phone.replace(/\D/g, "");

        if (phoneDigits.length < 10 || phoneDigits.length > 15) {
            showMessage("Please enter a valid phone number.");
            return false;
        }

        if (!country || !city) {
            showMessage("Please enter your country and city.");
            return false;
        }

        if (
            !pendingBooking.roomId ||
            nights <= 0 ||
            roomPrice <= 0
        ) {
            showMessage("Your room booking details are invalid.");
            return false;
        }

        return true;
    }

    // 7. SUBMIT BOOKING TO ORACLE THROUGH ORDS

    if (checkoutForm) {

        checkoutForm.addEventListener("submit", async function (event) {

            event.preventDefault();
            hideMessage();

            if (!validateCheckout()) {
                return;
            }

            const paymentMethod = getSelectedPaymentMethod();

            const bookingPayload = {
                room_id: Number(pendingBooking.roomId),

                check_in: pendingBooking.checkIn,
                check_out: pendingBooking.checkOut,

                guests: Number(pendingBooking.guests) || 1,
                adults: Number(pendingBooking.guests) || 1,
                children: 0,

                full_name: [
                    getFieldValue("firstName"),
                    getFieldValue("lastName")
                ].filter(Boolean).join(" "),

                email: getFieldValue("email"),
                phone: getFieldValue("phone"),

                address: [
                    getFieldValue("city"),
                    getFieldValue("country")
                ].filter(Boolean).join(", "),

                special_requests: getFieldValue("specialRequests"),

                payment_method: paymentMethod
            };

            try {

                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Processing...";
                }

                if (
                    !window.HSApi ||
                    typeof window.HSApi.addBooking !== "function"
                ) {
                    throw new Error(
                        "Booking API is not available. Please check api.js."
                    );
                }

                console.log("Sending booking payload:", bookingPayload);

                const response = await window.HSApi.addBooking(
                    bookingPayload
                );

                console.log("Booking API response:", response);

                sessionStorage.setItem(
                    "hotelsphere-confirmation",
                    JSON.stringify({
                        booking: response,
                        guest: bookingPayload,
                        room: pendingBooking,
                        subtotal: subtotal,
                        taxes: taxes,
                        discount: discount,
                        total: total,
                        paymentMethod: paymentMethod
                    })
                );

                window.location.href = "booking-confirmation.html";

            } catch (error) {

                console.error("Booking submission error:", error);

                showMessage(
                    error.message ||
                    "Booking could not be completed. Please try again."
                );

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Confirm Booking";
                }
            }
        });
    }

    console.log("HotelSphere checkout initialized successfully.");
    console.log("Selected room:", pendingBooking);
    console.log("Checkout total:", total);

})
/* =====================================================
   HOTELSPHERE - BOOKING CHECKOUT
   File: frontend/js/checkout.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // 1. HTML ELEMENTS
    const checkoutForm = document.getElementById("checkoutForm");

    const roomNameElement = document.getElementById("checkoutRoomName");
    const hotelNameElement = document.getElementById("checkoutHotelName");
    const roomCategoryElement = document.getElementById("checkoutRoomCategory");

    const checkInElement = document.getElementById("checkoutCheckIn");
    const checkOutElement = document.getElementById("checkoutCheckOut");
    const guestsElement = document.getElementById("checkoutGuests");
    const nightsElement = document.getElementById("checkoutNights");

    const roomPriceElement = document.getElementById("checkoutRoomPrice");
    const nightCountElement = document.getElementById("checkoutNightCount");

    const subtotalElement = document.getElementById("checkoutSubtotal");
    const taxesElement = document.getElementById("checkoutTaxes");
    const discountElement = document.getElementById("checkoutDiscount");
    const totalElement = document.getElementById("checkoutTotal");

    const messageElement = document.getElementById("checkoutMessage");
    const submitButton = document.getElementById("confirmBookingButton");

    // 2. HELPER FUNCTIONS

    function formatPrice(amount) {
        return "₹" + Number(amount).toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });
    }

    function showMessage(message, type = "error") {
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = "form-message " + type;
            messageElement.style.display = "block";
        } else {
            alert(message);
        }
    }

    function hideMessage() {
        if (messageElement) {
            messageElement.textContent = "";
            messageElement.style.display = "none";
        }
    }

    function getFieldValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    }

    function getNights(checkIn, checkOut) {
        if (!checkIn || !checkOut) return 0;

        const [y1, m1, d1] = checkIn.split("-").map(Number);
        const [y2, m2, d2] = checkOut.split("-").map(Number);

        const start = Date.UTC(y1, m1 - 1, d1);
        const end = Date.UTC(y2, m2 - 1, d2);

        return Math.round((end - start) / 86400000);
    }

    function getSelectedPaymentMethod() {
        const selected = document.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        return selected ? selected.value : "";
    }

    // 3. LOAD BOOKING DATA

    let pendingBooking = null;

    try {
        const savedData = sessionStorage.getItem(
            "hotelsphere-pending-booking"
        );

        if (savedData) {
            pendingBooking = JSON.parse(savedData);
        }
    } catch (error) {
        console.error("Booking data error:", error);
        showMessage("Unable to read booking information. Please select your room again.");
    }

    if (!pendingBooking) {
        showMessage("No booking information found. Please select a room first.");

        if (submitButton) {
            submitButton.disabled = true;
        }

        return;
    }

    // 4. DISPLAY ROOM INFORMATION

    const roomType = pendingBooking.roomType || "Room";
    const roomName = pendingBooking.roomName || "Selected Room";
    const branchName =
        pendingBooking.branch ||
        pendingBooking.hotelName ||
        "HotelSphere";

    const guests = Number(pendingBooking.guests) || 1;

    if (roomNameElement) {
        roomNameElement.textContent = roomName;
    }

    if (hotelNameElement) {
        hotelNameElement.textContent = branchName;
    }

    if (roomCategoryElement) {
        roomCategoryElement.textContent =
            roomType.toUpperCase() + " COLLECTION";
    }

    if (checkInElement) {
        checkInElement.textContent = pendingBooking.checkIn || "--";
    }

    if (checkOutElement) {
        checkOutElement.textContent = pendingBooking.checkOut || "--";
    }

    if (guestsElement) {
        guestsElement.textContent =
            guests + (guests === 1 ? " Guest" : " Guests");
    }

    const nights = getNights(
        pendingBooking.checkIn,
        pendingBooking.checkOut
    );

    if (nightsElement) {
        nightsElement.textContent =
            nights + (nights === 1 ? " Night" : " Nights");
    }

    if (nightCountElement) {
        nightCountElement.textContent = nights;
    }

    const roomPrice = Number(pendingBooking.roomPrice) || 0;

    if (roomPriceElement) {
        roomPriceElement.textContent = formatPrice(roomPrice);
    }

    // Update image description
    const roomImage = document.querySelector(".summary-room-image img");

    if (roomImage) {
        roomImage.alt = roomName + " at " + branchName;
    }

    // 5. CALCULATE BILL

    const subtotal = roomPrice * nights;

    // Demo tax rate: 12%
    const taxRate = 0.12;

    const taxes = subtotal * taxRate;
    const discount = 0;
    const total = subtotal + taxes - discount;

    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(subtotal);
    }

    if (taxesElement) {
        taxesElement.textContent = formatPrice(taxes);
    }

    if (discountElement) {
        discountElement.textContent = "- " + formatPrice(discount);
    }

    if (totalElement) {
        totalElement.textContent = formatPrice(total);
    }

    // 6. VALIDATE CHECKOUT FORM

    function validateCheckout() {

        const fullName = getFieldValue("guestName");
        const email = getFieldValue("guestEmail");
        const phone = getFieldValue("guestPhone");
        const country = getFieldValue("guestCountry");
        const city = getFieldValue("guestCity");

        const acceptTerms =
            document.getElementById("acceptBookingTerms");

        const confirmDetails =
            document.getElementById("confirmDetails");

        const paymentMethod = getSelectedPaymentMethod();

        if (!fullName) {
            showMessage("Please enter the guest's full name.");
            return false;
        }

        if (!email) {
            showMessage("Please enter your email address.");
            return false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            showMessage("Please enter a valid email address.");
            return false;
        }

        if (!phone) {
            showMessage("Please enter your mobile number.");
            return false;
        }

        const phoneDigits = phone.replace(/\D/g, "");

        if (phoneDigits.length !== 10) {
            showMessage("Please enter a valid 10-digit mobile number.");
            return false;
        }

        if (!country || !city) {
            showMessage("Please enter your country and city.");
            return false;
        }

        if (!paymentMethod) {
            showMessage("Please select a payment method.");
            return false;
        }

        if (!acceptTerms || !acceptTerms.checked) {
            showMessage("Please accept the Terms & Conditions and Privacy Policy.");
            return false;
        }

        if (!confirmDetails || !confirmDetails.checked) {
            showMessage("Please confirm that your booking details are correct.");
            return false;
        }

        if (
            !pendingBooking.roomId ||
            nights <= 0 ||
            roomPrice <= 0
        ) {
            showMessage("Your room booking details are invalid.");
            return false;
        }

        return true;
    }

    // 7. SUBMIT BOOKING

    if (checkoutForm) {

        checkoutForm.addEventListener("submit", async function (event) {

            event.preventDefault();
            hideMessage();

            if (!validateCheckout()) {
                return;
            }

            const paymentMethod = getSelectedPaymentMethod();

            const bookingPayload = {

                room_id: Number(pendingBooking.roomId),

                check_in: pendingBooking.checkIn,
                check_out: pendingBooking.checkOut,

                guests: guests,
                adults: guests,
                children: 0,

                full_name: getFieldValue("guestName"),
                email: getFieldValue("guestEmail"),
                phone: getFieldValue("guestPhone"),

                address: [
                    getFieldValue("guestCity"),
                    getFieldValue("guestCountry")
                ].filter(Boolean).join(", "),

                special_requests: getFieldValue("specialRequest"),

                payment_method: paymentMethod
            };

            try {

                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Processing...";
                }

                // Check API availability
                if (
                    !window.HSApi ||
                    typeof window.HSApi.addBooking !== "function"
                ) {
                    throw new Error(
                        "Booking API is not available. Please check api.js."
                    );
                }

                console.log("Booking payload:", bookingPayload);

                // Submit booking to Oracle through ORDS
                const response = await window.HSApi.addBooking(
                    bookingPayload
                );

                console.log("Booking API response:", response);

                // Save confirmation details
                sessionStorage.setItem(
                    "hotelsphere-confirmation",
                    JSON.stringify({

                        booking: response,

                        guest: bookingPayload,

                        room: pendingBooking,

                        subtotal: subtotal,

                        taxes: taxes,

                        discount: discount,

                        total: total,

                        paymentMethod: paymentMethod
                    })
                );

                // Navigate after successful response
                window.location.href = "booking-confirmation.html";

            } catch (error) {

                console.error("Booking submission error:", error);

                showMessage(
                    error.message ||
                    "Booking could not be completed. Please try again."
                );

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Confirm Booking";
                }
            }
        });
    }

    console.log("HotelSphere checkout initialized successfully.");
    console.log("Selected room:", pendingBooking);
    console.log("Checkout total:", total);

});

