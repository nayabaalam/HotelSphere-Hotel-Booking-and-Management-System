
/* =====================================================
   HOTELSPHERE - FAQ PAGE
   File: frontend/js/faq.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. GET HTML ELEMENTS
    // -------------------------------------------------

    const faqSearch = document.getElementById("faqSearch");

    const faqItems = document.querySelectorAll(".faq-item");

    const categoryButtons = document.querySelectorAll(
        "[data-faq-category]"
    );

    const expandAllButton = document.getElementById("expandAllFaq");

    const collapseAllButton = document.getElementById("collapseAllFaq");

    const noResults = document.getElementById("faqNoResults");

    const faqCount = document.getElementById("faqCount");

    let activeCategory = "all";

    // -------------------------------------------------
    // 2. OPEN AND CLOSE FAQ
    // -------------------------------------------------

    function closeFaq(item) {

        const answer = item.querySelector(".faq-answer");
        const question = item.querySelector(".faq-question");

        item.classList.remove("active");

        if (answer) {
            answer.style.maxHeight = null;
            answer.hidden = true;
        }

        if (question) {
            question.setAttribute("aria-expanded", "false");
        }

    }

    function openFaq(item) {

        const answer = item.querySelector(".faq-answer");
        const question = item.querySelector(".faq-question");

        item.classList.add("active");

        if (answer) {
            answer.hidden = false;
            answer.style.maxHeight = answer.scrollHeight + "px";
        }

        if (question) {
            question.setAttribute("aria-expanded", "true");
        }

    }

    faqItems.forEach(function (item) {

        const question = item.querySelector(".faq-question");

        if (!question) {
            return;
        }

        question.addEventListener("click", function () {

            const isOpen = item.classList.contains("active");

            // Close all other FAQs
            faqItems.forEach(function (otherItem) {

                if (otherItem !== item) {
                    closeFaq(otherItem);
                }

            });

            // Toggle selected FAQ
            if (isOpen) {
                closeFaq(item);
            } else {
                openFaq(item);
            }

        });

    });

    // -------------------------------------------------
    // 3. SEARCH FAQ
    // -------------------------------------------------

    function filterFaqs() {

        const searchText = faqSearch
            ? faqSearch.value.trim().toLowerCase()
            : "";

        let visibleCount = 0;

        faqItems.forEach(function (item) {

            const question = item.querySelector(".faq-question");

            const answer = item.querySelector(".faq-answer");

            const questionText = question
                ? question.textContent.toLowerCase()
                : "";

            const answerText = answer
                ? answer.textContent.toLowerCase()
                : "";

            const category = (
                item.dataset.category || "general"
            ).toLowerCase();

            const matchesSearch =
                questionText.includes(searchText) ||
                answerText.includes(searchText);

            const matchesCategory =
                activeCategory === "all" ||
                category === activeCategory;

            const isVisible =
                matchesSearch && matchesCategory;

            item.style.display = isVisible ? "" : "none";

            if (isVisible) {
                visibleCount++;
            } else {
                closeFaq(item);
            }

        });

        // Update count
        if (faqCount) {
            faqCount.textContent =
                `${visibleCount} FAQ${visibleCount === 1 ? "" : "s"} found`;
        }

        // No results message
        if (noResults) {
            noResults.style.display =
                visibleCount === 0 ? "block" : "none";
        }

    }

    if (faqSearch) {

        faqSearch.addEventListener("input", filterFaqs);

    }

    // -------------------------------------------------
    // 4. CATEGORY FILTER
    // -------------------------------------------------

    categoryButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            activeCategory = (
                button.dataset.faqCategory || "all"
            ).toLowerCase();

            categoryButtons.forEach(function (otherButton) {

                otherButton.classList.remove("active");

                otherButton.setAttribute(
                    "aria-pressed",
                    "false"
                );

            });

            button.classList.add("active");

            button.setAttribute(
                "aria-pressed",
                "true"
            );

            filterFaqs();

        });

    });

    // -------------------------------------------------
    // 5. EXPAND ALL FAQS
    // -------------------------------------------------

    if (expandAllButton) {

        expandAllButton.addEventListener("click", function () {

            faqItems.forEach(function (item) {

                if (item.style.display !== "none") {
                    openFaq(item);
                }

            });

        });

    }

    // -------------------------------------------------
    // 6. COLLAPSE ALL FAQS
    // -------------------------------------------------

    if (collapseAllButton) {

        collapseAllButton.addEventListener("click", function () {

            faqItems.forEach(function (item) {
                closeFaq(item);
            });

        });

    }

    // -------------------------------------------------
    // 7. INITIALIZE FAQ PAGE
    // -------------------------------------------------

    faqItems.forEach(function (item) {

        const answer = item.querySelector(".faq-answer");
        const question = item.querySelector(".faq-question");

        if (answer) {
            answer.hidden = true;
            answer.style.maxHeight = null;
        }

        if (question) {
            question.setAttribute("aria-expanded", "false");
        }

    });

    filterFaqs();

});
