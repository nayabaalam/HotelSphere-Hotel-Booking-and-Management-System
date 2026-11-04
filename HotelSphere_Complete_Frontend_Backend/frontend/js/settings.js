/* =========================================================
   HOTELSPHERE - SETTINGS
   File: frontend/js/settings.js
========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "hotelsphere-settings";

    const DEFAULT_SETTINGS = {
        theme: "light",
        emailNotifications: true,
        bookingNotifications: true,
        promotionalNotifications: false,
        soundEffects: true,
        browserNotifications: false
    };

    const $ = id => document.getElementById(id);

    let settings = { ...DEFAULT_SETTINGS };

    // Load saved settings
    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                settings = {
                    ...DEFAULT_SETTINGS,
                    ...JSON.parse(saved)
                };
            } else {
                settings = { ...DEFAULT_SETTINGS };
            }
        } catch (error) {
            console.error("Settings loading error:", error);
            settings = { ...DEFAULT_SETTINGS };
        }

        return settings;
    }

    // Save settings
    function saveSettings() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

            applyTheme(settings.theme);
            showMessage("Settings saved successfully!", "success");

            return true;
        } catch (error) {
            console.error("Settings saving error:", error);
            showMessage("Unable to save settings.", "error");
            return false;
        }
    }

    // Apply theme
    function applyTheme(theme) {
        const selectedTheme = theme === "dark" ? "dark" : "light";

        document.documentElement.setAttribute(
            "data-theme",
            selectedTheme
        );

        // Keep the existing site's theme preference in sync
        localStorage.setItem("hotelsphere-theme", selectedTheme);

        const themeButtons = document.querySelectorAll(
            "[data-theme-option]"
        );

        themeButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.themeOption === selectedTheme
            );
        });
    }

    // Show message
    function showMessage(message, type = "success") {
        const box = $("settingsMessage");

        if (!box) {
            console.log(message);
            return;
        }

        box.textContent = message;
        box.className = `settings-message ${type} show`;

        clearTimeout(box.hideTimer);

        box.hideTimer = setTimeout(() => {
            box.classList.remove("show");
        }, 3000);
    }

    // Display saved settings in form
    function renderSettings() {
        const themeSelect = $("themeSelect");

        if (themeSelect) {
            themeSelect.value = settings.theme;
        }

        const controls = {
            emailNotifications: "emailNotifications",
            bookingNotifications: "bookingNotifications",
            promotionalNotifications: "promotionalNotifications",
            soundEffects: "soundEffects",
            browserNotifications: "browserNotifications"
        };

        Object.entries(controls).forEach(([key, id]) => {
            const element = $(id);

            if (element) {
                element.checked = Boolean(settings[key]);
            }
        });

        updateNotificationStatus();
    }

    // Read current form values
    function readFormSettings() {
        settings.theme = $("themeSelect")?.value || "light";

        const controls = [
            "emailNotifications",
            "bookingNotifications",
            "promotionalNotifications",
            "soundEffects",
            "browserNotifications"
        ];

        controls.forEach(id => {
            const element = $(id);

            if (element) {
                settings[id] = element.checked;
            }
        });
    }

    // Change theme immediately
    function handleThemeChange(event) {
        const theme = event.target.value;

        settings.theme = theme;
        applyTheme(theme);

        // Save the theme immediately
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );
        } catch (error) {
            showMessage("Could not save theme preference.", "error");
        }
    }

    // Update browser notification status
    function updateNotificationStatus() {
        const status = $("browserNotificationStatus");

        if (!status) return;

        if (!("Notification" in window)) {
            status.textContent = "Not supported by this browser";
            return;
        }

        const permission = Notification.permission;

        if (permission === "granted") {
            status.textContent = "Permission granted";
        } else if (permission === "denied") {
            status.textContent = "Blocked in browser settings";
        } else {
            status.textContent = "Permission not requested";
        }
    }

    // Request browser notification permission
    async function enableBrowserNotifications() {
        if (!("Notification" in window)) {
            showMessage(
                "Your browser does not support notifications.",
                "error"
            );
            return;
        }

        if (Notification.permission === "granted") {
            settings.browserNotifications = true;
            saveSettings();
            updateNotificationStatus();
            return;
        }

        if (Notification.permission === "denied") {
            showMessage(
                "Notifications are blocked. Change permission in browser settings.",
                "error"
            );
            updateNotificationStatus();
            return;
        }

        try {
            const permission = await Notification.requestPermission();

            settings.browserNotifications =
                permission === "granted";

            saveSettings();
            updateNotificationStatus();

            if (permission === "granted") {
                showMessage("Browser notifications enabled!");
            } else {
                showMessage("Notification permission was not granted.", "error");
            }
        } catch (error) {
            console.error("Notification permission error:", error);
            showMessage("Unable to request notification permission.", "error");
        }
    }

    // Send test notification
    function sendTestNotification() {
        if (!("Notification" in window)) {
            showMessage("Notifications are not supported.", "error");
            return;
        }

        if (Notification.permission !== "granted") {
            showMessage(
                "Please enable browser notifications first.",
                "error"
            );
            return;
        }

        if (!settings.browserNotifications) {
            showMessage(
                "Turn on browser notifications in HotelSphere settings first.",
                "error"
            );
            return;
        }

        try {
            new Notification("HotelSphere", {
                body: "Your notification settings are working!",
                icon: "assets/images/logo.png"
            });
        } catch (error) {
            showMessage("Could not display the test notification.", "error");
        }
    }

    // Reset settings
    function resetSettings() {
        const confirmed = confirm(
            "Are you sure you want to reset all settings?"
        );

        if (!confirmed) return;

        settings = { ...DEFAULT_SETTINGS };

        if (saveSettings()) {
            renderSettings();
            showMessage("Settings have been reset.");
        }
    }

    // Save button handler
    function handleSave(event) {
        event.preventDefault();

        readFormSettings();
        saveSettings();
        renderSettings();
    }

    // Initialize settings
    function initializeSettings() {
        loadSettings();
        applyTheme(settings.theme);
        renderSettings();

        $("settingsForm")?.addEventListener(
            "submit",
            handleSave
        );

        $("themeSelect")?.addEventListener(
            "change",
            handleThemeChange
        );

        $("resetSettings")?.addEventListener(
            "click",
            resetSettings
        );

        $("enableBrowserNotifications")?.addEventListener(
            "click",
            enableBrowserNotifications
        );

        $("testNotification")?.addEventListener(
            "click",
            sendTestNotification
        );

        document.querySelectorAll("[data-theme-option]").forEach(button => {
            button.addEventListener("click", () => {
                const theme = button.dataset.themeOption;

                if (theme !== "light" && theme !== "dark") return;

                settings.theme = theme;
                applyTheme(theme);

                const select = $("themeSelect");

                if (select) {
                    select.value = theme;
                }

                try {
                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(settings)
                    );
                } catch (error) {
                    showMessage("Unable to save theme.", "error");
                }
            });
        });
    }

    document.addEventListener(
        "DOMContentLoaded",
        initializeSettings
    );

    // Public methods
    window.HSSettings = {
        get: () => ({ ...settings }),

        save: saveSettings,

        reset: () => {
            settings = { ...DEFAULT_SETTINGS };
            saveSettings();
            renderSettings();
        },

        applyTheme: applyTheme,

        enableNotifications: enableBrowserNotifications
    };

})();