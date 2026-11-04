
/* =====================================================
   HOTELSPHERE - LEGAL PAGES
   File: frontend/js/legal.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const legalSearch = document.getElementById("legalSearch");

    const legalSections = document.querySelectorAll(
        ".legal-section"
    );

    const expandAllButton = document.getElementById("expandAllLegal");

    const collapseAllButton = document.getElementById("collapseAllLegal");

    const printButton = document.getElementById("printLegal");

    const lastUpdated = document.getElementById("legalLastUpdated");

    const noResults = document.getElementById("legalNoResults");

    // Cookie banner elements
    const cookieBanner = document.getElementById("cookieBanner");

    const acceptCookies = document.getElementById("acceptCookies");

    const rejectCookies = document.getElementById("rejectCookies");

    const cookieSettingsButton = document.getElementById("cookieSettings");

    const COOKIE_KEY = "hotelsphere-cookie-preference";


    // -------------------------------------------------
    // 2. SET LAST UPDATED DATE
    // -------------------------------------------------

    if (lastUpdated) {

        const updatedDate = new Date();

        lastUpdated.textContent = updatedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

    }


    // -------------------------------------------------
    // 3. EXPAND AND COLLAPSE LEGAL SECTIONS
    // -------------------------------------------------

    function setSectionState(section, shouldOpen) {

        const content = section.querySelector(".legal-content");

        const toggle = section.querySelector(".legal-toggle");

        if (content) {

            content.hidden = !shouldOpen;

        }

        if (toggle) {

            toggle.setAttribute(
                "aria-expanded",
                String(shouldOpen)
            );

        }

    }

    legalSections.forEach(function (section) {

        const toggle = section.querySelector(".legal-toggle");

        if (!toggle) return;

        toggle.addEventListener("click", function () {

            const content = section.querySelector(".legal-content");

            const isOpen = content && !content.hidden;

            setSectionState(section, !isOpen);

        });

    });


    // -------------------------------------------------
    // 4. EXPAND ALL SECTIONS
    // -------------------------------------------------

    if (expandAllButton) {

        expandAllButton.addEventListener("click", function () {

            legalSections.forEach(section => {

                setSectionState(section, true);

            });

        });

    }


    // -------------------------------------------------
    // 5. COLLAPSE ALL SECTIONS
    // -------------------------------------------------

    if (collapseAllButton) {

        collapseAllButton.addEventListener("click", function () {

            legalSections.forEach(section => {

                setSectionState(section, false);

            });

        });

    }


    // -------------------------------------------------
    // 6. LEGAL CONTENT SEARCH
    // -------------------------------------------------

    function searchLegalContent() {

        if (!legalSearch) return;

        const query = legalSearch.value
            .trim()
            .toLowerCase();

        let visibleCount = 0;

        legalSections.forEach(function (section) {

            const text = section.textContent.toLowerCase();

            const matches = !query || text.includes(query);

            section.hidden = !matches;

            if (matches) {

                visibleCount++;

                if (query) {

                    setSectionState(section, true);

                }

            }

        });

        if (noResults) {

            noResults.style.display =
                visibleCount === 0 ? "block" : "none";

        }

    }

    if (legalSearch) {

        legalSearch.addEventListener(
            "input",
            searchLegalContent
        );

    }


    // -------------------------------------------------
    // 7. PRINT LEGAL DOCUMENT
    // -------------------------------------------------

    if (printButton) {

        printButton.addEventListener("click", function () {

            window.print();

        });

    }


    // -------------------------------------------------
    // 8. COOKIE PREFERENCE
    // -------------------------------------------------

    function getCookiePreference() {

        try {

            return localStorage.getItem(COOKIE_KEY);

        } catch (error) {

            console.warn(
                "Cookie preference storage unavailable.",
                error
            );

            return null;

        }

    }

    function saveCookiePreference(preference) {

        try {

            localStorage.setItem(
                COOKIE_KEY,
                preference
            );

            if (cookieBanner) {

                cookieBanner.style.display = "none";

            }

        } catch (error) {

            console.error(
                "Unable to save cookie preference:",
                error
            );

            alert(
                "Your browser could not save this preference."
            );

        }

    }


    // -------------------------------------------------
    // 9. DISPLAY COOKIE BANNER
    // -------------------------------------------------

    if (cookieBanner) {

        const savedPreference = getCookiePreference();

        cookieBanner.style.display =
            savedPreference ? "none" : "block";

    }


    // -------------------------------------------------
    // 10. ACCEPT COOKIES
    // -------------------------------------------------

    if (acceptCookies) {

        acceptCookies.addEventListener("click", function () {

            saveCookiePreference("accepted");

        });

    }


    // -------------------------------------------------
    // 11. REJECT OPTIONAL COOKIES
    // -------------------------------------------------

    if (rejectCookies) {

        rejectCookies.addEventListener("click", function () {

            saveCookiePreference("rejected");

        });

    }


    // -------------------------------------------------
    // 12. OPEN COOKIE SETTINGS
    // -------------------------------------------------

    if (cookieSettingsButton) {

        cookieSettingsButton.addEventListener("click", function () {

            if (cookieBanner) {

                cookieBanner.style.display = "block";

            }

        });

    }


    // -------------------------------------------------
    // 13. INITIALIZE LEGAL PAGE
    // -------------------------------------------------

    legalSections.forEach(function (section, index) {

        // First section opens by default.
        setSectionState(section, index === 0);

    });

});
