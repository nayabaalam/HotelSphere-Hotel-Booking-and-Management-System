
/* =====================================================
   HOTELSPHERE - 404 ERROR PAGE
   File: frontend/js/404.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const countdownElement = document.getElementById("countdown");

    const homeButton = document.getElementById("goHomeButton");

    const backButton = document.getElementById("goBackButton");

    const searchButton = document.getElementById("searchRoomsButton");

    const searchInput = document.getElementById("errorSearchInput");

    const searchMessage = document.getElementById("errorSearchMessage");

    // -------------------------------------------------
    // 2. CONFIGURATION
    // -------------------------------------------------

    const HOME_PAGE = "index.html";

    const EXPLORE_PAGE = "explore.html";

    const REDIRECT_SECONDS = 10;

    let remainingSeconds = REDIRECT_SECONDS;

    let redirectTimer = null;

    // -------------------------------------------------
    // 3. UPDATE COUNTDOWN
    // -------------------------------------------------

    function updateCountdown() {

        if (countdownElement) {

            countdownElement.textContent = remainingSeconds;

        }

    }

    // -------------------------------------------------
    // 4. REDIRECT TO HOMEPAGE
    // -------------------------------------------------

    function redirectHome() {

        window.location.href = HOME_PAGE;

    }

    // -------------------------------------------------
    // 5. START COUNTDOWN
    // -------------------------------------------------

    function startCountdown() {

        updateCountdown();

        redirectTimer = setInterval(function () {

            remainingSeconds--;

            updateCountdown();

            if (remainingSeconds <= 0) {

                clearInterval(redirectTimer);

                redirectHome();

            }

        }, 1000);

    }

    // -------------------------------------------------
    // 6. STOP COUNTDOWN
    // -------------------------------------------------

    function stopCountdown() {

        if (redirectTimer !== null) {

            clearInterval(redirectTimer);

            redirectTimer = null;

        }

    }

    // -------------------------------------------------
    // 7. HOMEPAGE BUTTON
    // -------------------------------------------------

    if (homeButton) {

        homeButton.addEventListener("click", function () {

            stopCountdown();

            redirectHome();

        });

    }

    // -------------------------------------------------
    // 8. GO BACK BUTTON
    // -------------------------------------------------

    if (backButton) {

        backButton.addEventListener("click", function () {

            stopCountdown();

            if (window.history.length > 1) {

                window.history.back();

            } else {

                redirectHome();

            }

        });

    }

    // -------------------------------------------------
    // 9. SEARCH ROOMS
    // -------------------------------------------------

    function searchRooms() {

        const searchValue = searchInput
            ? searchInput.value.trim()
            : "";

        if (!searchValue) {

            if (searchMessage) {

                searchMessage.textContent =
                    "Please enter a room name or category.";

            }

            searchInput?.focus();

            return;

        }

        stopCountdown();

        const searchURL =
            EXPLORE_PAGE +
            "?search=" +
            encodeURIComponent(searchValue);

        window.location.href = searchURL;

    }

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            searchRooms
        );

    }

    if (searchInput) {

        searchInput.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                searchRooms();

            }

        });

    }

    // -------------------------------------------------
    // 10. INITIALIZE 404 PAGE
    // -------------------------------------------------

    if (countdownElement) {

        startCountdown();

    }

});
