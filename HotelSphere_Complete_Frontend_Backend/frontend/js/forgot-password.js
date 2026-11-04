
/* =====================================================
   HOTELSPHERE - FORGOT & RESET PASSWORD
   File: frontend/js/forgot-password.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. COMMON HELPERS
    // -------------------------------------------------

    function $(id) {
        return document.getElementById(id);
    }

    function getValue(id) {
        return $(id) ? $(id).value.trim() : "";
    }

    function showMessage(message, type = "error") {

        const messageBox =
            $("forgotPasswordMessage") ||
            $("resetPasswordMessage") ||
            $("authMessage");

        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = "form-message " + type;
            messageBox.style.display = "block";
        } else {
            alert(message);
        }
    }

    function hideMessage() {

        document.querySelectorAll(
            "#forgotPasswordMessage, #resetPasswordMessage, #authMessage"
        ).forEach(function (element) {

            element.textContent = "";
            element.style.display = "none";

        });

    }

    function validEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    }

    // -------------------------------------------------
    // 2. PASSWORD SHOW / HIDE
    // -------------------------------------------------

    document.querySelectorAll("[data-toggle-password]").forEach(function (button) {

        button.addEventListener("click", function () {

            const input = $(button.dataset.togglePassword);

            if (!input) {
                return;
            }

            const showPassword = input.type === "password";

            input.type = showPassword ? "text" : "password";

            button.textContent = showPassword ? "Hide" : "Show";

        });

    });

    // -------------------------------------------------
    // 3. FORGOT PASSWORD FORM
    // -------------------------------------------------

    const forgotForm = $("forgotPasswordForm");

    if (forgotForm) {

        forgotForm.addEventListener("submit", async function (event) {

            event.preventDefault();
            hideMessage();

            const email = getValue("forgotEmail");

            if (!email) {
                showMessage("Please enter your registered email address.");
                return;
            }

            if (!validEmail(email)) {
                showMessage("Please enter a valid email address.");
                return;
            }

            const button = forgotForm.querySelector(
                'button[type="submit"]'
            );

            try {

                if (button) {
                    button.disabled = true;
                    button.textContent = "Sending...";
                }

                if (
                    !window.HSApi ||
                    typeof window.HSApi.requestPasswordReset !== "function"
                ) {
                    throw new Error(
                        "Password reset API is not connected yet."
                    );
                }

                await window.HSApi.requestPasswordReset({
                    email: email
                });

                showMessage(
                    "If an account exists for this email, reset instructions will be sent.",
                    "success"
                );

                forgotForm.reset();

            } catch (error) {

                console.error("Forgot password error:", error);

                showMessage(
                    error.message || "Unable to process your request."
                );

            } finally {

                if (button) {
                    button.disabled = false;
                    button.textContent = "Send Reset Link";
                }

            }

        });

    }

    // -------------------------------------------------
    // 4. RESET PASSWORD FORM
    // -------------------------------------------------

    const resetForm = $("resetPasswordForm");

    if (resetForm) {

        resetForm.addEventListener("submit", async function (event) {

            event.preventDefault();
            hideMessage();

            const newPassword = getValue("newPassword");
            const confirmPassword = getValue("confirmNewPassword");

            const urlParams = new URLSearchParams(
                window.location.search
            );

            const token = urlParams.get("token");

            if (!token) {
                showMessage("Invalid or missing password reset token.");
                return;
            }

            if (newPassword.length < 8) {
                showMessage(
                    "Password must contain at least 8 characters."
                );
                return;
            }

            if (!/[A-Z]/.test(newPassword)) {
                showMessage(
                    "Password must contain at least one uppercase letter."
                );
                return;
            }

            if (!/[a-z]/.test(newPassword)) {
                showMessage(
                    "Password must contain at least one lowercase letter."
                );
                return;
            }

            if (!/[0-9]/.test(newPassword)) {
                showMessage(
                    "Password must contain at least one number."
                );
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessage("Passwords do not match.");
                return;
            }

            const button = resetForm.querySelector(
                'button[type="submit"]'
            );

            try {

                if (button) {
                    button.disabled = true;
                    button.textContent = "Updating...";
                }

                if (
                    !window.HSApi ||
                    typeof window.HSApi.resetPassword !== "function"
                ) {
                    throw new Error(
                        "Password reset API is not connected yet."
                    );
                }

                await window.HSApi.resetPassword({
                    token: token,
                    new_password: newPassword
                });

                showMessage(
                    "Password updated successfully. You can now login.",
                    "success"
                );

                resetForm.reset();

            } catch (error) {

                console.error("Reset password error:", error);

                showMessage(
                    error.message || "Unable to update your password."
                );

            } finally {

                if (button) {
                    button.disabled = false;
                    button.textContent = "Reset Password";
                }

            }

        });

    }

    // -------------------------------------------------
    // 5. PASSWORD MATCH CHECK
    // -------------------------------------------------

    const newPasswordInput = $("newPassword");
    const confirmPasswordInput = $("confirmNewPassword");

    if (confirmPasswordInput && newPasswordInput) {

        confirmPasswordInput.addEventListener("input", function () {

            if (
                confirmPasswordInput.value &&
                newPasswordInput.value !== confirmPasswordInput.value
            ) {
                confirmPasswordInput.setCustomValidity(
                    "Passwords do not match."
                );
            } else {
                confirmPasswordInput.setCustomValidity("");
            }

        });

        newPasswordInput.addEventListener("input", function () {
            confirmPasswordInput.setCustomValidity("");
        });

    }

});
