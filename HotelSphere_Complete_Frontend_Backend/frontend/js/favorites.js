/* =========================================================
   HOTELSPHERE - FAVORITES / WISHLIST
   File: frontend/js/favorites.js
   Storage: Browser localStorage
========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "hotelsphere-favorites";


    // =====================================================
    // 1. GET FAVORITES FROM LOCAL STORAGE
    // =====================================================

    function getFavorites() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];

            return Array.isArray(parsed) ? parsed : [];

        } catch (error) {
            console.error("Could not load favorites:", error);
            return [];
        }
    }


    // =====================================================
    // 2. SAVE FAVORITES
    // =====================================================

    function saveFavorites(favorites) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(favorites)
            );

            updateFavoriteCount();
            updateFavoriteButtons();

            return true;

        } catch (error) {
            console.error("Could not save favorites:", error);

            showFavoriteMessage(
                "Unable to save favorite. Browser storage may be full."
            );

            return false;
        }
    }


    // =====================================================
    // 3. GET ROOM ID
    // =====================================================

    function getRoomId(room) {
        if (!room) return "";

        return String(
            room.room_id ??
            room.id ??
            room.roomId ??
            ""
        );
    }


    // =====================================================
    // 4. CHECK FAVORITE STATUS
    // =====================================================

    function isFavorite(roomId) {
        return getFavorites().some(function (room) {
            return String(room.id) === String(roomId);
        });
    }


    // =====================================================
    // 5. ADD FAVORITE
    // =====================================================

    function addFavorite(room) {

        if (!room || typeof room !== "object") {
            showFavoriteMessage("Invalid room information.");
            return false;
        }

        const roomId = getRoomId(room);

        if (!roomId) {
            showFavoriteMessage("Room ID is missing.");
            return false;
        }

        const favorites = getFavorites();

        const alreadyExists = favorites.some(function (item) {
            return String(item.id) === roomId;
        });

        if (alreadyExists) {
            showFavoriteMessage("Room is already in your favorites.");
            return false;
        }

        const favoriteRoom = {
            id: roomId,

            name:
                room.name ||
                room.room_name ||
                room.room_type ||
                "Hotel Room",

            room_number: room.room_number || "",

            price: Number(
                room.price ??
                room.rate ??
                0
            ),

            image:
                room.image ||
                room.image_url ||
                "",

            category:
                room.category ||
                room.room_type ||
                "",

            hotel:
                room.hotel ||
                room.branch ||
                "HotelSphere",

            savedAt: new Date().toISOString()
        };

        favorites.push(favoriteRoom);

        const saved = saveFavorites(favorites);

        if (!saved) return false;

        renderFavorites();

        showFavoriteMessage("Room added to favorites!");

        return true;
    }


    // =====================================================
    // 6. REMOVE FAVORITE
    // =====================================================

    function removeFavorite(roomId) {

        const favorites = getFavorites();

        const updatedFavorites = favorites.filter(function (room) {
            return String(room.id) !== String(roomId);
        });

        if (updatedFavorites.length === favorites.length) {
            return false;
        }

        const saved = saveFavorites(updatedFavorites);

        if (!saved) return false;

        renderFavorites();

        showFavoriteMessage("Room removed from favorites.");

        return true;
    }


    // =====================================================
    // 7. TOGGLE FAVORITE
    // =====================================================

    function toggleFavorite(room) {

        const roomId = getRoomId(room);

        if (!roomId) {
            showFavoriteMessage("Room information is missing.");
            return false;
        }

        if (isFavorite(roomId)) {
            return removeFavorite(roomId);
        }

        return addFavorite(room);
    }


    // =====================================================
    // 8. UPDATE HEART ICONS
    // =====================================================

    function updateFavoriteButtons() {

        document.querySelectorAll("[data-favorite-id]").forEach(
            function (button) {

                const roomId = button.dataset.favoriteId;
                const active = isFavorite(roomId);

                button.classList.toggle("active", active);

                button.setAttribute(
                    "aria-pressed",
                    String(active)
                );

                button.setAttribute(
                    "aria-label",
                    active
                        ? "Remove from favorites"
                        : "Add to favorites"
                );

                const icon = button.querySelector("i");

                if (icon) {

                    icon.classList.toggle(
                        "fa-solid",
                        active
                    );

                    icon.classList.toggle(
                        "fa-regular",
                        !active
                    );

                    icon.classList.toggle(
                        "fa-heart",
                        true
                    );
                }
            }
        );
    }


    // =====================================================
    // 9. UPDATE FAVORITE COUNT
    // =====================================================

    function updateFavoriteCount() {

        const count = getFavorites().length;

        document.querySelectorAll(
            "#favoriteCount, .favorite-count, [data-favorite-count]"
        ).forEach(function (element) {

            element.textContent = count;

        });
    }


    // =====================================================
    // 10. SHOW MESSAGE
    // =====================================================

    function showFavoriteMessage(message) {

        let messageBox = document.getElementById("favoriteMessage");

        if (!messageBox) {

            messageBox = document.createElement("div");

            messageBox.id = "favoriteMessage";
            messageBox.className = "favorite-message";

            messageBox.setAttribute("role", "status");
            messageBox.setAttribute("aria-live", "polite");

            document.body.appendChild(messageBox);
        }

        messageBox.textContent = message;

        messageBox.classList.add("show");

        if (messageBox.hideTimer) {
            clearTimeout(messageBox.hideTimer);
        }

        messageBox.hideTimer = setTimeout(function () {

            messageBox.classList.remove("show");

        }, 2500);
    }


    // =====================================================
    // 11. RENDER FAVORITES PAGE
    // =====================================================

    function renderFavorites() {

        const container = document.getElementById(
            "favoritesContainer"
        );

        if (!container) return;

        const favorites = getFavorites();

        updateFavoriteCount();

        if (favorites.length === 0) {

            container.innerHTML = `
                <div class="favorites-empty">

                    <div class="favorites-empty-icon">
                        <i class="fa-regular fa-heart"></i>
                    </div>

                    <h3>No Favorite Rooms Yet</h3>

                    <p>
                        Explore our rooms and save the ones you like.
                    </p>

                    <a href="explore.html" class="btn btn-primary">
                        <i class="fa-solid fa-compass"></i>
                        Explore Rooms
                    </a>

                </div>
            `;

            return;
        }


        container.innerHTML = favorites.map(function (room) {

            const safeName = escapeHTML(room.name);
            const safeHotel = escapeHTML(room.hotel);
            const safeCategory = escapeHTML(room.category);
            const safeImage = safeURL(room.image);
            const safeId = escapeHTML(room.id);

            const price = Number(room.price) || 0;

            return `
                <article class="favorite-room-card">

                    <div class="favorite-room-image">

                        ${
                            safeImage
                                ? `
                                    <img
                                        src="${safeImage}"
                                        alt="${safeName}"
                                        loading="lazy">
                                  `
                                : `
                                    <div class="favorite-image-placeholder">
                                        <i class="fa-solid fa-hotel"></i>
                                        HotelSphere
                                    </div>
                                  `
                        }

                    </div>


                    <div class="favorite-room-info">

                        <h3>${safeName}</h3>

                        <p>
                            <i class="fa-solid fa-hotel"></i>
                            ${safeHotel}
                        </p>

                        <p>
                            <i class="fa-solid fa-layer-group"></i>
                            ${safeCategory}
                        </p>

                        <strong>
                            ₹${price.toLocaleString("en-IN")} / night
                        </strong>

                    </div>


                    <div class="favorite-room-actions">

                        <a
                            href="room-details.html?roomId=${encodeURIComponent(room.id)}"
                            class="btn btn-primary">

                            <i class="fa-solid fa-eye"></i>
                            View Room

                        </a>


                        <button
                            type="button"
                            class="btn btn-outline"
                            data-remove-favorite="${safeId}">

                            <i class="fa-solid fa-trash"></i>
                            Remove

                        </button>

                    </div>

                </article>
            `;

        }).join("");
    }


    // =====================================================
    // 12. HTML ESCAPING
    // =====================================================

    function escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,

            function (character) {

                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"
                }[character];

            }
        );
    }


    // =====================================================
    // 13. SAFE IMAGE URL
    // =====================================================

    function safeURL(value) {

        try {

            const url = new URL(
                value,
                window.location.href
            );

            if (
                url.protocol === "http:" ||
                url.protocol === "https:"
            ) {
                return escapeHTML(url.href);
            }

        } catch (error) {

            console.warn("Invalid image URL:", error);

        }

        return "";
    }


    // =====================================================
    // 14. GET ROOM DATA FROM FAVORITE BUTTON
    // =====================================================

    function getRoomData(button) {

        const roomCard = button.closest(".room-card");

        const roomId = button.dataset.favoriteId;

        if (!roomId) return null;

        return {

            room_id: roomId,

            name:
                button.dataset.name ||
                button.dataset.roomName ||
                roomCard?.dataset.name ||
                "Hotel Room",

            price:
                button.dataset.price ||
                button.dataset.roomPrice ||
                roomCard?.dataset.price ||
                0,

            image:
                button.dataset.image ||
                button.dataset.roomImage ||
                roomCard?.querySelector("img")?.src ||
                "",

            category:
                button.dataset.category ||
                button.dataset.roomCategory ||
                roomCard?.dataset.category ||
                "",

            hotel:
                button.dataset.location ||
                button.dataset.hotelName ||
                "HotelSphere"
        };
    }


    // =====================================================
    // 15. HANDLE ALL FAVORITE BUTTON CLICKS
    // =====================================================

    document.addEventListener("click", function (event) {

        const favoriteButton = event.target.closest(
            "[data-favorite-id]"
        );

        if (favoriteButton) {

            event.preventDefault();

            const roomData = getRoomData(favoriteButton);

            if (roomData) {
                toggleFavorite(roomData);
            }

            return;
        }


        // REMOVE BUTTON ON FAVORITES PAGE

        const removeButton = event.target.closest(
            "[data-remove-favorite]"
        );

        if (removeButton) {

            event.preventDefault();

            const roomId = removeButton.dataset.removeFavorite;

            removeFavorite(roomId);
        }

    });


    // =====================================================
    // 16. INITIALIZE FAVORITES
    // =====================================================

    function initializeFavorites() {

        updateFavoriteCount();

        updateFavoriteButtons();

        renderFavorites();
    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeFavorites
        );

    } else {

        initializeFavorites();

    }


    // =====================================================
    // 17. PUBLIC METHODS
    // =====================================================

    window.HSFavorites = {

        getAll: getFavorites,

        add: addFavorite,

        remove: removeFavorite,

        toggle: toggleFavorite,

        isFavorite: isFavorite,

        render: renderFavorites,

        updateCount: updateFavoriteCount,

        updateButtons: updateFavoriteButtons

    };

})();