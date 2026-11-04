
/* =====================================================
   HOTELSPHERE - AUTHENTICATION
   File: frontend/js/auth.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // -------------------------------------------------
    // 1. COMMON HELPERS
    // -------------------------------------------------

    function $(id) {
        return document.getElementById(id);
    }

    function showMessage(message, type = "error") {

        const messageBox =
            $("authMessage") ||
            $("loginMessage") ||
            $("signupMessage");

        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = "form-message " + type;
            messageBox.style.display = "block";
        } else {
            alert(message);
        }
    }

    function hideMessage() {

        const messageBox =
            $("authMessage") ||
            $("loginMessage") ||
            $("signupMessage");

        if (messageBox) {
            messageBox.textContent = "";
            messageBox.style.display = "none";
        }
    }

    function getValue(id) {
        const element = $(id);
        return element ? element.value.trim() : "";
    }

    function setButtonLoading(button, loading, text) {

        if (!button) return;

        button.disabled = loading;

        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> ' + text;
        } else if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }

    // -------------------------------------------------
    // 2. PASSWORD SHOW / HIDE
    // -------------------------------------------------

    document.querySelectorAll("[data-password-target]").forEach(
        function (button) {

            button.addEventListener("click", function () {

                const targetId = button.dataset.passwordTarget;
                const passwordInput = $(targetId);

                if (!passwordInput) return;

                const isPassword =
                    passwordInput.type === "password";

                passwordInput.type = isPassword ? "text" : "password";

                button.innerHTML = isPassword
                    ? '<i class="fa-regular fa-eye-slash"></i>'
                    : '<i class="fa-regular fa-eye"></i>';

                button.setAttribute(
                    "aria-label",
                    isPassword ? "Hide password" : "Show password"
                );
            });
        }
    );

    // -------------------------------------------------
    // 3. PASSWORD STRENGTH CHECK
    // -------------------------------------------------

    const signupPassword = $("signupPassword");
    const strengthBar = $("passwordStrength");
    const strengthText = $("passwordStrengthText");

    function checkPasswordStrength(password) {

        let score = 0;

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        let label = "Very Weak";

        if (score >= 5) {
            label = "Strong";
        } else if (score >= 4) {
            label = "Good";
        } else if (score >= 3) {
            label = "Medium";
        } else if (score >= 2) {
            label = "Weak";
        }

        if (strengthText) {
            strengthText.textContent =
                password.length ? label : "";
        }

        if (strengthBar) {
            strengthBar.style.width = (score * 20) + "%";
            strengthBar.dataset.strength =
                label.toLowerCase().replace(" ", "-");
        }
    }

    if (signupPassword) {
        signupPassword.addEventListener("input", function () {
            checkPasswordStrength(signupPassword.value);
        });
    }

    // -------------------------------------------------
    // 4. LOGIN FORM
    // -------------------------------------------------

    const loginForm = $("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async function (event) {

            event.preventDefault();
            hideMessage();

            const email = getValue("loginEmail");
            const password = getValue("loginPassword");

            if (!email || !password) {
                showMessage("Please enter your email and password.");
                return;
            }

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {
                showMessage("Please enter a valid email address.");
                return;
            }

            // Login API is not connected yet.
            showMessage(
                "Login API is not connected yet. Backend authentication is required.",
                "warning"
            );

        });
    }

    // -------------------------------------------------
    // 5. SIGNUP FORM
    // -------------------------------------------------

    const signupForm = $("signupForm");

    if (signupForm) {

        signupForm.addEventListener("submit", async function (event) {

            event.preventDefault();
            hideMessage();

            // Read values using the actual HTML IDs.
            const fullName = getValue("signupName");
            const email = getValue("signupEmail");
            const phone = getValue("signupPhone");
            const password = getValue("signupPassword");
            const confirmPassword = getValue("confirmPassword");

            const terms = $("acceptTerms");
            const signupButton = $("signupButton");

            // FULL NAME VALIDATION
            if (!fullName || fullName.length < 2) {
                showMessage("Please enter your full name.");
                $("signupName")?.focus();
                return;
            }

            // EMAIL VALIDATION
            if (!email) {
                showMessage("Please enter your email address.");
                $("signupEmail")?.focus();
                return;
            }

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {
                showMessage("Please enter a valid email address.");
                $("signupEmail")?.focus();
                return;
            }

            // PHONE VALIDATION
            if (!phone) {
                showMessage("Please enter your mobile number.");
                $("signupPhone")?.focus();
                return;
            }

            const phoneDigits = phone.replace(/\D/g, "");

            if (phoneDigits.length !== 10) {
                showMessage(
                    "Please enter a valid 10-digit mobile number."
                );
                $("signupPhone")?.focus();
                return;
            }

            // PASSWORD VALIDATION
            if (password.length < 8) {
                showMessage(
                    "Password must contain at least 8 characters."
                );
                $("signupPassword")?.focus();
                return;
            }

            // CONFIRM PASSWORD VALIDATION
            if (!confirmPassword) {
                showMessage("Please confirm your password.");
                $("confirmPassword")?.focus();
                return;
            }

            if (password !== confirmPassword) {
                showMessage("Passwords do not match.");
                $("confirmPassword")?.focus();
                return;
            }

            // TERMS VALIDATION
            if (!terms || !terms.checked) {
                showMessage(
                    "Please accept the Terms and Conditions."
                );
                return;
            }

            // -------------------------------------------------
            // REGISTRATION API
            // -------------------------------------------------

            /*
               IMPORTANT:

               Actual registration API is not connected here yet.

               Backend registration must:
               1. Check whether email already exists.
               2. Hash password securely.
               3. Insert customer details into Oracle Database.
               4. Return a safe success response.

               Never store plain-text passwords in browser storage.
            */

            showMessage(
                "All details are valid, but registration API is not connected yet.",
                "warning"
            );

        });
    }

    // -------------------------------------------------
    // 6. LOGOUT
    // -------------------------------------------------

    const logoutButtons = document.querySelectorAll(
        "#logoutButton, [data-logout]"
    );

    logoutButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            sessionStorage.removeItem("hotelsphere-user");

            window.location.href = "login.html";

        });
    });

    // -------------------------------------------------
    // 7. FORGOT PASSWORD LINK
    // -------------------------------------------------

    const forgotPasswordLink = $("forgotPasswordLink");

    if (forgotPasswordLink) {

        forgotPasswordLink.addEventListener("click", function (event) {

            event.preventDefault();

            window.location.href = "forgot-password.html";

        });
    }

});
