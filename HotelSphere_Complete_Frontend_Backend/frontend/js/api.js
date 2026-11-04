
(function () {
    "use strict";

    // -----------------------------------------
    // HOTELSPHERE API CONFIGURATION
    // -----------------------------------------

    const config = window.HOTELSPHERE_CONFIG || {};

    const API_BASE = (config.API_BASE ||
        "http://localhost:8080/ords/hotelsphere/api/"
    ).replace(/\/+$/, "") + "/";

    const REQUEST_TIMEOUT = 20000;


    // -----------------------------------------
    // COMMON API REQUEST FUNCTION
    // -----------------------------------------

    async function request(endpoint, options = {}) {

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, REQUEST_TIMEOUT);

        const headers = {
            "Accept": "application/json",
            ...options.headers
        };

        const requestOptions = {
            ...options,
            headers,
            signal: controller.signal
        };

        if (options.body && typeof options.body !== "string") {
            requestOptions.body = JSON.stringify(options.body);
            headers["Content-Type"] = "application/json";
        }

        try {

            const response = await fetch(
                API_BASE + endpoint.replace(/^\/+/, ""),
                requestOptions
            );

            const responseText = await response.text();

            let data = null;

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    data = responseText;
                }
            }

            if (!response.ok) {

                const message =
                    data?.message ||
                    data?.error ||
                    data?.detail ||
                    (typeof data === "string" ? data : null) ||
                    `HTTP Error ${response.status}`;

                throw new Error(message);
            }

            return data;

        } catch (error) {

            if (error.name === "AbortError") {
                throw new Error(
                    "Request timeout. ORDS server response nahi de raha."
                );
            }

            if (error instanceof TypeError) {
                throw new Error(
                    "API connection failed. ORDS server aur API URL check karo."
                );
            }

            throw error;

        } finally {
            clearTimeout(timeout);
        }
    }


    // -----------------------------------------
    // DASHBOARD APIs
    // -----------------------------------------

    async function getDashboard() {
        return request("dashboard");
    }


    // -----------------------------------------
    // ROOM APIs
    // -----------------------------------------

    async function getRooms() {
        return request("rooms");
    }


    // -----------------------------------------
    // CUSTOMER APIs
    // -----------------------------------------

    async function getCustomers() {
        return request("customers");
    }

    async function addCustomer(customerData) {

        if (!customerData || !customerData.full_name) {
            throw new Error("Customer name is required.");
        }

        return request("customers", {
            method: "POST",
            body: customerData
        });
    }


    // -----------------------------------------
    // BOOKING APIs
    // -----------------------------------------

    async function getBookings() {
        return request("bookings");
    }

    async function addBooking(bookingData) {

        if (!bookingData) {
            throw new Error("Booking details are required.");
        }

        return request("bookings", {
            method: "POST",
            body: bookingData
        });
    }

    async function cancelBooking(bookingId) {

        if (!bookingId) {
            throw new Error("Booking ID is required.");
        }

        return request(
            `bookings/${encodeURIComponent(bookingId)}/cancel`,
            {
                method: "POST"
            }
        );
    }


    // -----------------------------------------
    // PAYMENT APIs
    // -----------------------------------------

    async function getPayments() {
        return request("payments");
    }

    async function addPayment(paymentData) {

        if (!paymentData) {
            throw new Error("Payment details are required.");
        }

        return request("payments", {
            method: "POST",
            body: paymentData
        });
    }


    // -----------------------------------------
    // API HEALTH CHECK
    // -----------------------------------------

    async function checkHealth() {
        return request("health");
    }


    // -----------------------------------------
    // GLOBAL API OBJECT
    // -----------------------------------------

    window.HSApi = Object.freeze({

        // Dashboard
        dashboard: getDashboard,

        // Rooms
        rooms: getRooms,

        // Customers
        customers: getCustomers,
        addCustomer: addCustomer,

        // Bookings
        bookings: getBookings,
        addBooking: addBooking,
        cancelBooking: cancelBooking,

        // Payments
        payments: getPayments,
        addPayment: addPayment,

        // Health
        health: checkHealth

    });

})();
