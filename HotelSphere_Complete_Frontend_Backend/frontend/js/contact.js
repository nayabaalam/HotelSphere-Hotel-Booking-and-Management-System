
/* =====================================================
   HOTELSPHERE - CONTACT FORM
   File: frontend/js/contact.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. HTML ELEMENTS
    // -------------------------------------------------

    const contactForm = document.getElementById("contactForm");

    const nameInput = document.getElementById("contactName");
    const emailInput = document.getElementById("contactEmail");
    const phoneInput = document.getElementById("contactPhone");
    const subjectInput = document.getElementById("contactSubject");
    const messageInput = document.getElementById("contactMessage");

    const messageCounter = document.getElementById("messageCounter");

    const submitButton = document.getElementById("contactSubmit");

    const successMessage = document.getElementById("contactSuccess");
    const errorMessage = document.getElementById("contactError");

    if (!contactForm) return;


    // -------------------------------------------------
    // 2. HELPER FUNCTIONS
    // -------------------------------------------------

    function showMessage(element, message) {

        if (!element) return;

        element.textContent = message;
        element.style.display = "block";

    }

    function hideMessage(element) {

        if (!element) return;

        element.style.display = "none";

    }

    function setLoading(isLoading) {

        if (!submitButton) return;

        submitButton.disabled = isLoading;

        submitButton.textContent = isLoading
            ? "Sending Message..."
            : "Send Message";

    }

    function getValue(element) {

        return element ? element.value.trim() : "";

    }


    // -------------------------------------------------
    // 3. MESSAGE CHARACTER COUNTER
    // -------------------------------------------------

    function updateCharacterCounter() {

        if (!messageInput || !messageCounter) return;

        const currentLength = messageInput.value.length;

        const maximumLength = Number(
            messageInput.getAttribute("maxlength")
        ) || 1000;

        messageCounter.textContent =
            currentLength + " / " + maximumLength + " characters";

    }

    if (messageInput) {

        messageInput.addEventListener(
            "input",
            updateCharacterCounter
        );

        updateCharacterCounter();

    }


    // -------------------------------------------------
    // 4. FORM VALIDATION
    // -------------------------------------------------

    function validateContactForm() {

        const name = getValue(nameInput);
        const email = getValue(emailInput);
        const phone = getValue(phoneInput);
        const subject = getValue(subjectInput);
        const message = getValue(messageInput);

        if (name.length < 2) {

            alert("Please enter a valid name.");

            nameInput?.focus();

            return false;

        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            alert("Please enter a valid email address.");

            emailInput?.focus();

            return false;

        }

        if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {

            alert("Please enter a valid phone number.");

            phoneInput?.focus();

            return false;

        }

        if (subject.length < 3) {

            alert("Please enter a subject.");

            subjectInput?.focus();

            return false;

        }

        if (message.length < 10) {

            alert("Message must contain at least 10 characters.");

            messageInput?.focus();

            return false;

        }

        return true;

    }


    // -------------------------------------------------
    // 5. COLLECT FORM DATA
    // -------------------------------------------------

    function collectContactData() {

        return {

            name: getValue(nameInput),

            email: getValue(emailInput),

            phone: getValue(phoneInput),

            subject: getValue(subjectInput),

            message: getValue(messageInput),

            submitted_at: new Date().toISOString()

        };

    }


    // -------------------------------------------------
    // 6. SUBMIT CONTACT FORM
    // -------------------------------------------------

    contactForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        hideMessage(successMessage);
        hideMessage(errorMessage);

        if (!validateContactForm()) {
            return;
        }

        const contactData = collectContactData();

        setLoading(true);

        try {

            /*
              Contact API is not yet implemented
              in the current HotelSphere backend.

              Do not show a fake success message.
            */

            if (
                !window.HSApi ||
                typeof window.HSApi.sendContactMessage !== "function"
            ) {

                throw new Error(
                    "Contact service is not connected yet. Please try again later."
                );

            }

            const response =
                await window.HSApi.sendContactMessage(contactData);

            if (
                response?.success === false ||
                response?.status === "ERROR"
            ) {

                throw new Error(
                    response.message || "Unable to send your message."
                );

            }

            showMessage(
                successMessage,
                "Thank you! Your message has been submitted successfully."
            );

            contactForm.reset();

            updateCharacterCounter();

        } catch (error) {

            console.error(
                "Contact form error:",
                error
            );

            showMessage(
                errorMessage,
                error.message || "Something went wrong. Please try again."
            );

        } finally {

            setLoading(false);

        }

    });


    // -------------------------------------------------
    // 7. CLEAR ERROR WHEN USER STARTS TYPING
    // -------------------------------------------------

    contactForm.addEventListener("input", function () {

        hideMessage(errorMessage);

        hideMessage(successMessage);

    });

});
