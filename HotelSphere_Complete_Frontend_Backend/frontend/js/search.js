
/* =====================================================
   HOTELSPHERE - GLOBAL SEARCH
   File: frontend/js/search.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const searchInput = document.getElementById("globalSearch");

    const searchButton = document.getElementById("globalSearchButton");

    const suggestionsBox = document.getElementById("searchSuggestions");

    const clearButton = document.getElementById("clearGlobalSearch");

    const searchMessage = document.getElementById("globalSearchMessage");

    const roomContainer = document.getElementById("exploreRoomGrid");

    const roomCards = document.querySelectorAll(
        ".room-card, .explore-room-card"
    );

    if (!searchInput) return;


    // -------------------------------------------------
    // 2. SEARCH SUGGESTIONS
    // -------------------------------------------------

    const popularSearches = [
        "Deluxe Room",
        "Standard Room",
        "Luxury Suite",
        "Family Room",
        "Executive Room",
        "HotelSphere Central"
    ];

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


    // -------------------------------------------------
    // 3. SHOW SUGGESTIONS
    // -------------------------------------------------

    function showSuggestions() {

        if (!suggestionsBox) return;

        const query = searchInput.value.trim().toLowerCase();

        suggestionsBox.innerHTML = "";

        let suggestions = [];

        if (!query) {

            suggestions = popularSearches.slice(0, 5);

        } else {

            suggestions = popularSearches.filter(item =>
                item.toLowerCase().includes(query)
            );

        }

        if (suggestions.length === 0) {

            suggestionsBox.style.display = "none";

            return;

        }

        suggestions.forEach(function (item) {

            const suggestion = document.createElement("button");

            suggestion.type = "button";
            suggestion.className = "search-suggestion";
            suggestion.textContent = item;

            suggestion.addEventListener("click", function () {

                searchInput.value = item;

                suggestionsBox.style.display = "none";

                performSearch();

            });

            suggestionsBox.appendChild(suggestion);

        });

        suggestionsBox.style.display = "block";

    }


    // -------------------------------------------------
    // 4. SEARCH ROOM CARDS
    // -------------------------------------------------

    function filterRoomCards(query) {

        const cards = document.querySelectorAll(
            ".room-card, .explore-room-card"
        );

        let visibleCount = 0;

        cards.forEach(function (card) {

            const searchableText = (
                card.textContent + " " +
                (card.dataset.name || "") + " " +
                (card.dataset.category || "") + " " +
                (card.dataset.hotel || "")
            ).toLowerCase();

            const matches = searchableText.includes(query);

            card.hidden = !matches;

            if (matches) {
                visibleCount++;
            }

        });

        return visibleCount;

    }


    // -------------------------------------------------
    // 5. PERFORM SEARCH
    // -------------------------------------------------

    function performSearch() {

        const query = searchInput.value.trim();

        if (!query) {

            if (searchMessage) {

                searchMessage.textContent =
                    "Please enter a hotel name or room category.";

            }

            searchInput.focus();

            return;

        }

        if (searchMessage) {
            searchMessage.textContent = "";
        }

        if (suggestionsBox) {
            suggestionsBox.style.display = "none";
        }

        const currentPage = window.location.pathname;

        const isExplorePage =
            currentPage.endsWith("/explore.html") ||
            currentPage.endsWith("explore.html");

        if (!isExplorePage) {

            const params = new URLSearchParams();

            params.set("search", query);

            window.location.href =
                "explore.html?" + params.toString();

            return;

        }

        const visibleCount = filterRoomCards(
            query.toLowerCase()
        );

        if (searchMessage) {

            searchMessage.textContent = visibleCount > 0
                ? visibleCount + " matching room(s) found."
                : "No matching rooms found.";

        }

        if (roomContainer) {

            roomContainer.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }


    // -------------------------------------------------
    // 6. CLEAR SEARCH
    // -------------------------------------------------

    function clearSearch() {

        searchInput.value = "";

        if (suggestionsBox) {
            suggestionsBox.style.display = "none";
        }

        if (searchMessage) {
            searchMessage.textContent = "";
        }

        const cards = document.querySelectorAll(
            ".room-card, .explore-room-card"
        );

        cards.forEach(card => {
            card.hidden = false;
        });

        searchInput.focus();

    }


    // -------------------------------------------------
    // 7. INPUT EVENTS
    // -------------------------------------------------

    searchInput.addEventListener("input", function () {

        showSuggestions();

    });

    searchInput.addEventListener("focus", function () {

        showSuggestions();

    });

    searchInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            performSearch();

        }

        if (event.key === "Escape") {

            if (suggestionsBox) {
                suggestionsBox.style.display = "none";
            }

        }

    });


    // -------------------------------------------------
    // 8. SEARCH BUTTON
    // -------------------------------------------------

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            performSearch
        );

    }


    // -------------------------------------------------
    // 9. CLEAR BUTTON
    // -------------------------------------------------

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearSearch
        );

    }


    // -------------------------------------------------
    // 10. CLOSE SUGGESTIONS ON OUTSIDE CLICK
    // -------------------------------------------------

    document.addEventListener("click", function (event) {

        if (
            suggestionsBox &&
            !searchInput.contains(event.target) &&
            !suggestionsBox.contains(event.target)
        ) {

            suggestionsBox.style.display = "none";

        }

    });


    // -------------------------------------------------
    // 11. READ SEARCH FROM URL
    // -------------------------------------------------

    const urlParams = new URLSearchParams(
        window.location.search
    );

    const urlSearch = urlParams.get("search");

    if (urlSearch) {

        searchInput.value = urlSearch;

        const isExplorePage =
            window.location.pathname.endsWith("explore.html");

        if (isExplorePage) {

            filterRoomCards(urlSearch.toLowerCase());

            if (searchMessage) {

                searchMessage.textContent =
                    "Search results for: " + urlSearch;

            }

        }

    }


    // -------------------------------------------------
    // 12. INITIALIZE SEARCH
    // -------------------------------------------------

    if (clearButton) {

        clearButton.style.display =
            searchInput.value ? "inline-flex" : "none";

        searchInput.addEventListener("input", function () {

            clearButton.style.display =
                searchInput.value ? "inline-flex" : "none";

        });

    }

});

