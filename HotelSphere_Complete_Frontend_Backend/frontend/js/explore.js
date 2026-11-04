
/* =========================================================
   HOTELSPHERE - EXPLORE PAGE JAVASCRIPT
   File: frontend/js/explore.js
   ========================================================= */

"use strict";


/* =========================================================
   1. DOM ELEMENTS
   ========================================================= */

const exploreSearchInput =
    document.getElementById("hotelSearch");

const exploreRoomGrid =
    document.getElementById("exploreRoomGrid");

const exploreSortSelect =
    document.getElementById("sortRooms");

const exploreEmptyState =
    document.getElementById("emptyState");

const exploreResetButton =
    document.getElementById("resetFilters");


/* =========================================================
   2. CONFIGURATION
   ========================================================= */

const EXPLORE_CONFIG = {
    favoritesKey: "hotelsphere-favorites",
    defaultCategory: "all",
    defaultSort: "recommended"
};


/* =========================================================
   3. PAGE STATE
   ========================================================= */

let selectedCategory = EXPLORE_CONFIG.defaultCategory;

let searchQuery = "";

let selectedSort = EXPLORE_CONFIG.defaultSort;


/* =========================================================
   4. GET ROOM CARDS
   ========================================================= */

function getExploreCards() {

    if (!exploreRoomGrid) {
        return [];
    }

    return Array.from(
        exploreRoomGrid.querySelectorAll(
            ".room-card, .hotel-card, [data-category][data-price]"
        )
    );

}


/* =========================================================
   5. GET FAVORITES FROM LOCAL STORAGE
   ========================================================= */

function getFavorites() {

    try {

        const favorites = JSON.parse(
            localStorage.getItem(EXPLORE_CONFIG.favoritesKey) || "[]"
        );

        return Array.isArray(favorites) ? favorites : [];

    } catch (error) {

        console.warn("Unable to load favorites:", error);

        return [];

    }

}


/* =========================================================
   6. SAVE FAVORITES
   ========================================================= */

function saveFavorites(favorites) {

    try {

        localStorage.setItem(
            EXPLORE_CONFIG.favoritesKey,
            JSON.stringify(favorites)
        );

    } catch (error) {

        console.error("Unable to save favorites:", error);

    }

}


/* =========================================================
   7. UPDATE FAVORITE BUTTON APPEARANCE
   ========================================================= */

function updateFavoriteButtons() {

    const favorites = getFavorites();

    const cards = getExploreCards();

    cards.forEach((card, index) => {

        const favoriteButton = card.querySelector(
            ".favorite-btn, [data-favorite]"
        );

        if (!favoriteButton) {
            return;
        }

        const roomName =
            card.dataset.name ||
            card.querySelector("h3")?.textContent.trim() ||
            `room-${index}`;

        const isFavorite = favorites.includes(roomName);

        favoriteButton.classList.toggle(
            "active",
            isFavorite
        );

        favoriteButton.setAttribute(
            "aria-pressed",
            String(isFavorite)
        );

        favoriteButton.setAttribute(
            "aria-label",
            isFavorite
                ? "Remove from favorites"
                : "Add to favorites"
        );

        const icon = favoriteButton.querySelector("i");

        if (icon) {

            icon.className = isFavorite
                ? "fa-solid fa-heart"
                : "fa-regular fa-heart";

        }

    });

}


/* =========================================================
   8. TOGGLE FAVORITE
   ========================================================= */

function toggleFavorite(button) {

    const card = button.closest(
        ".room-card, .hotel-card, [data-category][data-price]"
    );

    if (!card) {
        return;
    }

    const cards = getExploreCards();

    const index = cards.indexOf(card);

    const roomName =
        card.dataset.name ||
        card.querySelector("h3")?.textContent.trim() ||
        `room-${index}`;

    let favorites = getFavorites();

    if (favorites.includes(roomName)) {

        favorites = favorites.filter(
            name => name !== roomName
        );

    } else {

        favorites.push(roomName);

    }

    saveFavorites(favorites);

    updateFavoriteButtons();

}


/* =========================================================
   9. SEARCH ROOMS
   ========================================================= */

function searchExploreRooms() {

    if (!exploreSearchInput) {
        searchQuery = "";
        return;
    }

    searchQuery = exploreSearchInput.value
        .trim()
        .toLowerCase();

    applyExploreFilters();

}


/* =========================================================
   10. CATEGORY FILTER
   ========================================================= */

function initializeCategoryFilters() {

    const categoryButtons = document.querySelectorAll(
        "[data-category]"
    );

    categoryButtons.forEach(button => {

        button.addEventListener("click", function () {

            const category = this.dataset.category;

            if (!category) {
                return;
            }

            selectedCategory = category.toLowerCase();

            categoryButtons.forEach(item => {

                item.classList.remove("active");

                item.setAttribute(
                    "aria-pressed",
                    "false"
                );

            });

            this.classList.add("active");

            this.setAttribute(
                "aria-pressed",
                "true"
            );

            applyExploreFilters();

        });

    });

}


/* =========================================================
   11. SORT ROOMS
   ========================================================= */

function sortExploreRooms(cards) {

    const sortedCards = [...cards];

    switch (selectedSort) {

        case "low":

            sortedCards.sort((a, b) => {

                return (
                    Number(a.dataset.price || 0) -
                    Number(b.dataset.price || 0)
                );

            });

            break;


        case "high":

            sortedCards.sort((a, b) => {

                return (
                    Number(b.dataset.price || 0) -
                    Number(a.dataset.price || 0)
                );

            });

            break;


        case "name":

            sortedCards.sort((a, b) => {

                const nameA =
                    a.dataset.name ||
                    a.querySelector("h3")?.textContent ||
                    "";

                const nameB =
                    b.dataset.name ||
                    b.querySelector("h3")?.textContent ||
                    "";

                return nameA.localeCompare(nameB);

            });

            break;


        case "recommended":

        default:

            break;

    }

    return sortedCards;

}


/* =========================================================
   12. APPLY ALL FILTERS
   ========================================================= */

function applyExploreFilters() {

    if (!exploreRoomGrid) {
        return;
    }

    const allCards = getExploreCards();

    const filteredCards = allCards.filter(card => {

        const category =
            (card.dataset.category || "").toLowerCase();

        const name =
            (
                card.dataset.name ||
                card.textContent
            ).toLowerCase();


        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        const matchesSearch =
            name.includes(searchQuery);


        return matchesCategory && matchesSearch;

    });


    const sortedCards = sortExploreRooms(filteredCards);

    const visibleCards = new Set(sortedCards);


    allCards.forEach(card => {

        card.style.display = visibleCards.has(card)
            ? ""
            : "none";

    });


    // Move cards into their sorted order.
    sortedCards.forEach(card => {

        exploreRoomGrid.appendChild(card);

    });


    updateEmptyState(filteredCards.length);

}


/* =========================================================
   13. EMPTY STATE
   ========================================================= */

function updateEmptyState(resultCount) {

    if (!exploreEmptyState) {
        return;
    }

    if (resultCount === 0) {

        exploreEmptyState.classList.remove("hidden");

        exploreEmptyState.style.display = "block";

    } else {

        exploreEmptyState.classList.add("hidden");

        exploreEmptyState.style.display = "none";

    }

}


/* =========================================================
   14. SORT SELECT EVENT
   ========================================================= */

function initializeExploreSorting() {

    if (!exploreSortSelect) {
        return;
    }

    exploreSortSelect.addEventListener(
        "change",
        function () {

            selectedSort = this.value;

            applyExploreFilters();

        }
    );

}


/* =========================================================
   15. SEARCH INPUT EVENT
   ========================================================= */

function initializeExploreSearch() {

    if (!exploreSearchInput) {
        return;
    }

    exploreSearchInput.addEventListener(
        "input",
        searchExploreRooms
    );

}


/* =========================================================
   16. FAVORITE BUTTON EVENTS
   ========================================================= */

function initializeFavoriteButtons() {

    if (!exploreRoomGrid) {
        return;
    }

    exploreRoomGrid.addEventListener(
        "click",
        function (event) {

            const button = event.target.closest(
                ".favorite-btn, [data-favorite]"
            );

            if (!button) {
                return;
            }

            event.preventDefault();

            event.stopPropagation();

            toggleFavorite(button);

        }
    );

    updateFavoriteButtons();

}


/* =========================================================
   17. RESET ALL FILTERS
   ========================================================= */

function resetExploreFilters() {

    selectedCategory = "all";

    searchQuery = "";

    selectedSort = "recommended";


    if (exploreSearchInput) {
        exploreSearchInput.value = "";
    }


    if (exploreSortSelect) {
        exploreSortSelect.value = "recommended";
    }


    const categoryButtons = document.querySelectorAll(
        "[data-category]"
    );

    categoryButtons.forEach(button => {

        const isAll =
            button.dataset.category === "all";

        button.classList.toggle("active", isAll);

        button.setAttribute(
            "aria-pressed",
            String(isAll)
        );

    });


    applyExploreFilters();

}


/* =========================================================
   18. RESET BUTTON EVENT
   ========================================================= */

function initializeExploreReset() {

    if (!exploreResetButton) {
        return;
    }

    exploreResetButton.addEventListener(
        "click",
        resetExploreFilters
    );

}


/* =========================================================
   19. INITIALIZE EXPLORE PAGE
   ========================================================= */

function initializeExplorePage() {

    if (!exploreRoomGrid) {
        return;
    }

    initializeExploreSearch();

    initializeCategoryFilters();

    initializeExploreSorting();

    initializeFavoriteButtons();

    initializeExploreReset();

    applyExploreFilters();

}


/* =========================================================
   20. START EXPLORE PAGE
   ========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeExplorePage
    );

} else {

    initializeExplorePage();

}


/* =========================================================
   END OF HOTELSPHERE EXPLORE JAVASCRIPT
   ========================================================= */
