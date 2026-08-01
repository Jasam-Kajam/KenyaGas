// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/register.js
// Version: 1.0.0
//
// Customer Registration Controller
// ==========================================================

import {

    auth,

    db,

    now

} from "./firebase.js";

import {

    createUserWithEmailAndPassword,

    sendEmailVerification,

    updateProfile

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {

    doc,

    setDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// DOM Elements
// ==========================================================

const registerForm =

    document.getElementById("registerForm");

const fullName =

    document.getElementById("fullName");

const email =

    document.getElementById("email");

const phone =

    document.getElementById("phone");

const county =

    document.getElementById("county");

const town =

    document.getElementById("town");

const password =

    document.getElementById("password");

const confirmPassword =

    document.getElementById("confirmPassword");

const registerButton =

    document.getElementById("registerButton");

const loadingSpinner =

    document.getElementById("registerSpinner");

const errorBox =

    document.getElementById("registerError");

const strengthBar =

    document.getElementById("passwordStrengthBar");

const strengthText =

    document.getElementById("passwordStrengthText");

const passwordToggle =

    document.getElementById("togglePassword");

const confirmPasswordToggle =

    document.getElementById("toggleConfirmPassword");

// ==========================================================
// Loading State
// ==========================================================

function setLoading(isLoading) {

    if (registerButton) {

        registerButton.disabled = isLoading;

    }

    if (loadingSpinner) {

        loadingSpinner.classList.toggle(

            "d-none",

            !isLoading

        );

    }

}

// ==========================================================
// Error Handling
// ==========================================================

function showError(message) {

    if (!errorBox) {

        alert(message);

        return;

    }

    errorBox.textContent = message;

    errorBox.classList.remove("d-none");

}

function clearError() {

    if (!errorBox) return;

    errorBox.classList.add("d-none");

    errorBox.textContent = "";

}

// ==========================================================
// Kenyan Phone Validation
// ==========================================================

function validPhone(number) {

    const regex =

        /^(\+254|254|0)7\d{8}$/;

    return regex.test(

        number.trim()

    );

}

// ==========================================================
// Password Strength
// ==========================================================

function calculateStrength(value) {

    let score = 0;

    if (value.length >= 8) score++;

    if (/[A-Z]/.test(value)) score++;

    if (/[a-z]/.test(value)) score++;

    if (/\d/.test(value)) score++;

    if (/[^A-Za-z0-9]/.test(value)) score++;

    return score;

}

function updateStrengthMeter() {

    if (!strengthBar ||

        !strengthText) {

        return;

    }

    const score =

        calculateStrength(

            password.value

        );

    strengthBar.style.width =

        `${score * 20}%`;

    switch (score) {

        case 0:
        case 1:

            strengthBar.style.background =

                "#dc3545";

            strengthText.textContent =

                "Weak";

            break;

        case 2:
        case 3:

            strengthBar.style.background =

                "#ffc107";

            strengthText.textContent =

                "Medium";

            break;

        case 4:
        case 5:

            strengthBar.style.background =

                "#198754";

            strengthText.textContent =

                "Strong";

            break;

    }

}

// ==========================================================
// Password Visibility
// ==========================================================

if (passwordToggle) {

    passwordToggle.addEventListener(

        "click",

        () => {

            password.type =

                password.type === "password"

                    ? "text"

                    : "password";

        }

    );

}

if (confirmPasswordToggle) {

    confirmPasswordToggle.addEventListener(

        "click",

        () => {

            confirmPassword.type =

                confirmPassword.type === "password"

                    ? "text"

                    : "password";

        }

    );

}

// ==========================================================
// Live Events
// ==========================================================

if (password) {

    password.addEventListener(

        "input",

        updateStrengthMeter

    );

}

[

    fullName,

    email,

    phone,

    county,

    town,

    password,

    confirmPassword

].forEach((field) => {

    if (!field) return;

    field.addEventListener(

        "input",

        clearError

    );

});

// ==========================================================
// Form Validation
// ==========================================================

function validateRegistrationForm() {

    clearError();

    if (!fullName.value.trim()) {

        showError(

            "Please enter your full name."

        );

        fullName.focus();

        return false;

    }

    if (fullName.value.trim().length < 3) {

        showError(

            "Full name must contain at least 3 characters."

        );

        fullName.focus();

        return false;

    }

    const emailPattern =

        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.value.trim())) {

        showError(

            "Please enter a valid email address."

        );

        email.focus();

        return false;

    }

    if (!validPhone(phone.value)) {

        showError(

            "Please enter a valid Kenyan mobile number."

        );

        phone.focus();

        return false;

    }

    if (!county.value) {

        showError(

            "Please select your county."

        );

        county.focus();

        return false;

    }

    if (!town.value) {

        showError(

            "Please select your town."

        );

        town.focus();

        return false;

    }

    if (password.value.length < 8) {

        showError(

            "Password must contain at least 8 characters."

        );

        password.focus();

        return false;

    }

    if (

        password.value !==

        confirmPassword.value

    ) {

        showError(

            "Passwords do not match."

        );

        confirmPassword.focus();

        return false;

    }

    return true;

}

// ==========================================================
// Customer Registration
// ==========================================================

async function registerCustomer() {

    if (!validateRegistrationForm()) {

        return;

    }

    setLoading(true);

    clearError();

    try {

        // --------------------------------------------------
        // Create Firebase Account
        // --------------------------------------------------

        const credential =

            await createUserWithEmailAndPassword(

                auth,

                email.value.trim().toLowerCase(),

                password.value

            );

        const user = credential.user;

        // --------------------------------------------------
        // Update Firebase Profile
        // --------------------------------------------------

        await updateProfile(

            user,

            {

                displayName:

                    fullName.value.trim()

            }

        );

        // --------------------------------------------------
        // Send Email Verification
        // --------------------------------------------------

        await sendEmailVerification(

            user

        );

        // --------------------------------------------------
        // Continue To Firestore
        // --------------------------------------------------

        await createCustomerProfile(

            user

        );

    }

    catch (error) {

        console.error(

            "Registration Error:",

            error

        );

        switch (error.code) {

            case "auth/email-already-in-use":

                showError(

                    "An account already exists with this email."

                );

                break;

            case "auth/invalid-email":

                showError(

                    "Invalid email address."

                );

                break;

            case "auth/weak-password":

                showError(

                    "Please choose a stronger password."

                );

                break;

            case "auth/network-request-failed":

                showError(

                    "Network error. Please check your connection."

                );

                break;

            default:

                showError(

                    "Unable to create your account. Please try again."

                );

        }

    }

    finally {

        setLoading(false);

    }

}

// ==========================================================
// Create Customer Profile
// ==========================================================

async function createCustomerProfile(user) {

    try {

        await setDoc(

            doc(

                db,

                "users",

                user.uid

            ),

            {

                uid: user.uid,

                role: "customer",

                fullName:

                    fullName.value.trim(),

                email:

                    email.value.trim().toLowerCase(),

                phone:

                    phone.value.trim(),

                county:

                    county.value,

                town:

                    town.value,

                profilePhoto: "",

                status: "active",

                emailVerified: false,

                accountCompleted: true,

                createdAt: now(),

                updatedAt: now()

            }

        );

        // --------------------------------------------------
        // Registration Successful
        // --------------------------------------------------

        sessionStorage.setItem(

            "registrationSuccess",

            "true"

        );

        window.location.href =

            "/verify-email/";

    }

    catch (error) {

        console.error(

            "Unable to create customer profile:",

            error

        );

        showError(

            "Your account was created, but we couldn't finish setting up your profile. Please contact support."

        );

    }

}

// ==========================================================
// Live Password Match Validation
// ==========================================================

function validatePasswordMatch() {

    if (

        !password.value ||

        !confirmPassword.value

    ) {

        return;

    }

    if (

        password.value ===

        confirmPassword.value

    ) {

        confirmPassword.setCustomValidity("");

    }

    else {

        confirmPassword.setCustomValidity(

            "Passwords do not match."

        );

    }

}

// ==========================================================
// Live Validation Events
// ==========================================================

if (password) {

    password.addEventListener(

        "input",

        validatePasswordMatch

    );

}

if (confirmPassword) {

    confirmPassword.addEventListener(

        "input",

        validatePasswordMatch

    );

}

// ==========================================================
// Form Submission
// ==========================================================

if (registerForm) {

    registerForm.addEventListener(

        "submit",

        async (event) => {

            event.preventDefault();

            await registerCustomer();

        }

    );

}

// ==========================================================
// Auto Focus
// ==========================================================

function initializeForm() {

    if (fullName) {

        fullName.focus();

    }

}

// ==========================================================
// Registration Success Message
// ==========================================================

if (

    sessionStorage.getItem(

        "registrationSuccess"

    )

) {

    sessionStorage.removeItem(

        "registrationSuccess"

    );

    console.log(

        "Customer account created successfully."

    );

}

// ==========================================================
// Startup
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeForm();

        updateStrengthMeter();

    }

);

// ==========================================================
// Export (Optional)
// ==========================================================

export {

    registerCustomer

};