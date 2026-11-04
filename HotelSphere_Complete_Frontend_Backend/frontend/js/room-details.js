
/* =========================================================
   HOTELSPHERE - ROOM DETAILS
   Oracle Database + ORDS API Integration
   File: frontend/js/room-details.js
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    // -----------------------------------------------------
    // 1. HTML ELEMENTS
    // -----------------------------------------------------

    const bookingForm = document.getElementById("roomBookingForm");

    const checkInInput = document.getElementById("detailCheckIn");
    const checkOutInput = document.getElementById("detailCheckOut");
    const guestsInput = document.getElementById("detailGuests");

    const roomNameElement = document.getElementById("roomName");
    const roomLocationElement = document.getElementById("roomLocation");
    const roomPriceElement = document.getElementById("roomPrice");

    const summaryPrice = document.getElementById("summaryPrice");
    const summaryNights = document.getElementById("summaryNights");
    const summaryTotal = document.getElementById("summaryTotal");

    const mainImage = document.getElementById("mainRoomImage");

    const thumbnails = document.querySelectorAll(".gallery-thumbnail");


    // -----------------------------------------------------
    // 2. API CONFIGURATION
    // -----------------------------------------------------

    const config = window.HOTELSPHERE_CONFIG || {};

    const API_BASE = (
        config.API_BASE ||
        "http://localhost:8080/ords/hotelsphere/api/"
    ).replace(/\/+$/, "") + "/";

    const ROOMS_API = API_BASE + "rooms";


    // -----------------------------------------------------
    // 3. GLOBAL VARIABLES
    // -----------------------------------------------------

    let currentRoom = null;

    let roomPrice = 0;
    let roomCapacity = 0;

    let roomAvailable = false;


    // -----------------------------------------------------
    // 4. HELPER FUNCTIONS
    // -----------------------------------------------------

    function getLocalDateString(date) {

        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function addDays(dateString, days) {

        const [year, month, day] =
            dateString.split("-").map(Number);

        const date = new Date(
            year,
            month - 1,
            day
        );

        date.setDate(date.getDate() + days);

        return getLocalDateString(date);
    }


    function calculateNights(checkIn, checkOut) {

        if (!checkIn || !checkOut) {
            return 0;
        }

        const [iy, im, id] =
            checkIn.split("-").map(Number);

        const [oy, om, od] =
            checkOut.split("-").map(Number);

        const start = Date.UTC(
            iy,
            im - 1,
            id
        );

        const end = Date.UTC(
            oy,
            om - 1,
            od
        );

        return Math.round(
            (end - start) / 86400000
        );
    }


    function formatPrice(amount) {

        return "₹" + Number(amount).toLocaleString("en-IN");
    }


    function showMessage(message, type = "error") {

        if (typeof window.showMessage === "function") {

            window.showMessage(message, type);

        } else {

            alert(message);
        }
    }


    // Read database fields safely.
    // Supports uppercase and lowercase Oracle JSON fields.

    function getField(room, ...names) {

        if (!room || typeof room !== "object") {
            return null;
        }

        for (const name of names) {

            const key = Object.keys(room).find(
                item =>
                    item.toLowerCase() === name.toLowerCase()
            );

            if (
                key &&
                room[key] !== null &&
                room[key] !== undefined
            ) {

                return room[key];
            }
        }

        return null;
    }


    // -----------------------------------------------------
    // 5. ROOM STATUS
    // -----------------------------------------------------

    function isRoomAvailable(room) {

        const status = String(
            getField(
                room,
                "status",
                "room_status",
                "availability_status"
            ) || ""
        ).trim().toLowerCase();

        if (status) {

            return [
                "available",
                "vacant",
                "active"
            ].includes(status);
        }

        const availability = getField(
            room,
            "is_available",
            "available",
            "is_active"
        );

        if (
            availability === true ||
            availability === 1 ||
            String(availability).toLowerCase() === "true" ||
            String(availability) === "1"
        ) {
            return true;
        }

        return false;
    }


    // -----------------------------------------------------
    // 6. GET SELECTED ROOM ID
    // -----------------------------------------------------

    function getRequestedRoom() {

        const params = new URLSearchParams(
            window.location.search
        );

        const roomId =
            params.get("roomId") ||
            params.get("room_id") ||
            params.get("id") ||
            bookingForm?.dataset.roomId ||
            document.body.dataset.roomId ||
            "";

        const roomNumber =
            params.get("roomNumber") ||
            params.get("room_number") ||
            bookingForm?.dataset.roomNumber ||
            document.body.dataset.roomNumber ||
            "";

        return {
            roomId: String(roomId).trim(),
            roomNumber: String(roomNumber).trim()
        };
    }


    // -----------------------------------------------------
    // 7. FETCH ROOMS FROM ORACLE DATABASE
    // -----------------------------------------------------

    async function loadRoomDetails() {

        try {

            if (roomNameElement) {

                roomNameElement.textContent =
                    "Loading Room Details...";
            }


            const response = await fetch(ROOMS_API, {

                method: "GET",

                headers: {
                    "Accept": "application/json"
                }

            });


            if (!response.ok) {

                throw new Error(
                    `Rooms API failed. HTTP Status: ${response.status}`
                );
            }


            const data = await response.json();


            // Support common ORDS response formats.

            const rooms = Array.isArray(data)
                ? data
                : data.items ||
                  data.rooms ||
                  data.result ||
                  [];


            if (!Array.isArray(rooms) || rooms.length === 0) {

                throw new Error(
                    "No rooms found in Oracle Database."
                );
            }


            // Get requested room from URL.

            const requested = getRequestedRoom();

            let selectedRoom = null;


            // -------------------------------------------------
            // FIRST: MATCH EXACT ROOM_ID
            // -------------------------------------------------

            if (requested.roomId) {

                selectedRoom = rooms.find(room => {

                    const databaseRoomId = getField(
                        room,
                        "room_id",
                        "id"
                    );

                    return String(databaseRoomId) ===
                        requested.roomId;

                });

            }


            // -------------------------------------------------
            // SECOND: MATCH EXACT ROOM NUMBER
            // -------------------------------------------------

            if (!selectedRoom && requested.roomNumber) {

                selectedRoom = rooms.find(room => {

                    const databaseRoomNumber = getField(
                        room,
                        "room_number"
                    );

                    return String(databaseRoomNumber) ===
                        requested.roomNumber;

                });

            }


            // -------------------------------------------------
            // DO NOT SELECT FIRST ROOM AUTOMATICALLY
            // -------------------------------------------------

            if (!selectedRoom) {

                throw new Error(
                    "Selected room was not found. " +
                    "Please return to Explore Rooms and select a room again."
                );

            }


            // Save the exact selected room.

            currentRoom = selectedRoom;


            console.log(
                "SELECTED ROOM:",
                currentRoom
            );

            console.log(
                "SELECTED ROOM ID:",
                getField(currentRoom, "room_id", "id")
            );


            displayRoomDetails(currentRoom);


        } catch (error) {

            console.error(
                "ROOM API ERROR:",
                error
            );


            if (roomNameElement) {

                roomNameElement.textContent =
                    "Room Details Unavailable";
            }


            showMessage(
                error.message ||
                "Unable to load room details from Oracle Database."
            );

        }

    }


    // -----------------------------------------------------
    // 8. DISPLAY DATABASE ROOM INFORMATION
    // -----------------------------------------------------

    function displayRoomDetails(room) {

        const roomId = getField(
            room,
            "room_id",
            "id"
        );

        const roomNumber = getField(
            room,
            "room_number"
        );

        const roomType = getField(
            room,
            "room_type",
            "room_type_name"
        ) || "Hotel Room";

        const branch = getField(
            room,
            "branch",
            "branch_name"
        ) || "HotelSphere";

        const floor = getField(
            room,
            "floor_no"
        );

        const rate = Number(
            getField(
                room,
                "rate",
                "room_rate",
                "price",
                "nightly_rate"
            )
        );

        const capacity = Number(
            getField(
                room,
                "capacity",
                "max_guests"
            ) || 0
        );


        roomPrice = Number.isFinite(rate) ? rate : 0;

        roomCapacity = capacity;

        roomAvailable = isRoomAvailable(room);


        // Save exact database room identity.

        document.body.dataset.roomId = roomId ?? "";

        document.body.dataset.roomNumber =
            roomNumber ?? "";


        if (bookingForm) {

            bookingForm.dataset.roomId = roomId ?? "";

            bookingForm.dataset.roomNumber =
                roomNumber ?? "";
        }


        // Display room name.

        if (roomNameElement) {

            roomNameElement.textContent =
                `${roomType} Room ${roomNumber ? "- " + roomNumber : ""}`;
        }


        // Display location.

        if (roomLocationElement) {

            roomLocationElement.textContent =
                `${branch}${floor !== null ? " | Floor " + floor : ""}`;
        }


        // Display price.

        if (roomPriceElement) {

            roomPriceElement.textContent =
                roomPrice.toLocaleString("en-IN");
        }


        // Display room metadata.

        const meta = document.querySelector(
            ".details-header .room-meta"
        );


        if (meta) {

            const statusText = roomAvailable
                ? "Available"
                : "Not Available";


            meta.innerHTML = `

                <span>
                    🛏️ Room ${roomNumber ?? "N/A"}
                </span>

                <span>
                    👥 Capacity: ${capacity || "Not specified"}
                </span>

                <span>
                    📍 ${statusText}
                </span>

            `;
        }


        // Apply room capacity.

        if (guestsInput && capacity > 0) {

            guestsInput.max = capacity;

            if (Number(guestsInput.value) > capacity) {

                guestsInput.value = capacity;
            }


            Array.from(guestsInput.options).forEach(option => {

                option.disabled =
                    Number(option.value) > capacity;

            });

        }


        // Disable unavailable room booking.

        const submitButton = bookingForm?.querySelector(
            'button[type="submit"]'
        );


        if (submitButton) {

            submitButton.disabled = !roomAvailable;

            submitButton.textContent = roomAvailable
                ? "Proceed to Booking"
                : "Room Not Available";
        }


        updateBookingSummary();

    }


    // -----------------------------------------------------
    // 9. ROOM IMAGE GALLERY
    // -----------------------------------------------------

    thumbnails.forEach(function (thumbnail) {

        thumbnail.addEventListener("click", function () {

            if (!mainImage) {
                return;
            }


            const fullImage =
                thumbnail.dataset.full ||
                thumbnail.src;


            if (!fullImage) {
                return;
            }


            mainImage.src = fullImage;


            thumbnails.forEach(item => {

                item.classList.remove("active");

            });


            thumbnail.classList.add("active");

        });

    });


    // -----------------------------------------------------
    // 10. DATE INITIALIZATION
    // -----------------------------------------------------

    const today = getLocalDateString(new Date());


    if (checkInInput) {

        checkInInput.min = today;

        if (!checkInInput.value) {

            checkInInput.value = today;
        }

    }


    if (checkOutInput) {

        const minimumCheckout = checkInInput?.value
            ? addDays(checkInInput.value, 1)
            : addDays(today, 1);


        checkOutInput.min = minimumCheckout;


        if (
            !checkOutInput.value ||
            checkOutInput.value < minimumCheckout
        ) {

            checkOutInput.value = minimumCheckout;
        }

    }


    // -----------------------------------------------------
    // 11. UPDATE BOOKING SUMMARY
    // -----------------------------------------------------

    function updateBookingSummary() {

        const checkIn = checkInInput?.value || "";

        const checkOut = checkOutInput?.value || "";


        const nights = calculateNights(
            checkIn,
            checkOut
        );


        const total = nights > 0
            ? roomPrice * nights
            : 0;


        if (summaryPrice) {

            summaryPrice.textContent =
                formatPrice(roomPrice);
        }


        if (summaryNights) {

            summaryNights.textContent =
                nights +
                (nights === 1 ? " Night" : " Nights");
        }


        if (summaryTotal) {

            summaryTotal.textContent =
                formatPrice(total);
        }

    }


    // -----------------------------------------------------
    // 12. DATE CHANGE EVENTS
    // -----------------------------------------------------

    if (checkInInput) {

        checkInInput.addEventListener(
            "change",
            function () {

                const selectedDate = checkInInput.value;


                if (!selectedDate) {

                    updateBookingSummary();

                    return;
                }


                checkOutInput.min = addDays(
                    selectedDate,
                    1
                );


                if (
                    !checkOutInput.value ||
                    checkOutInput.value <= selectedDate
                ) {

                    checkOutInput.value = addDays(
                        selectedDate,
                        1
                    );

                }


                updateBookingSummary();

            }
        );

    }


    if (checkOutInput) {

        checkOutInput.addEventListener(
            "change",
            function () {

                if (
                    checkInInput?.value &&
                    checkOutInput.value <= checkInInput.value
                ) {

                    showMessage(
                        "Check-out date must be after check-in date."
                    );


                    checkOutInput.value = addDays(
                        checkInInput.value,
                        1
                    );

                }


                updateBookingSummary();

            }
        );

    }


    // -----------------------------------------------------
    // 13. GUEST VALIDATION
    // -----------------------------------------------------

    if (guestsInput) {

        guestsInput.addEventListener(
            "change",
            function () {

                const guests = Number(
                    guestsInput.value
                );


                if (
                    !Number.isInteger(guests) ||
                    guests < 1
                ) {

                    guestsInput.value = 1;
                }


                if (
                    roomCapacity > 0 &&
                    Number(guestsInput.value) > roomCapacity
                ) {

                    guestsInput.value = roomCapacity;


                    showMessage(
                        `Maximum ${roomCapacity} guests allowed for this room.`
                    );

                }

            }
        );

    }


    // -----------------------------------------------------
    // 14. BOOKING FORM SUBMISSION
    // -----------------------------------------------------

    if (bookingForm) {

        bookingForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                // Check selected room.

                if (!currentRoom) {

                    showMessage(
                        "Room details are not loaded yet."
                    );

                    return;
                }


                if (!roomAvailable) {

                    showMessage(
                        "This room is currently not available."
                    );

                    return;
                }


                const checkIn = checkInInput?.value || "";

                const checkOut = checkOutInput?.value || "";


                const guests = Number(
                    guestsInput?.value || 1
                );


                const nights = calculateNights(
                    checkIn,
                    checkOut
                );


                // IMPORTANT: Always use selected room ID.

                const roomId = getField(
                    currentRoom,
                    "room_id",
                    "id"
                );


                const roomNumber = getField(
                    currentRoom,
                    "room_number"
                );


                const roomType = getField(
                    currentRoom,
                    "room_type",
                    "room_type_name"
                );


                const branch = getField(
                    currentRoom,
                    "branch",
                    "branch_name"
                );


                const roomName =
                    `${roomType || "Room"} ${roomNumber || ""}`.trim();


                // Validate room ID.

                if (
                    roomId === null ||
                    roomId === undefined ||
                    String(roomId).trim() === ""
                ) {

                    showMessage(
                        "Invalid room ID. Please select the room again."
                    );

                    return;
                }


                // Validate dates.

                if (!checkIn || !checkOut) {

                    showMessage(
                        "Please select check-in and check-out dates."
                    );

                    return;
                }


                if (checkIn < today) {

                    showMessage(
                        "Check-in date cannot be in the past."
                    );

                    return;
                }


                if (nights <= 0) {

                    showMessage(
                        "Please select a valid check-out date."
                    );

                    return;
                }


                // Validate guests.

                if (
                    !Number.isInteger(guests) ||
                    guests < 1
                ) {

                    showMessage(
                        "Please select a valid number of guests."
                    );

                    return;
                }


                if (
                    roomCapacity > 0 &&
                    guests > roomCapacity
                ) {

                    showMessage(
                        `This room allows a maximum of ${roomCapacity} guests.`
                    );

                    return;
                }


                // Validate price.

                if (roomPrice <= 0) {

                    showMessage(
                        "Room price is not available."
                    );

                    return;
                }


                const totalAmount = roomPrice * nights;


                // Prepare booking data.

                const bookingData = {

                    roomId: Number(roomId),

                    roomNumber: roomNumber,

                    roomType: roomType,

                    branch: branch,

                    roomName: roomName,

                    roomPrice: roomPrice,

                    checkIn: checkIn,

                    checkOut: checkOut,

                    guests: guests,

                    nights: nights,

                    subtotal: totalAmount,

                    createdAt: new Date().toISOString()

                };


                // Save selected room and booking details.

                try {

                    sessionStorage.setItem(
                        "hotelsphere-pending-booking",
                        JSON.stringify(bookingData)
                    );


                    console.log(
                        "HOTELSPHERE PENDING BOOKING:",
                        bookingData
                    );


                } catch (error) {

                    console.error(
                        "Unable to save booking:",
                        error
                    );


                    showMessage(
                        "Unable to continue. Please check browser storage settings."
                    );

                    return;
                }


                // Continue to checkout.

                window.location.href =
                    "booking-checkout.html";

            }
        );

    }


    // -----------------------------------------------------
    // 15. INITIALIZE PAGE
    // -----------------------------------------------------

    updateBookingSummary();

    loadRoomDetails();

});
