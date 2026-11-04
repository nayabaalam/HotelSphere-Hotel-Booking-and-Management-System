
/* =====================================================
   HOTELSPHERE - ADMIN ROOM MANAGEMENT
   File: frontend/js/rooms.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const roomTableBody = document.getElementById("roomsTableBody");
    const roomSearch = document.getElementById("roomSearch");
    const roomStatusFilter = document.getElementById("roomStatusFilter");
    const roomTypeFilter = document.getElementById("roomTypeFilter");

    const refreshButton = document.getElementById("refreshRooms");

    const loadingMessage = document.getElementById("roomsLoading");
    const errorMessage = document.getElementById("roomsError");
    const emptyMessage = document.getElementById("roomsEmpty");

    const totalRooms = document.getElementById("totalRooms");
    const availableRooms = document.getElementById("availableRooms");
    const occupiedRooms = document.getElementById("occupiedRooms");
    const maintenanceRooms = document.getElementById("maintenanceRooms");

    let allRooms = [];


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

    function formatMoney(amount) {

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);

    }

    function normalizeStatus(status) {

        return String(status || "UNKNOWN")
            .trim()
            .toUpperCase();

    }

    function getStatusClass(status) {

        const normalized = normalizeStatus(status);

        if (normalized === "AVAILABLE") {
            return "available";
        }

        if (normalized === "OCCUPIED") {
            return "occupied";
        }

        if (
            normalized === "MAINTENANCE" ||
            normalized === "UNDER_MAINTENANCE"
        ) {
            return "maintenance";
        }

        return "unknown";

    }


    // -------------------------------------------------
    // 3. UPDATE ROOM STATISTICS
    // -------------------------------------------------

    function updateStatistics(rooms) {

        const total = rooms.length;

        const available = rooms.filter(room =>
            normalizeStatus(room.status) === "AVAILABLE"
        ).length;

        const occupied = rooms.filter(room =>
            normalizeStatus(room.status) === "OCCUPIED"
        ).length;

        const maintenance = rooms.filter(room =>
            ["MAINTENANCE", "UNDER_MAINTENANCE"].includes(
                normalizeStatus(room.status)
            )
        ).length;

        if (totalRooms) {
            totalRooms.textContent = total;
        }

        if (availableRooms) {
            availableRooms.textContent = available;
        }

        if (occupiedRooms) {
            occupiedRooms.textContent = occupied;
        }

        if (maintenanceRooms) {
            maintenanceRooms.textContent = maintenance;
        }

    }


    // -------------------------------------------------
    // 4. RENDER ROOM TABLE
    // -------------------------------------------------

    function renderRooms(rooms) {

        if (!roomTableBody) return;

        roomTableBody.innerHTML = "";

        if (rooms.length === 0) {

            showMessage(emptyMessage, "No rooms found.");

            return;

        }

        hideMessage(emptyMessage);

        rooms.forEach(function (room) {

            const status = normalizeStatus(room.status);

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(room.room_id)}</td>

                <td>
                    <strong>${escapeHTML(room.room_number)}</strong>
                </td>

                <td>${escapeHTML(room.room_type)}</td>

                <td>${escapeHTML(room.branch)}</td>

                <td>${escapeHTML(room.floor_no)}</td>

                <td>
                    <span class="status-badge ${getStatusClass(status)}"
                          data-status="${escapeHTML(status)}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>${formatMoney(room.rate)}</td>

                <td>${escapeHTML(room.capacity)}</td>

                <td class="action-column">
                    <button
                        type="button"
                        class="btn btn-sm btn-outline"
                        data-view-room="${escapeHTML(room.room_id)}">
                        View
                    </button>
                </td>
            `;

            roomTableBody.appendChild(row);

        });

    }


    // -------------------------------------------------
    // 5. SEARCH AND FILTER ROOMS
    // -------------------------------------------------

    function filterRooms() {

        const searchText = roomSearch
            ? roomSearch.value.trim().toLowerCase()
            : "";

        const selectedStatus = roomStatusFilter
            ? roomStatusFilter.value.toUpperCase()
            : "ALL";

        const selectedType = roomTypeFilter
            ? roomTypeFilter.value.toLowerCase()
            : "all";

        const filteredRooms = allRooms.filter(function (room) {

            const matchesSearch = [
                room.room_number,
                room.room_type,
                room.branch,
                room.room_id
            ].some(value =>
                String(value ?? "").toLowerCase().includes(searchText)
            );

            const matchesStatus =
                selectedStatus === "ALL" ||
                normalizeStatus(room.status) === selectedStatus;

            const matchesType =
                selectedType === "all" ||
                String(room.room_type ?? "").toLowerCase() === selectedType;

            return matchesSearch && matchesStatus && matchesType;

        });

        renderRooms(filteredRooms);

    }

    if (roomSearch) {
        roomSearch.addEventListener("input", filterRooms);
    }

    if (roomStatusFilter) {
        roomStatusFilter.addEventListener("change", filterRooms);
    }

    if (roomTypeFilter) {
        roomTypeFilter.addEventListener("change", filterRooms);
    }


    // -------------------------------------------------
    // 6. POPULATE ROOM TYPE FILTER
    // -------------------------------------------------

    function populateRoomTypes(rooms) {

        if (!roomTypeFilter) return;

        const currentValue = roomTypeFilter.value;

        const types = [
            ...new Set(
                rooms.map(room => room.room_type).filter(Boolean)
            )
        ];

        roomTypeFilter.innerHTML =
            '<option value="all">All Room Types</option>';

        types.sort().forEach(function (type) {

            const option = document.createElement("option");

            option.value = String(type).toLowerCase();
            option.textContent = type;

            roomTypeFilter.appendChild(option);

        });

        if (
            [...roomTypeFilter.options].some(
                option => option.value === currentValue
            )
        ) {
            roomTypeFilter.value = currentValue;
        }

    }


    // -------------------------------------------------
    // 7. LOAD ROOMS FROM ORACLE API
    // -------------------------------------------------

    async function loadRooms() {

        hideMessage(errorMessage);
        hideMessage(emptyMessage);

        if (loadingMessage) {
            showMessage(loadingMessage, "Loading rooms...");
        }

        if (refreshButton) {
            refreshButton.disabled = true;
        }

        try {

            if (
                !window.HSApi ||
                typeof window.HSApi.rooms !== "function"
            ) {

                throw new Error(
                    "Rooms API is not available. Check api.js."
                );

            }

            const response = await window.HSApi.rooms();

            // Support either a direct array or { items: [...] }
            const rooms = Array.isArray(response)
                ? response
                : response?.items;

            if (!Array.isArray(rooms)) {

                throw new Error(
                    "Invalid room data received from server."
                );

            }

            allRooms = rooms;

            updateStatistics(allRooms);

            populateRoomTypes(allRooms);

            filterRooms();

        } catch (error) {

            console.error("Room loading error:", error);

            showMessage(
                errorMessage,
                error.message || "Unable to load rooms."
            );

        } finally {

            hideMessage(loadingMessage);

            if (refreshButton) {
                refreshButton.disabled = false;
            }

        }

    }


    // -------------------------------------------------
    // 8. VIEW ROOM DETAILS
    // -------------------------------------------------

    if (roomTableBody) {

        roomTableBody.addEventListener("click", function (event) {

            const viewButton = event.target.closest(
                "[data-view-room]"
            );

            if (!viewButton) return;

            const roomId = viewButton.dataset.viewRoom;

            const selectedRoom = allRooms.find(
                room => String(room.room_id) === String(roomId)
            );

            if (!selectedRoom) return;

            alert(
                "Room Details\n\n" +
                "Room Number: " + selectedRoom.room_number + "\n" +
                "Room Type: " + selectedRoom.room_type + "\n" +
                "Branch: " + selectedRoom.branch + "\n" +
                "Floor: " + selectedRoom.floor_no + "\n" +
                "Status: " + selectedRoom.status + "\n" +
                "Rate: " + formatMoney(selectedRoom.rate) + "\n" +
                "Capacity: " + selectedRoom.capacity
            );

        });

    }


    // -------------------------------------------------
    // 9. REFRESH ROOMS
    // -------------------------------------------------

    if (refreshButton) {

        refreshButton.addEventListener("click", loadRooms);

    }


    // -------------------------------------------------
    // 10. INITIALIZE
    // -------------------------------------------------

    if (roomTableBody) {

        loadRooms();

    }

});
