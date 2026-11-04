
/* =========================================================
   HOTELSPHERE - SHARED WEBSITE JAVASCRIPT
   File: frontend/js/site.js
   ========================================================= */

"use strict";


/* =========================================================
   1. GLOBAL CONFIGURATION
   ========================================================= */

const SITE_CONFIG = {
    themeKey: "hotelsphere-theme",
    defaultTheme: "light",
    clockInterval: 1000
};


/* =========================================================
   2. COMMON DOM SELECTOR
   ========================================================= */

function siteElement(selector) {
    return document.querySelector(selector);
}

function siteElements(selector) {
    return document.querySelectorAll(selector);
}


/* =========================================================
   3. THEME MANAGEMENT
   ========================================================= */

function getSavedTheme() {

    try {

        const savedTheme = localStorage.getItem(
            SITE_CONFIG.themeKey
        );

        if (savedTheme === "dark" || savedTheme === "light") {
            return savedTheme;
        }

    } catch (error) {

        console.warn("Unable to read saved theme:", error);

    }

    return SITE_CONFIG.defaultTheme;
}


function applyTheme(theme) {

    const selectedTheme =
        theme === "dark" ? "dark" : "light";

    document.documentElement.setAttribute(
        "data-theme",
        selectedTheme
    );

    try {

        localStorage.setItem(
            SITE_CONFIG.themeKey,
            selectedTheme
        );

    } catch (error) {

        console.warn("Unable to save theme:", error);

    }

    updateThemeButtons(selectedTheme);
}


function updateThemeButtons(theme) {

    const themeButtons = siteElements(
        "#themeToggle, .theme-toggle"
    );

    themeButtons.forEach(button => {

        const icon = button.querySelector("i");

        if (icon) {

            icon.className =
                theme === "dark"
                    ? "fa-solid fa-sun"
                    : "fa-solid fa-moon";

        }

        button.setAttribute(
            "aria-label",
            theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
        );

        button.setAttribute(
            "title",
            theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
        );

    });

}


function toggleTheme() {

    const currentTheme =
        document.documentElement.getAttribute("data-theme") ||
        SITE_CONFIG.defaultTheme;

    const newTheme =
        currentTheme === "dark" ? "light" : "dark";

    applyTheme(newTheme);

}


function initializeTheme() {

    const savedTheme = getSavedTheme();

    applyTheme(savedTheme);

    const themeButtons = siteElements(
        "#themeToggle, .theme-toggle"
    );

    themeButtons.forEach(button => {

        button.addEventListener("click", toggleTheme);

    });

}


/* =========================================================
   4. LIVE DATE AND TIME
   ========================================================= */

function updateDateTime() {

    const now = new Date();

    const dateFormatter = new Intl.DateTimeFormat(
        "en-IN",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

    const timeFormatter = new Intl.DateTimeFormat(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    );

    const formattedDate = dateFormatter.format(now);

    const formattedTime = timeFormatter.format(now);


    const dateElements = siteElements("#currentDate");

    dateElements.forEach(element => {

        element.textContent = formattedDate;

    });


    const timeElements = siteElements("#currentTime");

    timeElements.forEach(element => {

        element.textContent = formattedTime;

    });

}


function initializeClock() {

    updateDateTime();

    setInterval(
        updateDateTime,
        SITE_CONFIG.clockInterval
    );

}


/* =========================================================
   5. AUTOMATIC COPYRIGHT YEAR
   ========================================================= */

function initializeCopyrightYear() {

    const yearElements = siteElements("#currentYear");

    const currentYear = new Date().getFullYear();

    yearElements.forEach(element => {

        element.textContent = currentYear;

    });

}


/* =========================================================
   6. MOBILE NAVIGATION
   ========================================================= */

function initializeMobileNavigation() {

    const menuButton = siteElement("#mobileMenuToggle");

    const navigation = siteElement("#navLinks");

    if (!menuButton || !navigation) {
        return;
    }

    menuButton.addEventListener("click", function () {

        const isOpen =
            navigation.classList.toggle("active");

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        const icon = menuButton.querySelector("i");

        if (icon) {

            icon.className = isOpen
                ? "fa-solid fa-xmark"
                : "fa-solid fa-bars";

        }

    });


    navigation.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", function () {

            navigation.classList.remove("active");

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            const icon = menuButton.querySelector("i");

            if (icon) {
                icon.className = "fa-solid fa-bars";
            }

        });

    });

}


/* =========================================================
   7. ACTIVE NAVIGATION LINK
   ========================================================= */

function initializeActiveNavigation() {

    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const navLinks = siteElements(
        ".nav-links a, .admin-nav a"
    );

    navLinks.forEach(link => {

        const href = link.getAttribute("href");

        if (!href || href.startsWith("#")) {
            return;
        }

        const linkPage = href
            .split("/")
            .pop()
            .split("?")[0]
            .toLowerCase();

        if (linkPage === currentPage) {

            link.classList.add("active");

        } else {

            link.classList.remove("active");

        }

    });

}


/* =========================================================
   8. BACK TO TOP BUTTON
   ========================================================= */

function initializeBackToTop() {

    const button = siteElement("#backToTop");

    if (!button) {
        return;
    }

    function updateButtonVisibility() {

        if (window.scrollY > 350) {

            button.classList.add("visible");

        } else {

            button.classList.remove("visible");

        }

    }

    window.addEventListener(
        "scroll",
        updateButtonVisibility,
        { passive: true }
    );

    button.addEventListener("click", function () {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

    updateButtonVisibility();

}


/* =========================================================
   9. PREVENT EMPTY HASH NAVIGATION
   ========================================================= */

function initializeSmoothNavigation() {

    const links = siteElements('a[href="#"]');

    links.forEach(link => {

        link.addEventListener("click", function (event) {

            event.preventDefault();

        });

    });

}


/* =========================================================
   10. INITIALIZE WEBSITE
   ========================================================= */

function initializeSite() {

    initializeTheme();

    initializeClock();

    initializeCopyrightYear();

    initializeMobileNavigation();

    initializeActiveNavigation();

    initializeBackToTop();

    initializeSmoothNavigation();

}


/* =========================================================
   11. START WEBSITE
   ========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSite
    );

} else {

    initializeSite();

}


/* =========================================================
   END OF HOTELSPHERE SITE JAVASCRIPT
   ========================================================= */
