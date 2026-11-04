/* =========================================================
   HOTELSPHERE - USER PROFILE
   File: frontend/js/profile.js
========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "hotelsphere-user-profile";

    const DEFAULT_PROFILE = {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        country: "India",
        photo: ""
    };

    let originalProfile = {};
    let currentProfile = {};

    const $ = id => document.getElementById(id);

    // Load profile from localStorage
    function getProfile() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                return {
                    ...DEFAULT_PROFILE,
                    ...JSON.parse(saved)
                };
            }

            // Try to get basic information from login session
            const loggedInUser = sessionStorage.getItem("hotelsphere-user");

            if (loggedInUser) {
                try {
                    const user = JSON.parse(loggedInUser);

                    return {
                        ...DEFAULT_PROFILE,
                        firstName: user.firstName || user.first_name || "",
                        lastName: user.lastName || user.last_name || "",
                        email: user.email || "",
                        phone: user.phone || ""
                    };
                } catch (error) {
                    console.warn("Could not read login profile.");
                }
            }

            return { ...DEFAULT_PROFILE };

        } catch (error) {
            console.error("Profile loading error:", error);
            return { ...DEFAULT_PROFILE };
        }
    }

    // Save profile
    function saveProfile(profile) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(profile)
            );

            currentProfile = { ...profile };
            originalProfile = { ...profile };

            return true;

        } catch (error) {
            console.error("Profile saving error:", error);
            showMessage("Unable to save profile. Storage may be full.", "error");
            return false;
        }
    }

    // Display message
    function showMessage(message, type = "success") {
        const messageBox = $("profileMessage");

        if (!messageBox) {
            alert(message);
            return;
        }

        messageBox.textContent = message;
        messageBox.className = "profile-message " + type;

        messageBox.classList.add("show");

        clearTimeout(messageBox.hideTimer);

        messageBox.hideTimer = setTimeout(() => {
            messageBox.classList.remove("show");
        }, 3000);
    }

    // Fill profile form
    function fillProfileForm(profile) {
        const fields = {
            profileFirstName: profile.firstName,
            profileLastName: profile.lastName,
            profileEmail: profile.email,
            profilePhone: profile.phone,
            profileCity: profile.city,
            profileCountry: profile.country
        };

        Object.entries(fields).forEach(([id, value]) => {
            const field = $(id);

            if (field) {
                field.value = value || "";
            }
        });

        updateProfileDisplay(profile);
    }

    // Update profile information on page
    function updateProfileDisplay(profile) {
        const fullName = [
            profile.firstName,
            profile.lastName
        ].filter(Boolean).join(" ") || "HotelSphere Guest";

        const nameElement = $("profileDisplayName");
        const emailElement = $("profileDisplayEmail");
        const avatarElement = $("profileAvatar");
        const photoElement = $("profilePhotoPreview");

        if (nameElement) {
            nameElement.textContent = fullName;
        }

        if (emailElement) {
            emailElement.textContent = profile.email || "No email added";
        }

        if (avatarElement) {
            avatarElement.textContent = (
                fullName.charAt(0).toUpperCase()
            );
        }

        if (profile.photo) {
            if (photoElement) {
                photoElement.src = profile.photo;
                photoElement.classList.remove("hidden");
            }

            if (avatarElement) {
                avatarElement.classList.add("hidden");
            }
        } else {
            if (photoElement) {
                photoElement.removeAttribute("src");
                photoElement.classList.add("hidden");
            }

            if (avatarElement) {
                avatarElement.classList.remove("hidden");
            }
        }
    }

    // Read form data
    function getFormData() {
        return {
            firstName: $("profileFirstName")?.value.trim() || "",
            lastName: $("profileLastName")?.value.trim() || "",
            email: $("profileEmail")?.value.trim() || "",
            phone: $("profilePhone")?.value.trim() || "",
            city: $("profileCity")?.value.trim() || "",
            country: $("profileCountry")?.value.trim() || "",
            photo: currentProfile.photo || ""
        };
    }

    // Validate profile
    function validateProfile(profile) {
        if (!profile.firstName) {
            showMessage("Please enter your first name.", "error");
            return false;
        }

        if (!profile.email) {
            showMessage("Please enter your email.", "error");
            return false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(profile.email)) {
            showMessage("Please enter a valid email address.", "error");
            return false;
        }

        if (profile.phone && !/^[0-9+\-\s()]{7,20}$/.test(profile.phone)) {
            showMessage("Please enter a valid phone number.", "error");
            return false;
        }

        return true;
    }

    // Save button
    function handleSaveProfile(event) {
        event.preventDefault();

        const updatedProfile = getFormData();

        if (!validateProfile(updatedProfile)) {
            return;
        }

        if (saveProfile(updatedProfile)) {
            updateProfileDisplay(updatedProfile);
            setEditMode(false);
            showMessage("Profile updated successfully!");
        }
    }

    // Enable / disable editing
   function setEditMode(enabled) {
    const form = $("profileForm");

    if (!form) return;

    // Enable / disable all form fields
    const fields = form.querySelectorAll(
        "input:not([type='file']), select"
    );

    fields.forEach(field => {
        // Email remains read-only
        if (field.id !== "profileEmail") {
            field.disabled = !enabled;
        }
    });

    // Enable / disable photo controls
    const photoInput = $("profilePhoto");
    const removePhotoButton = $("removeProfilePhoto");

    if (photoInput) {
        photoInput.disabled = !enabled;
    }

    if (removePhotoButton) {
        removePhotoButton.disabled = !enabled;
    }

    // Get action buttons
    const editButton = $("editProfileButton");
    const saveButton = $("saveProfileButton");
    const cancelButton = $("cancelProfileButton");

    // Toggle button visibility
    if (editButton) {
        editButton.classList.toggle("hidden", enabled);
    }

    if (saveButton) {
        saveButton.classList.toggle("hidden", !enabled);
    }

    if (cancelButton) {
        cancelButton.classList.toggle("hidden", !enabled);
    }
}
    // Cancel editing
    function cancelEditing() {
        currentProfile = { ...originalProfile };

        fillProfileForm(originalProfile);
        setEditMode(false);

        showMessage("Changes discarded.", "info");
    }

    // Upload profile photo
    function handlePhotoUpload(event) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showMessage("Please select a valid image.", "error");
            event.target.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showMessage("Image size must be below 2 MB.", "error");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            currentProfile.photo = reader.result;

            const preview = $("profilePhotoPreview");
            const avatar = $("profileAvatar");

            if (preview) {
                preview.src = reader.result;
                preview.classList.remove("hidden");
            }

            if (avatar) {
                avatar.classList.add("hidden");
            }

            showMessage("Photo selected. Save your profile to keep it.");
        };

        reader.onerror = function () {
            showMessage("Unable to read the selected image.", "error");
        };

        reader.readAsDataURL(file);
    }

    // Remove profile photo
    function removePhoto() {
        currentProfile.photo = "";

        const preview = $("profilePhotoPreview");
        const avatar = $("profileAvatar");

        if (preview) {
            preview.removeAttribute("src");
            preview.classList.add("hidden");
        }

        if (avatar) {
            avatar.classList.remove("hidden");
        }

        const upload = $("profilePhoto");

        if (upload) {
            upload.value = "";
        }

        showMessage("Photo removed. Save your profile to confirm.");
    }

    // Initialize profile
    function initializeProfile() {
        currentProfile = getProfile();
        originalProfile = { ...currentProfile };

        fillProfileForm(currentProfile);
        setEditMode(false);

        const form = $("profileForm");

        if (form) {
            form.addEventListener("submit", handleSaveProfile);
        }

        $("editProfileButton")?.addEventListener("click", () => {
            setEditMode(true);
        });

        $("cancelProfileButton")?.addEventListener(
            "click",
            cancelEditing
        );

        $("profilePhoto")?.addEventListener(
            "change",
            handlePhotoUpload
        );

        $("removeProfilePhoto")?.addEventListener(
            "click",
            removePhoto
        );
    }

    document.addEventListener(
        "DOMContentLoaded",
        initializeProfile
    );

    // Public methods
    window.HSProfile = {
        get: getProfile,
        save: saveProfile,
        refresh: initializeProfile
    };

})();