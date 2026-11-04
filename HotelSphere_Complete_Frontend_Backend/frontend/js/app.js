
/* ============================================================
   HOTELSPHERE - MAIN APPLICATION JAVASCRIPT
   Frontend: HTML + CSS + JavaScript
   Backend: Oracle Database + ORDS REST API
============================================================ */

"use strict";


/* ============================================================
   1. GLOBAL HELPERS
============================================================ */

const $ = (id) => document.getElementById(id);

const API = window.HSApi;


/* Safely read values from API response */

function getValue(object, ...keys) {
    for (const key of keys) {
        if (
            object &&
            object[key] !== undefined &&
            object[key] !== null
        ) {
            return object[key];
        }
    }

    return "";
}


/* Convert different API response formats into arrays */

function toArray(response) {

    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.items)) {
        return response.items;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.rows)) {
        return response.rows;
    }

    return [];
}


/* Escape HTML to prevent injected markup */

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, (character) => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


/* Format Indian currency */

function money(value) {

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}


/* Format date */

function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


/* ============================================================
   2. NOTIFICATION SYSTEM
============================================================ */

let toastTimer;


function notify(message, type = "success") {

    const toast = $("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    clearTimeout(toastTimer);

    toast.textContent = message;

    toast.className = "";
    toast.classList.add("show");

    if (type === "error") {
        toast.classList.add("error");
    } else {
        toast.classList.add("success");
    }

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}


/* Display form messages */

function showMessage(id, message, type = "success") {

    const element = $(id);

    if (!element) return;

    element.textContent = message;

    element.className = type === "error"
        ? "text-danger"
        : "text-success";
}


/* ============================================================
   3. LOADING AND ERROR HELPERS
============================================================ */

function loadingRow(id, colspan, message = "Loading...") {

    const element = $(id);

    if (!element) return;

    element.innerHTML = `
        <tr>
            <td colspan="${colspan}" class="loading">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


function errorRow(id, colspan, message) {

    const element = $(id);

    if (!element) return;

    element.innerHTML = `
        <tr>
            <td colspan="${colspan}" class="text-danger">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


function emptyRow(id, colspan, message) {

    const element = $(id);

    if (!element) return;

    element.innerHTML = `
        <tr>
            <td colspan="${colspan}" class="empty-state">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


/* ============================================================
   4. STATUS BADGE
============================================================ */

function badge(status) {

    const value = String(status || "UNKNOWN").toUpperCase();

    let className = "info";

    if (
        value.includes("AVAILABLE") ||
        value.includes("CONFIRMED") ||
        value.includes("PAID") ||
        value.includes("COMPLETED") ||
        value.includes("ACTIVE") ||
        value.includes("SUCCESS")
    ) {
        className = "success";
    }

    else if (
        value.includes("PENDING") ||
        value.includes("MAINTENANCE") ||
        value.includes("PROCESSING")
    ) {
        className = "warning";
    }

    else if (
        value.includes("CANCELLED") ||
        value.includes("FAILED") ||
        value.includes("REJECTED") ||
        value.includes("OCCUPIED")
    ) {
        className = "danger";
    }

    return `
        <span class="badge ${className}">
            ${escapeHTML(value.replaceAll("_", " "))}
        </span>
    `;
}


/* ============================================================
   5. API CHECK
============================================================ */

function checkAPI() {

    if (!API) {
        console.error("HSApi is not available.");

        notify(
            "API configuration not found. Check api.js and config.js.",
            "error"
        );

        return false;
    }

    return true;
}


/* ============================================================
   6. DASHBOARD
============================================================ */

async function dashboard() {

    if (!checkAPI()) return;

    try {

        const response = await API.dashboard();

        const data = response?.data || response || {};

        const totalRooms = getValue(
            data,
            "total_rooms",
            "totalRooms",
            "room_count"
        );

        const occupiedRooms = getValue(
            data,
            "occupied_rooms",
            "occupiedRooms"
        );

        const confirmedBookings = getValue(
            data,
            "confirmed_bookings",
            "confirmedBookings"
        );

        const totalCustomers = getValue(
            data,
            "total_customers",
            "totalCustomers"
        );

        const totalRevenue = getValue(
            data,
            "total_revenue",
            "totalRevenue",
            "collected_revenue"
        );


        /* Dashboard statistics */

        if ($("totalRooms")) {
            $("totalRooms").textContent = totalRooms || 0;
        }

        if ($("occupiedRooms")) {
            $("occupiedRooms").textContent = occupiedRooms || 0;
        }

        if ($("confirmedBookings")) {
            $("confirmedBookings").textContent =
                confirmedBookings || 0;
        }

        if ($("totalCustomers")) {
            $("totalCustomers").textContent = totalCustomers || 0;
        }

        if ($("totalRevenue")) {
            $("totalRevenue").textContent = money(totalRevenue);
        }


        /* Report statistics */

        if ($("reportRooms")) {
            $("reportRooms").textContent = totalRooms || 0;
        }

        if ($("reportOccupied")) {
            $("reportOccupied").textContent = occupiedRooms || 0;
        }

        if ($("reportBookings")) {
            $("reportBookings").textContent =
                confirmedBookings || 0;
        }

        if ($("reportRevenue")) {
            $("reportRevenue").textContent = money(totalRevenue);
        }


        /* Recent bookings */

        if ($("recentBookings")) {

            const bookings = toArray(
                data.recent_bookings ||
                data.recentBookings ||
                data.bookings
            );

            renderRecentBookings(bookings);
        }

    } catch (error) {

        console.error("Dashboard error:", error);

        if ($("recentBookings")) {
            errorRow(
                "recentBookings",
                6,
                "Unable to load recent bookings."
            );
        }

        notify("Unable to load dashboard data.", "error");
    }
}


/* Render recent bookings */

function renderRecentBookings(bookings) {

    const table = $("recentBookings");

    if (!table) return;

    if (!bookings.length) {

        emptyRow(
            "recentBookings",
            6,
            "No recent bookings found."
        );

        return;
    }

    const latestBookings = bookings.slice().reverse().slice(0, 6);

    table.innerHTML = latestBookings.map(booking => {

        const code = getValue(
            booking,
            "booking_code",
            "booking_number",
            "booking_id",
            "id"
        );

        const guest = getValue(
            booking,
            "customer_name",
            "full_name",
            "guest_name"
        );

        const room = getValue(
            booking,
            "room_number",
            "room"
        );

        const checkIn = getValue(
            booking,
            "check_in",
            "check_in_date"
        );

        const amount = getValue(
            booking,
            "total_amount",
            "total",
            "amount"
        );

        const status = getValue(
            booking,
            "booking_status",
            "status"
        );

        return `
            <tr>
                <td><strong>${escapeHTML(code)}</strong></td>
                <td>${escapeHTML(guest)}</td>
                <td>${escapeHTML(room)}</td>
                <td>${formatDate(checkIn)}</td>
                <td>${money(amount)}</td>
                <td>${badge(status)}</td>
            </tr>
        `;

    }).join("");
}


/* ============================================================
   7. ROOMS MANAGEMENT
============================================================ */

let allRooms = [];


async function rooms() {

    if (!checkAPI()) return;

    if (!$("roomsTable")) return;

    loadingRow("roomsTable", 7, "Loading room inventory...");

    try {

        const response = await API.rooms();

        allRooms = toArray(response);

        renderRooms(allRooms);

        populateRoomDropdown(allRooms);

    } catch (error) {

        console.error("Rooms error:", error);

        errorRow(
            "roomsTable",
            7,
            "Unable to load room records."
        );
    }
}


/* Render rooms table */

function renderRooms(roomList) {

    const table = $("roomsTable");

    if (!table) return;

    if (!roomList.length) {

        emptyRow(
            "roomsTable",
            7,
            "No rooms found."
        );

        return;
    }

    table.innerHTML = roomList.map(room => {

        const roomNumber = getValue(
            room,
            "room_number",
            "room_no"
        );

        const roomType = getValue(
            room,
            "room_type",
            "type_name"
        );

        const branch = getValue(
            room,
            "branch",
            "branch_name"
        );

        const floor = getValue(
            room,
            "floor_no",
            "floor"
        );

        const capacity = getValue(
            room,
            "capacity",
            "max_guests"
        );

        const rate = getValue(
            room,
            "rate",
            "room_rate",
            "price"
        );

        const status = getValue(
            room,
            "status",
            "room_status"
        );

        return `
            <tr>
                <td><strong>${escapeHTML(roomNumber)}</strong></td>
                <td>${escapeHTML(roomType)}</td>
                <td>${escapeHTML(branch)}</td>
                <td>${escapeHTML(floor)}</td>
                <td>${escapeHTML(capacity)}</td>
                <td><strong>${money(rate)}</strong></td>
                <td>${badge(status)}</td>
            </tr>
        `;

    }).join("");
}


/* Room search */

function initializeRoomSearch() {

    const search = $("roomSearch");

    if (!search) return;

    search.addEventListener("input", () => {

        const query = search.value.trim().toLowerCase();

        const filtered = allRooms.filter(room => {

            const searchable = [
                getValue(room, "room_number", "room_no"),
                getValue(room, "room_type", "type_name"),
                getValue(room, "branch", "branch_name"),
                getValue(room, "status", "room_status")
            ].join(" ").toLowerCase();

            return searchable.includes(query);
        });

        renderRooms(filtered);
    });
}


/* Populate room dropdown */

function populateRoomDropdown(roomList) {

    const select = $("bookingRoom");

    if (!select) return;

    const previousValue = select.value;

    const availableRooms = roomList.filter(room => {

        const status = String(
            getValue(room, "status", "room_status")
        ).toUpperCase();

        return status === "AVAILABLE";
    });

    select.innerHTML = `
        <option value="">Select available room</option>

        ${availableRooms.map(room => {

            const id = getValue(room, "room_id", "id");

            const number = getValue(
                room,
                "room_number",
                "room_no"
            );

            const type = getValue(
                room,
                "room_type",
                "type_name"
            );

            return `
                <option value="${escapeHTML(id)}">
                    ${escapeHTML(number)} - ${escapeHTML(type)}
                </option>
            `;

        }).join("")}
    `;

    if (
        previousValue &&
        availableRooms.some(room =>
            String(getValue(room, "room_id", "id")) === previousValue
        )
    ) {
        select.value = previousValue;
    }
}


/* ============================================================
   8. CUSTOMER MANAGEMENT
============================================================ */

let allCustomers = [];


async function customers() {

    if (!checkAPI()) return;

    if (!$("customersTable")) return;

    loadingRow(
        "customersTable",
        5,
        "Loading customer records..."
    );

    try {

        const response = await API.customers();

        allCustomers = toArray(response);

        renderCustomers(allCustomers);

        populateCustomerDropdown(allCustomers);

    } catch (error) {

        console.error("Customers error:", error);

        errorRow(
            "customersTable",
            5,
            "Unable to load customer records."
        );
    }
}


/* Render customer table */

function renderCustomers(customerList) {

    const table = $("customersTable");

    if (!table) return;

    if (!customerList.length) {

        emptyRow(
            "customersTable",
            5,
            "No customers found."
        );

        return;
    }

    table.innerHTML = customerList.map(customer => {

        const name = getValue(
            customer,
            "full_name",
            "customer_name",
            "name"
        );

        const email = getValue(
            customer,
            "email",
            "email_address"
        );

        const phone = getValue(
            customer,
            "phone",
            "phone_number"
        );

        const tier = getValue(
            customer,
            "loyalty_tier",
            "tier"
        );

        const points = getValue(
            customer,
            "loyalty_points",
            "points"
        );

        return `
            <tr>
                <td><strong>${escapeHTML(name)}</strong></td>
                <td>${escapeHTML(email)}</td>
                <td>${escapeHTML(phone)}</td>
                <td>${badge(tier || "STANDARD")}</td>
                <td><strong>${escapeHTML(points || 0)}</strong></td>
            </tr>
        `;

    }).join("");
}


/* Customer search */

function initializeCustomerSearch() {

    const search = $("customerSearch");

    if (!search) return;

    search.addEventListener("input", () => {

        const query = search.value.trim().toLowerCase();

        const filtered = allCustomers.filter(customer => {

            const searchable = [
                getValue(customer, "full_name", "customer_name", "name"),
                getValue(customer, "email", "email_address"),
                getValue(customer, "phone", "phone_number")
            ].join(" ").toLowerCase();

            return searchable.includes(query);
        });

        renderCustomers(filtered);
    });
}


/* Populate customer dropdown */

function populateCustomerDropdown(customerList) {

    const select = $("bookingCustomer");

    if (!select) return;

    const previousValue = select.value;

    select.innerHTML = `
        <option value="">Select customer</option>

        ${customerList.map(customer => {

            const id = getValue(
                customer,
                "customer_id",
                "id"
            );

            const name = getValue(
                customer,
                "full_name",
                "customer_name",
                "name"
            );

            return `
                <option value="${escapeHTML(id)}">
                    ${escapeHTML(name)}
                </option>
            `;

        }).join("")}
    `;

    select.value = previousValue;
}


/* Add customer */

function initializeCustomerForm() {

    const form = $("customerForm");

    if (!form) return;

    form.addEventListener("submit", async event => {

        event.preventDefault();

        if (!checkAPI()) return;

        const name = $("customerName")?.value.trim();
        const email = $("customerEmail")?.value.trim();
        const phone = $("customerPhone")?.value.trim();

        if (!name || !email) {

            showMessage(
                "customerMessage",
                "Name and email are required.",
                "error"
            );

            return;
        }

        const button = form.querySelector('[type="submit"]');

        if (button) button.disabled = true;

        try {

            const result = await API.addCustomer({
                full_name: name,
                email: email,
                phone: phone
            });

            showMessage(
                "customerMessage",
                "Customer saved successfully."
            );

            notify("Customer added successfully.");

            form.reset();

            await customers();

        } catch (error) {

            console.error("Add customer error:", error);

            showMessage(
                "customerMessage",
                error.message || "Unable to save customer.",
                "error"
            );

            notify("Customer registration failed.", "error");
        }

        finally {

            if (button) button.disabled = false;
        }
    });
}


/* ============================================================
   9. BOOKINGS MANAGEMENT
============================================================ */

let allBookings = [];


async function bookings() {

    if (!checkAPI()) return;

    if (!$("bookingsTable")) return;

    loadingRow(
        "bookingsTable",
        8,
        "Loading reservations..."
    );

    try {

        const response = await API.bookings();

        allBookings = toArray(response);

        renderBookings(allBookings);

        populatePaymentBookingDropdown(allBookings);

    } catch (error) {

        console.error("Bookings error:", error);

        errorRow(
            "bookingsTable",
            8,
            "Unable to load booking records."
        );
    }
}


/* Render bookings */

function renderBookings(bookingList) {

    const table = $("bookingsTable");

    if (!table) return;

    if (!bookingList.length) {

        emptyRow(
            "bookingsTable",
            8,
            "No reservations found."
        );

        return;
    }

    table.innerHTML = bookingList.map(booking => {

        const id = getValue(
            booking,
            "booking_id",
            "id"
        );

        const code = getValue(
            booking,
            "booking_code",
            "booking_number",
            "booking_id",
            "id"
        );

        const guest = getValue(
            booking,
            "customer_name",
            "full_name",
            "guest_name"
        );

        const room = getValue(
            booking,
            "room_number",
            "room"
        );

        const checkIn = getValue(
            booking,
            "check_in",
            "check_in_date"
        );

        const checkOut = getValue(
            booking,
            "check_out",
            "check_out_date"
        );

        const total = getValue(
            booking,
            "total_amount",
            "total",
            "amount"
        );

        const status = getValue(
            booking,
            "booking_status",
            "status"
        );

        const canCancel = [
            "CONFIRMED",
            "PENDING"
        ].includes(String(status).toUpperCase());

        return `
            <tr>
                <td><strong>${escapeHTML(code)}</strong></td>

                <td>${escapeHTML(guest)}</td>

                <td>${escapeHTML(room)}</td>

                <td>${formatDate(checkIn)}</td>

                <td>${formatDate(checkOut)}</td>

                <td><strong>${money(total)}</strong></td>

                <td>${badge(status)}</td>

                <td>
                    ${
                        canCancel
                        ? `
                            <button
                                type="button"
                                class="button danger cancel"
                                data-cancel-id="${escapeHTML(id)}"
                                style="min-height:32px;padding:6px 10px;font-size:10px;"
                            >
                                Cancel
                            </button>
                        `
                        : "—"
                    }
                </td>
            </tr>
        `;

    }).join("");
}


/* Create booking */

function initializeBookingForm() {

    const form = $("bookingForm");

    if (!form) return;

    form.addEventListener("submit", async event => {

        event.preventDefault();

        if (!checkAPI()) return;

        const customerId = $("bookingCustomer")?.value;
        const roomId = $("bookingRoom")?.value;

        const checkIn = $("checkIn")?.value;
        const checkOut = $("checkOut")?.value;

        const adults = Number($("adults")?.value || 1);
        const children = Number($("children")?.value || 0);

        if (!customerId || !roomId || !checkIn || !checkOut) {

            showMessage(
                "bookingMessage",
                "Please complete all required booking fields.",
                "error"
            );

            return;
        }

        if (checkOut <= checkIn) {

            showMessage(
                "bookingMessage",
                "Check-out date must be after check-in date.",
                "error"
            );

            return;
        }

        if (adults < 1 || children < 0) {

            showMessage(
                "bookingMessage",
                "Please enter valid guest numbers.",
                "error"
            );

            return;
        }

        const button = form.querySelector('[type="submit"]');

        if (button) button.disabled = true;

        try {

            await API.addBooking({
                customer_id: Number(customerId),
                room_id: Number(roomId),
                check_in: checkIn,
                check_out: checkOut,
                adults: adults,
                children: children
            });

            showMessage(
                "bookingMessage",
                "Reservation created successfully."
            );

            notify("New reservation created successfully.");

            form.reset();

            if ($("adults")) {
                $("adults").value = 2;
            }

            if ($("children")) {
                $("children").value = 0;
            }

            await Promise.all([
                bookings(),
                rooms(),
                dashboard()
            ]);

        } catch (error) {

            console.error("Create booking error:", error);

            showMessage(
                "bookingMessage",
                error.message || "Unable to create reservation.",
                "error"
            );

            notify("Booking creation failed.", "error");
        }

        finally {

            if (button) button.disabled = false;
        }
    });
}


/* Cancel booking */

async function cancelBooking(id) {

    if (!checkAPI()) return;

    const confirmed = window.confirm(
        "Are you sure you want to cancel this reservation?"
    );

    if (!confirmed) return;

    try {

        await API.cancelBooking(id);

        notify("Booking cancelled successfully.");

        await Promise.all([
            bookings(),
            rooms(),
            dashboard()
        ]);

    } catch (error) {

        console.error("Cancel booking error:", error);

        notify(
            error.message || "Unable to cancel booking.",
            "error"
        );
    }
}


/* Booking cancellation event delegation */

function initializeBookingActions() {

    const table = $("bookingsTable");

    if (!table) return;

    table.addEventListener("click", event => {

        const button = event.target.closest("[data-cancel-id]");

        if (!button) return;

        const id = button.getAttribute("data-cancel-id");

        if (id) {
            cancelBooking(id);
        }
    });
}


/* Populate payment booking dropdown */

function populatePaymentBookingDropdown(bookingList) {

    const select = $("paymentBooking");

    if (!select) return;

    const previousValue = select.value;

    const eligibleBookings = bookingList.filter(booking => {

        const status = String(
            getValue(booking, "booking_status", "status")
        ).toUpperCase();

        return ![
            "CANCELLED",
            "CANCELED"
        ].includes(status);
    });

    select.innerHTML = `
        <option value="">Select booking</option>

        ${eligibleBookings.map(booking => {

            const id = getValue(
                booking,
                "booking_id",
                "id"
            );

            const code = getValue(
                booking,
                "booking_code",
                "booking_number",
                "booking_id",
                "id"
            );

            const guest = getValue(
                booking,
                "customer_name",
                "full_name",
                "guest_name"
            );

            return `
                <option value="${escapeHTML(id)}">
                    ${escapeHTML(code)} - ${escapeHTML(guest)}
                </option>
            `;

        }).join("")}
    `;

    select.value = previousValue;
}


/* ============================================================
   10. PAYMENTS MANAGEMENT
============================================================ */

async function payments() {

    if (!checkAPI()) return;

    if (!$("paymentsTable")) return;

    loadingRow(
        "paymentsTable",
        6,
        "Loading payment records..."
    );

    try {

        const response = await API.payments();

        const paymentList = toArray(response);

        renderPayments(paymentList);

    } catch (error) {

        console.error("Payments error:", error);

        errorRow(
            "paymentsTable",
            6,
            "Unable to load payment records."
        );
    }
}


/* Render payment history */

function renderPayments(paymentList) {

    const table = $("paymentsTable");

    if (!table) return;

    if (!paymentList.length) {

        emptyRow(
            "paymentsTable",
            6,
            "No payment records found."
        );

        return;
    }

    table.innerHTML = paymentList.map(payment => {

        const id = getValue(
            payment,
            "payment_id",
            "id"
        );

        const booking = getValue(
            payment,
            "booking_code",
            "booking_number",
            "booking_id"
        );

        const amount = getValue(
            payment,
            "amount",
            "payment_amount"
        );

        const method = getValue(
            payment,
            "payment_method",
            "method"
        );

        const status = getValue(
            payment,
            "payment_status",
            "status"
        );

        const date = getValue(
            payment,
            "payment_date",
            "created_at",
            "transaction_date"
        );

        return `
            <tr>
                <td><strong>${escapeHTML(id)}</strong></td>

                <td>${escapeHTML(booking)}</td>

                <td><strong>${money(amount)}</strong></td>

                <td>${escapeHTML(method)}</td>

                <td>${badge(status)}</td>

                <td>${formatDate(date)}</td>
            </tr>
        `;

    }).join("");
}


/* Record payment */

function initializePaymentForm() {

    const form = $("paymentForm");

    if (!form) return;

    form.addEventListener("submit", async event => {

        event.preventDefault();

        if (!checkAPI()) return;

        const bookingId = $("paymentBooking")?.value;

        const amount = Number($("paymentAmount")?.value);

        const method = $("paymentMethod")?.value;

        const reference = $("paymentReference")?.value.trim();

        if (!bookingId || !amount || amount <= 0 || !method) {

            showMessage(
                "paymentMessage",
                "Please enter valid payment details.",
                "error"
            );

            return;
        }

        const button = form.querySelector('[type="submit"]');

        if (button) button.disabled = true;

        try {

            await API.addPayment({
                booking_id: Number(bookingId),
                amount: amount,
                payment_method: method,
                reference: reference
            });

            showMessage(
                "paymentMessage",
                "Payment recorded successfully."
            );

            notify("Payment recorded successfully.");

            form.reset();

            await Promise.all([
                payments(),
                dashboard()
            ]);

        } catch (error) {

            console.error("Payment error:", error);

            showMessage(
                "paymentMessage",
                error.message || "Unable to record payment.",
                "error"
            );

            notify("Payment recording failed.", "error");
        }

        finally {

            if (button) button.disabled = false;
        }
    });
}


/* ============================================================
   11. INITIALIZE APPLICATION
============================================================ */

async function initializeApp() {

    console.log("HotelSphere application initialized.");

    if (!checkAPI()) return;


    /* Dashboard page */

    if ($("recentBookings") || $("totalRooms")) {
        await dashboard();
    }


    /* Rooms page */

    if ($("roomsTable")) {

        initializeRoomSearch();

        await rooms();
    }


    /* Customers page */

    if ($("customersTable")) {

        initializeCustomerSearch();

        initializeCustomerForm();

        await customers();
    }


    /* Bookings page */

    if ($("bookingsTable")) {

        initializeBookingForm();

        initializeBookingActions();

        /*
           Customer and room dropdowns need their data.
           Booking list is loaded separately.
        */

        await Promise.all([
            customers(),
            rooms(),
            bookings()
        ]);
    }


    /* Payments page */

    if ($("paymentsTable")) {

        initializePaymentForm();

        /*
           Payment form needs booking information.
        */

        await Promise.all([
            bookings(),
            payments()
        ]);
    }


    /* Reports page */

    if ($("reportRooms")) {
        await dashboard();
    }


    console.log("HotelSphere page ready.");
}


/* ============================================================
   12. START APPLICATION
============================================================ */

document.addEventListener("DOMContentLoaded", initializeApp);
