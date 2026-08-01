// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/login.js
// Version: 1.0.0
//
// Login Page Controller
// ==========================================================

import {

    auth,

    googleProvider

} from "./firebase.js";

import {

    redirectAfterLogin

} from "./auth.js";

import {

    signInWithEmailAndPassword,

    signInWithPopup,

    setPersistence,

    browserLocalPersistence,

    browserSessionPersistence,

    sendEmailVerification,

    signOut

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// ==========================================================
// DOM Elements
// ==========================================================

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const rememberMe = document.getElementById("rememberMe");

const loginButton = document.getElementById("loginButton");

const googleButton = document.getElementById("googleLoginButton");

const passwordToggle = document.getElementById("togglePassword");

const loadingSpinner = document.getElementById("loginSpinner");

const errorBox = document.getElementById("loginError");

// ==========================================================
// Loading State
// ==========================================================

function setLoading(isLoading) {

    if (loginButton) {

        loginButton.disabled = isLoading;

    }

    if (loadingSpinner) {

        loadingSpinner.classList.toggle(

            "d-none",

            !isLoading

        );

    }

}

// ==========================================================
// Error Display
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
// Form Validation
// ==========================================================

function validateLoginForm() {

    clearError();

    const email = emailInput.value.trim();

    const password = passwordInput.value;

    if (!email) {

        showError(

            "Please enter your email address."

        );

        emailInput.focus();

        return false;

    }

    const emailPattern =

        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        showError(

            "Please enter a valid email address."

        );

        emailInput.focus();

        return false;

    }

    if (!password) {

        showError(

            "Please enter your password."

        );

        passwordInput.focus();

        return false;

    }

    if (password.length < 6) {

        showError(

            "Password must contain at least 6 characters."

        );

        passwordInput.focus();

        return false;

    }

    return true;

}

// ==========================================================
// Password Visibility Toggle
// ==========================================================

if (passwordToggle) {

    passwordToggle.addEventListener(

        "click",

        () => {

            const hidden =

                passwordInput.type === "password";

            passwordInput.type =

                hidden

                    ? "text"

                    : "password";

            passwordToggle.innerHTML = hidden

                ? '<i class="bi bi-eye-slash"></i>'

                : '<i class="bi bi-eye"></i>';

        }

    );

}

// ==========================================================
// Clear Errors While Typing
// ==========================================================

[emailInput, passwordInput].forEach(

    (field) => {

        if (!field) return;

        field.addEventListener(

            "input",

            clearError

        );

    }

);

// ==========================================================
// Email & Password Login
// ==========================================================

async function loginWithEmail() {

    if (!validateLoginForm()) {

        return;

    }

    setLoading(true);

    clearError();

    try {

        await setPersistence(

            auth,

            rememberMe?.checked
                ? browserLocalPersistence
                : browserSessionPersistence

        );

        const credential = await signInWithEmailAndPassword(

            auth,

            emailInput.value.trim().toLowerCase(),

            passwordInput.value

        );

        const user = credential.user;

        if (!user.emailVerified) {

            try {

                await sendEmailVerification(user);

            }

            catch (error) {

                console.warn(error);

            }

            showError(
                "Your email address has not been verified. A new verification email has been sent."
            );

            await signOut(auth);

            return;

        }

        await redirectAfterLogin();

    }

    catch (error) {

        // Handle errors

    }

    finally {

        setLoading(false);

    }

}

// ==========================================================
// Login Form Submit
// ==========================================================

if (loginForm) {

    loginForm.addEventListener(

        "submit",

        (event) => {

            event.preventDefault();

            loginWithEmail();

        }

    );

}

// ==========================================================
// Google Sign In
// ==========================================================

async function loginWithGoogle() {

    setLoading(true);

    clearError();

    try {

        const credential = await signInWithPopup(

            auth,

            googleProvider

        );

        const user = credential.user;

await createCustomerProfile(user);
        // --------------------------------------------------
        // Google accounts are normally verified
        // --------------------------------------------------

        if (!user.emailVerified) {

            showError(

                "Your Google account could not be verified."

            );

            await signOut(auth);

            return;

        }

        // --------------------------------------------------
        // Redirect According To Role
        // --------------------------------------------------

        await redirectAfterLogin();

    }

    catch (error) {

        console.error(

            "Google Sign-In Error:",

            error

        );

        switch (error.code) {

            case "auth/popup-closed-by-user":

                showError(

                    "Google sign-in was cancelled."

                );

                break;

            case "auth/popup-blocked":

                showError(

                    "Your browser blocked the Google sign-in window."

                );

                break;

            case "auth/network-request-failed":

                showError(

                    "Network error. Please check your internet connection."

                );

                break;

            default:

                showError(

                    "Google sign-in failed. Please try again."

                );

        }

    }

    finally {

        setLoading(false);

    }

}

// ==========================================================
// Google Login Button
// ==========================================================

if (googleButton) {

    googleButton.addEventListener(

        "click",

        loginWithGoogle

    );

}

// ==========================================================
// Kenya Gas Marketplace
// Login Page - Part 4
// Startup & Session Management
// ==========================================================

import {

    db,

    now

} from "./firebase.js";

import {

    doc,

    getDoc,

    setDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// Create Customer Profile (Google First Login)
// ==========================================================

async function createCustomerProfile(user) {

    try {

        const userRef = doc(

            db,

            "users",

            user.uid

        );

        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {

            return;

        }

        await setDoc(

            userRef,

            {

                uid: user.uid,

                role: "customer",

                fullName: user.displayName || "",

                email: user.email,

                phone: user.phoneNumber || "",

                profilePhoto: user.photoURL || "",

                status: "active",

                emailVerified: user.emailVerified,

                createdAt: now(),

                updatedAt: now()

            }

        );

    }

    catch (error) {

        console.error(

            "Unable to create customer profile:",

            error

        );

    }

}

// ==========================================================
// Existing Logged-in User
// ==========================================================

async function checkExistingSession() {

    if (!auth.currentUser) {

        return;

    }

    await createCustomerProfile(

        auth.currentUser

    );

    await redirectAfterLogin();

}

// ==========================================================
// Auto Focus
// ==========================================================

function initializeForm() {

    if (emailInput) {

        emailInput.focus();

    }

}

// ==========================================================
// Startup
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        initializeForm();

        await checkExistingSession();

    }

);