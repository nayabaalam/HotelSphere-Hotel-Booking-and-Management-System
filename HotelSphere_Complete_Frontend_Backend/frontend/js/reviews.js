/* =========================================================
   HOTELSPHERE - REVIEWS & RATINGS
   File: frontend/js/reviews.js
========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "hotelsphere-reviews";

    const $ = id => document.getElementById(id);

    // Get reviews from localStorage
    function getReviews() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const reviews = saved ? JSON.parse(saved) : [];

            return Array.isArray(reviews) ? reviews : [];
        } catch (error) {
            console.error("Review loading error:", error);
            return [];
        }
    }

    // Save reviews
    function saveReviews(reviews) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(reviews)
            );
            return true;
        } catch (error) {
            console.error("Review saving error:", error);
            showMessage("Unable to save review.", "error");
            return false;
        }
    }

    // Escape HTML
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    // Show message
    function showMessage(message, type = "success") {
        const box = $("reviewMessage");

        if (!box) {
            alert(message);
            return;
        }

        box.textContent = message;
        box.className = `review-message ${type} show`;

        clearTimeout(box.hideTimer);

        box.hideTimer = setTimeout(() => {
            box.classList.remove("show");
        }, 3000);
    }

    // Get current room ID
    function getRoomId() {
        const params = new URLSearchParams(window.location.search);

        return (
            $("reviewRoomId")?.value ||
            params.get("roomId") ||
            params.get("room_id") ||
            "general"
        );
    }

    // Get logged-in customer information
    function getCustomerName() {
        try {
            const user = JSON.parse(
                sessionStorage.getItem("hotelsphere-user") || "{}"
            );

            return user.fullName ||
                user.name ||
                [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                "HotelSphere Guest";
        } catch (error) {
            return "HotelSphere Guest";
        }
    }

    // Get selected star rating
    function getSelectedRating() {
        const selected = document.querySelector(
            'input[name="reviewRating"]:checked'
        );

        return selected ? Number(selected.value) : 0;
    }

    // Render star icons
    function renderStars(rating) {
        const value = Math.max(0, Math.min(5, Number(rating) || 0));

        return Array.from({ length: 5 }, (_, index) => {
            return index < Math.round(value) ? "★" : "☆";
        }).join("");
    }

    // Calculate average rating
    function calculateAverage(reviews) {
        if (!reviews.length) return 0;

        const total = reviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
        );

        return total / reviews.length;
    }

    // Update rating summary
    function updateRatingSummary(reviews) {
        const average = calculateAverage(reviews);

        if ($("averageRating")) {
            $("averageRating").textContent = average.toFixed(1);
        }

        if ($("averageStars")) {
            $("averageStars").textContent = renderStars(average);
        }

        if ($("totalReviews")) {
            $("totalReviews").textContent = reviews.length;
        }

        for (let rating = 1; rating <= 5; rating++) {
            const count = reviews.filter(
                review => Number(review.rating) === rating
            ).length;

            const countElement = $(`ratingCount${rating}`);
            const barElement = $(`ratingBar${rating}`);

            if (countElement) {
                countElement.textContent = count;
            }

            if (barElement) {
                barElement.style.width = reviews.length
                    ? `${(count / reviews.length) * 100}%`
                    : "0%";
            }
        }
    }

    // Render review cards
    function renderReviews() {
        const container = $("reviewsContainer");

        if (!container) return;

        const roomId = getRoomId();

        let reviews = getReviews().filter(
            review => String(review.roomId) === String(roomId)
        );

        const search = $("reviewSearch")?.value
            .trim()
            .toLowerCase() || "";

        const sort = $("reviewSort")?.value || "newest";

        if (search) {
            reviews = reviews.filter(review =>
                `${review.name} ${review.title} ${review.comment}`
                    .toLowerCase()
                    .includes(search)
            );
        }

        if (sort === "highest") {
            reviews.sort((a, b) => b.rating - a.rating);
        } else if (sort === "lowest") {
            reviews.sort((a, b) => a.rating - b.rating);
        } else {
            reviews.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );
        }

        updateRatingSummary(
            getReviews().filter(
                review => String(review.roomId) === String(roomId)
            )
        );

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="reviews-empty">
                    <div class="empty-icon">★</div>
                    <h3>No Reviews Yet</h3>
                    <p>Be the first to share your experience!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(review => {
            const date = new Date(review.date).toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                }
            );

            const initial = escapeHTML(
                (review.name || "G").charAt(0).toUpperCase()
            );

            return `
                <article class="review-card">
                    <div class="review-header">
                        <div class="review-user">
                            <div class="review-avatar">${initial}</div>

                            <div>
                                <h4>${escapeHTML(review.name)}</h4>
                                <span>${date}</span>
                            </div>
                        </div>

                        <div class="review-stars">
                            ${renderStars(review.rating)}
                        </div>
                    </div>

                    <h3>${escapeHTML(review.title)}</h3>

                    <p>${escapeHTML(review.comment)}</p>

                    <div class="review-footer">
                        <span>Rating: ${review.rating}/5</span>

                        <button
                            type="button"
                            class="review-delete"
                            data-delete-review="${escapeHTML(review.id)}"
                        >
                            Delete
                        </button>
                    </div>
                </article>
            `;
        }).join("");
    }

    // Submit new review
    function submitReview(event) {
        event.preventDefault();

        const rating = getSelectedRating();
        const title = $("reviewTitle")?.value.trim() || "";
        const comment = $("reviewComment")?.value.trim() || "";

        if (!rating) {
            showMessage("Please select a star rating.", "error");
            return;
        }

        if (!title) {
            showMessage("Please enter a review title.", "error");
            return;
        }

        if (comment.length < 10) {
            showMessage(
                "Please write at least 10 characters in your review.",
                "error"
            );
            return;
        }

        const reviews = getReviews();

        const newReview = {
            id: "REV-" + Date.now(),
            roomId: getRoomId(),
            name: getCustomerName(),
            rating: rating,
            title: title,
            comment: comment,
            date: new Date().toISOString()
        };

        reviews.push(newReview);

        if (!saveReviews(reviews)) return;

        $("reviewForm")?.reset();

        renderReviews();

        showMessage("Thank you! Your review has been added.");
    }

    // Delete a review
    function deleteReview(reviewId) {
        const reviews = getReviews();

        const updatedReviews = reviews.filter(
            review => String(review.id) !== String(reviewId)
        );

        if (updatedReviews.length === reviews.length) return;

        if (saveReviews(updatedReviews)) {
            renderReviews();
            showMessage("Review deleted successfully.");
        }
    }

    // Initialize star rating preview
    function initializeStarRating() {
        const stars = document.querySelectorAll(
            'input[name="reviewRating"]'
        );

        const preview = $("ratingPreview");

        function updatePreview() {
            const rating = getSelectedRating();

            if (preview) {
                preview.textContent = rating
                    ? `${renderStars(rating)} (${rating}/5)`
                    : "Select your rating";
            }
        }

        stars.forEach(star => {
            star.addEventListener("change", updatePreview);
        });

        updatePreview();
    }

    // Initialize reviews
    function initializeReviews() {
        const form = $("reviewForm");

        if (form) {
            form.addEventListener("submit", submitReview);
        }

        $("reviewSearch")?.addEventListener(
            "input",
            renderReviews
        );

        $("reviewSort")?.addEventListener(
            "change",
            renderReviews
        );

        $("reviewsContainer")?.addEventListener(
            "click",
            function (event) {
                const button = event.target.closest(
                    "[data-delete-review]"
                );

                if (!button) return;

                if (confirm("Are you sure you want to delete this review?")) {
                    deleteReview(button.dataset.deleteReview);
                }
            }
        );

        initializeStarRating();
        renderReviews();
    }

    document.addEventListener(
        "DOMContentLoaded",
        initializeReviews
    );

    // Public methods
    window.HSReviews = {
        getAll: getReviews,
        render: renderReviews,
        add: function (review) {
            const reviews = getReviews();

            reviews.push({
                ...review,
                id: review.id || "REV-" + Date.now(),
                date: review.date || new Date().toISOString()
            });

            if (saveReviews(reviews)) {
                renderReviews();
                return true;
            }

            return false;
        },
        delete: deleteReview,
        average: calculateAverage
    };

})();