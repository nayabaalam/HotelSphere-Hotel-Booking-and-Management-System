
/* =====================================================
   HOTELSPHERE - NOTIFICATION CENTER
   File: frontend/js/notifications.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const notificationButton = document.getElementById(
        "notificationButton"
    );

    const notificationPanel = document.getElementById(
        "notificationPanel"
    );

    const notificationList = document.getElementById(
        "notificationList"
    );

    const notificationBadge = document.getElementById(
        "notificationBadge"
    );

    const closeNotificationButton = document.getElementById(
        "closeNotifications"
    );

    const markAllReadButton = document.getElementById(
        "markAllRead"
    );

    const clearAllButton = document.getElementById(
        "clearAllNotifications"
    );

    const enableBrowserNotifications = document.getElementById(
        "enableBrowserNotifications"
    );

    const notificationEmpty = document.getElementById(
        "notificationEmpty"
    );

    const notificationStatus = document.getElementById(
        "notificationStatus"
    );


    // -------------------------------------------------
    // 2. STORAGE CONFIGURATION
    // -------------------------------------------------

    const STORAGE_KEY = "hotelsphere-notifications";

    let notifications = [];


    // -------------------------------------------------
    // 3. SAMPLE NOTIFICATIONS
    // -------------------------------------------------

    const sampleNotifications = [

        {
            id: "welcome-001",
            title: "Welcome to HotelSphere",
            message: "Your hotel management dashboard is ready.",
            type: "info",
            read: false,
            createdAt: new Date().toISOString()
        },

        {
            id: "booking-001",
            title: "Booking Management",
            message: "You can monitor your hotel bookings here.",
            type: "booking",
            read: false,
            createdAt: new Date().toISOString()
        },

        {
            id: "payment-001",
            title: "Payment Center",
            message: "Check payment records from the Payments section.",
            type: "payment",
            read: true,
            createdAt: new Date().toISOString()
        }

    ];


    // -------------------------------------------------
    // 4. HELPER FUNCTIONS
    // -------------------------------------------------

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

    function getRelativeTime(value) {

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Unknown time";
        }

        const difference = Math.max(
            0,
            Date.now() - date.getTime()
        );

        const minutes = Math.floor(
            difference / 60000
        );

        if (minutes < 1) return "Just now";

        if (minutes < 60) {
            return minutes + " min ago";
        }

        const hours = Math.floor(minutes / 60);

        if (hours < 24) {
            return hours + " hours ago";
        }

        const days = Math.floor(hours / 24);

        return days + " days ago";

    }


    // -------------------------------------------------
    // 5. SAVE NOTIFICATIONS
    // -------------------------------------------------

    function saveNotifications() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(notifications)
            );

        } catch (error) {

            console.error(
                "Unable to save notifications:",
                error
            );

            updateStatus(
                "Unable to save notification changes."
            );

        }

    }


    // -------------------------------------------------
    // 6. LOAD NOTIFICATIONS
    // -------------------------------------------------

    function loadNotifications() {

        try {

            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {

                const parsed = JSON.parse(saved);

                if (Array.isArray(parsed)) {

                    notifications = parsed;

                } else {

                    notifications = [...sampleNotifications];

                }

            } else {

                notifications = [...sampleNotifications];

                saveNotifications();

            }

        } catch (error) {

            console.error(
                "Notification loading error:",
                error
            );

            notifications = [...sampleNotifications];

        }

    }


    // -------------------------------------------------
    // 7. UPDATE STATUS MESSAGE
    // -------------------------------------------------

    function updateStatus(message) {

        if (!notificationStatus) return;

        notificationStatus.textContent = message;

    }


    // -------------------------------------------------
    // 8. UPDATE UNREAD COUNT
    // -------------------------------------------------

    function updateUnreadCount() {

        const unreadCount = notifications.filter(
            notification => !notification.read
        ).length;

        if (notificationBadge) {

            notificationBadge.textContent =
                unreadCount > 99 ? "99+" : unreadCount;

            notificationBadge.style.display =
                unreadCount > 0 ? "inline-flex" : "none";

        }

    }


    // -------------------------------------------------
    // 9. RENDER NOTIFICATIONS
    // -------------------------------------------------

    function renderNotifications() {

        if (!notificationList) return;

        notificationList.innerHTML = "";

        if (notifications.length === 0) {

            if (notificationEmpty) {
                notificationEmpty.style.display = "block";
            }

            updateUnreadCount();

            return;

        }

        if (notificationEmpty) {
            notificationEmpty.style.display = "none";
        }

        const sortedNotifications = [...notifications].sort(
            (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
        );

        sortedNotifications.forEach(function (notification) {

            const item = document.createElement("div");

            item.className =
                "notification-item" +
                (notification.read ? " read" : " unread");

            const iconMap = {
                info: "ℹ️",
                booking: "📅",
                payment: "💳",
                success: "✅",
                warning: "⚠️",
                error: "❌"
            };

            const icon =
                iconMap[notification.type] || "🔔";

            item.innerHTML = `

                <div class="notification-icon">
                    ${icon}
                </div>

                <div class="notification-content">

                    <h4>
                        ${escapeHTML(notification.title)}
                    </h4>

                    <p>
                        ${escapeHTML(notification.message)}
                    </p>

                    <small>
                        ${escapeHTML(
                            getRelativeTime(notification.createdAt)
                        )}
                    </small>

                    <div class="notification-actions">

                        ${
                            notification.read
                            ? ""
                            : `
                                <button
                                    type="button"
                                    class="mark-read-button"
                                    data-id="${escapeHTML(notification.id)}"
                                >
                                    Mark as Read
                                </button>
                            `
                        }

                        <button
                            type="button"
                            class="delete-notification-button"
                            data-id="${escapeHTML(notification.id)}"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;

            notificationList.appendChild(item);

        });

        updateUnreadCount();

    }


    // -------------------------------------------------
    // 10. MARK INDIVIDUAL NOTIFICATION AS READ
    // -------------------------------------------------

    function markAsRead(id) {

        notifications = notifications.map(notification => {

            if (String(notification.id) === String(id)) {

                return {
                    ...notification,
                    read: true
                };

            }

            return notification;

        });

        saveNotifications();

        renderNotifications();

    }


    // -------------------------------------------------
    // 11. MARK ALL AS READ
    // -------------------------------------------------

    function markAllAsRead() {

        notifications = notifications.map(notification => ({

            ...notification,
            read: true

        }));

        saveNotifications();

        renderNotifications();

        updateStatus("All notifications marked as read.");

    }


    // -------------------------------------------------
    // 12. DELETE NOTIFICATION
    // -------------------------------------------------

    function deleteNotification(id) {

        notifications = notifications.filter(
            notification =>
                String(notification.id) !== String(id)
        );

        saveNotifications();

        renderNotifications();

    }


    // -------------------------------------------------
    // 13. CLEAR ALL NOTIFICATIONS
    // -------------------------------------------------

    function clearAllNotifications() {

        if (notifications.length === 0) return;

        const confirmed = confirm(
            "Are you sure you want to clear all notifications?"
        );

        if (!confirmed) return;

        notifications = [];

        saveNotifications();

        renderNotifications();

        updateStatus("All notifications cleared.");

    }


    // -------------------------------------------------
    // 14. ADD NEW NOTIFICATION
    // -------------------------------------------------

    function addNotification(data) {

        if (!data || !data.title || !data.message) {

            console.error(
                "Notification title and message are required."
            );

            return;

        }

        const notification = {

            id: (
                window.crypto?.randomUUID?.() ||
                "notification-" + Date.now() + "-" +
                Math.random().toString(36).slice(2)
            ),

            title: String(data.title),

            message: String(data.message),

            type: data.type || "info",

            read: false,

            createdAt: new Date().toISOString()

        };

        notifications.unshift(notification);

        saveNotifications();

        renderNotifications();

    }


    // -------------------------------------------------
    // 15. OPEN AND CLOSE PANEL
    // -------------------------------------------------

    function openPanel() {

        if (!notificationPanel) return;

        notificationPanel.hidden = false;

        notificationButton?.setAttribute(
            "aria-expanded",
            "true"
        );

    }

    function closePanel() {

        if (!notificationPanel) return;

        notificationPanel.hidden = true;

        notificationButton?.setAttribute(
            "aria-expanded",
            "false"
        );

    }

    function togglePanel() {

        if (!notificationPanel) return;

        if (notificationPanel.hidden) {

            openPanel();

        } else {

            closePanel();

        }

    }


    // -------------------------------------------------
    // 16. NOTIFICATION BUTTON
    // -------------------------------------------------

    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            togglePanel
        );

    }

    if (closeNotificationButton) {

        closeNotificationButton.addEventListener(
            "click",
            closePanel
        );

    }


    // -------------------------------------------------
    // 17. NOTIFICATION ACTIONS
    // -------------------------------------------------

    if (notificationList) {

        notificationList.addEventListener(
            "click",
            function (event) {

                const readButton = event.target.closest(
                    ".mark-read-button"
                );

                const deleteButton = event.target.closest(
                    ".delete-notification-button"
                );

                if (readButton) {

                    markAsRead(readButton.dataset.id);

                }

                if (deleteButton) {

                    deleteNotification(deleteButton.dataset.id);

                }

            }
        );

    }


    // -------------------------------------------------
    // 18. MARK ALL BUTTON
    // -------------------------------------------------

    if (markAllReadButton) {

        markAllReadButton.addEventListener(
            "click",
            markAllAsRead
        );

    }


    // -------------------------------------------------
    // 19. CLEAR ALL BUTTON
    // -------------------------------------------------

    if (clearAllButton) {

        clearAllButton.addEventListener(
            "click",
            clearAllNotifications
        );

    }


    // -------------------------------------------------
    // 20. BROWSER NOTIFICATION PERMISSION
    // -------------------------------------------------

    async function requestBrowserPermission() {

        if (!("Notification" in window)) {

            updateStatus(
                "Your browser does not support system notifications."
            );

            return;

        }

        if (!window.isSecureContext) {

            updateStatus(
                "System notifications require HTTPS or localhost."
            );

            return;

        }

        try {

            const permission =
                await Notification.requestPermission();

            if (permission === "granted") {

                updateStatus(
                    "Browser notifications enabled."
                );

            } else {

                updateStatus(
                    "Browser notification permission was not granted."
                );

            }

        } catch (error) {

            console.error(
                "Notification permission error:",
                error
            );

            updateStatus(
                "Unable to request notification permission."
            );

        }

    }


    // -------------------------------------------------
    // 21. SEND BROWSER NOTIFICATION
    // -------------------------------------------------

    function sendBrowserNotification(title, message) {

        if (!("Notification" in window)) return;

        if (Notification.permission !== "granted") return;

        try {

            // Basic desktop notification.
            // Mobile persistent notifications require a service worker.

            const browserNotification = new Notification(title, {

                body: message,

                icon: "assets/images/logo.png"

            });

            browserNotification.onclick = function () {

                window.focus();

                openPanel();

                browserNotification.close();

            };

        } catch (error) {

            console.warn(
                "Browser notification could not be displayed:",
                error
            );

        }

    }


    if (enableBrowserNotifications) {

        enableBrowserNotifications.addEventListener(
            "click",
            requestBrowserPermission
        );

    }


    // -------------------------------------------------
    // 22. EXPOSE NOTIFICATION FUNCTIONS
    // -------------------------------------------------

    window.HSNotifications = {

        add: addNotification,

        markAsRead: markAsRead,

        markAllAsRead: markAllAsRead,

        clearAll: clearAllNotifications,

        sendBrowser: sendBrowserNotification,

        getAll: function () {
            return [...notifications];
        },

        getUnreadCount: function () {

            return notifications.filter(
                notification => !notification.read
            ).length;

        }

    };


    // -------------------------------------------------
    // 23. INITIALIZE NOTIFICATIONS
    // -------------------------------------------------

    loadNotifications();

    renderNotifications();

    closePanel();

});
