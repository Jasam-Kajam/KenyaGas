// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/supplier-login.js
// Version: 1.0.0
//
// Supplier Login Controller
// ==========================================================

import {

    auth,

    db

} from "./firebase.js";

import {

    signInWithEmailAndPassword,

    sendEmailVerification,

    signOut,

    setPersistence,

    browserLocalPersistence,

    browserSessionPersistence,

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {

    doc,

    getDoc,

    updateDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// DOM Elements
// ==========================================================

const supplierLoginForm =

    document.getElementById(

        "supplierLoginForm"

    );

const email =

    document.getElementById(

        "email"

    );

const password =

    document.getElementById(

        "password"

    );

const rememberMe =

    document.getElementById(

        "rememberMe"

    );

const togglePassword =

    document.getElementById(

        "togglePassword"

    );

const loginButton =

    document.getElementById(

        "loginButton"

    );

const loginButtonText =

    document.getElementById(

        "loginButtonText"

    );

const loginSpinner =

    document.getElementById(

        "loginSpinner"

    );

const errorBox =

    document.getElementById(

        "loginError"

    );

// ==========================================================
// Loading State
// ==========================================================

function setLoading(

    loading

) {

    if (

        loginButton

    ) {

        loginButton.disabled =

            loading;

    }

    if (

        loginButtonText

    ) {

        loginButtonText.classList.toggle(

            "d-none",

            loading

        );

    }

    if (

        loginSpinner

    ) {

        loginSpinner.classList.toggle(

            "d-none",

            !loading

        );

    }

}

// ==========================================================
// Error Handling
// ==========================================================

function showError(

    message

) {

    if (

        !errorBox

    ) {

        alert(message);

        return;

    }

    errorBox.textContent =

        message;

    errorBox.classList.remove(

        "d-none"

    );

}

function clearError() {

    if (

        !errorBox

    ) return;

    errorBox.textContent = "";

    errorBox.classList.add(

        "d-none"

    );

}

// ==========================================================
// Email Validation
// ==========================================================

function validEmail(

    value

) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        .test(

            value.trim()

        );

}

// ==========================================================
// Password Visibility Toggle
// ==========================================================

if (togglePassword) {

    togglePassword.addEventListener(

        "click",

        () => {

            const isPassword =

                password.type ===

                "password";

            password.type =

                isPassword

                ? "text"

                : "password";

            togglePassword.innerHTML =

                isPassword

                ? '<i class="fas fa-eye-slash"></i>'

                : '<i class="fas fa-eye"></i>';

        }

    );

}

// ==========================================================
// Form Validation
// ==========================================================

function validateForm() {

    clearError();

    if (

        !email.value.trim()

    ) {

        showError(

            "Email address is required."

        );

        email.focus();

        return false;

    }

    if (

        !validEmail(

            email.value

        )

    ) {

        showError(

            "Enter a valid email address."

        );

        email.focus();

        return false;

    }

    if (

        !password.value

    ) {

        showError(

            "Password is required."

        );

        password.focus();

        return false;

    }

    if (

        password.value.length < 8

    ) {

        showError(

            "Password must contain at least 8 characters."

        );

        password.focus();

        return false;

    }

    return true;

}

// ==========================================================
// Firebase Authentication Persistence
// ==========================================================

async function configurePersistence() {

    if (

        rememberMe?.checked

    ) {

        await setPersistence(

            auth,

            browserLocalPersistence

        );

    }

    else {

        await setPersistence(

            auth,

            browserSessionPersistence

        );

    }

}

// ==========================================================
// Live Validation
// ==========================================================

[

    email,

    password

].forEach(

    (field) => {

        if (!field) return;

        field.addEventListener(

            "input",

            clearError

        );

    }

);

// ==========================================================
// Auto Focus
// ==========================================================

function initializeForm() {

    clearError();

    email?.focus();

}

// ==========================================================
// Startup
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    initializeForm

);

// ==========================================================
// Login Supplier
// ==========================================================

async function loginSupplier() {

    if (!validateForm()) {

        return;

    }

    clearError();

    setLoading(true);

    try {

        await configurePersistence();

        const credential =

            await signInWithEmailAndPassword(

                auth,

                email.value.trim(),

                password.value

            );

        const user = credential.user;

        // --------------------------------------------------
        // Email Verification
        // --------------------------------------------------

        if (!user.emailVerified) {

            await sendEmailVerification(user);

            await signOut(auth);

            showError(

                "Please verify your email before logging in. A new verification email has been sent."

            );

            return;

        }

        // --------------------------------------------------
        // Users Collection
        // --------------------------------------------------

        const userRef =

            doc(

                db,

                "users",

                user.uid

            );

        const userSnap =

            await getDoc(

                userRef

            );

        if (!userSnap.exists()) {

            await signOut(auth);

            showError(

                "User account not found."

            );

            return;

        }

        const userData =

            userSnap.data();

        if (

            userData.role !==

            "supplier"

        ) {

            await signOut(auth);

            showError(

                "This account is not registered as a supplier."

            );

            return;

        }

        // --------------------------------------------------
        // Supplier Collection
        // --------------------------------------------------

        const supplierRef =

            doc(

                db,

                "supplierPublic",

                user.uid

            );

        const supplierSnap =

            await getDoc(

                supplierRef

            );

        if (!supplierSnap.exists()) {

            await signOut(auth);

            showError(

                "Supplier profile not found."

            );

            return;

        }

        const supplier =

            supplierSnap.data();

        // --------------------------------------------------
        // Update Last Login
        // --------------------------------------------------

        await updateDoc(

            userRef,

            {

                lastLogin:

                    new Date()

            }

        );

        // --------------------------------------------------
        // Account Status
        // --------------------------------------------------

        switch (

            userData.status

        ) {

            case "approved":

                const redirect =

    getRedirectUrl();

clearRedirectUrl();

window.location.href =

    redirect;
                return;

            case "pending":

                window.location.href =

                    "/supplier/pending/";

                return;

            case "rejected":

                await signOut(auth);

                showError(

                    "Your supplier application was rejected. Please contact support."

                );

                return;

            case "suspended":

                await signOut(auth);

                showError(

                    "Your supplier account has been suspended."

                );

                return;

            default:

                await signOut(auth);

                showError(

                    "Unknown supplier account status."

                );

                return;

        }

    }

    catch (error) {

        console.error(

            error

        );

        switch (

            error.code

        ) {

            case "auth/invalid-credential":

            case "auth/wrong-password":

            case "auth/user-not-found":

                showError(

                    "Invalid email or password."

                );

                break;

            case "auth/too-many-requests":

                showError(

                    "Too many failed login attempts. Please try again later."

                );

                break;

            case "auth/network-request-failed":

                showError(

                    "Network error. Check your internet connection."

                );

                break;

            default:

                showError(

                    error.message

                );

        }

    }

    finally {

        setLoading(false);

    }

}

// ==========================================================
// Form Submission
// ==========================================================

if (

    supplierLoginForm

) {

    supplierLoginForm.addEventListener(

        "submit",

        async (event) => {

            event.preventDefault();

            await loginSupplier(user);

        }

    );

}

// ==========================================================
// Auto Redirect If Already Logged In
// ==========================================================

onAuthStateChanged(
    auth,
);
    async (user) => {

        if (!user) {

            return;

        }

        try {

            const userRef =

                doc(

                    db,

                    "users",

                    user.uid

                );

            const userSnap =

                await getDoc(

                    userRef

                );

            if (

                !userSnap.exists()

            ) {

                return;

            }

            const userData =

                userSnap.data();

            if (

                userData.role !==

                "supplier"

            ) {

                return;

            }

            switch (

                userData.status

            ) {

                case "approved":

                    window.location.replace(

                        "/supplier/dashboard/"

                    );

                    break;

                case "pending":

                    window.location.replace(

                        "/supplier/pending/"

                    );

                    break;

                default:

                    break;

            }

        }

        catch (error) {

            console.error(

                "Auto login failed:",

                error

            );

        }

    }

);

// ==========================================================
// Keyboard Accessibility
// ==========================================================

password?.addEventListener(

    "keydown",

    (event) => {

        if (

            event.key === "Enter"

        ) {

            supplierLoginForm?.requestSubmit();

        }

    }

);

// ==========================================================
// Reset Form
// ==========================================================

function resetForm() {

    supplierLoginForm?.reset();

    clearError();

    password.type = "password";

    if (

        togglePassword

    ) {

        togglePassword.innerHTML =

            '<i class="fas fa-eye"></i>';

    }

}

// ==========================================================
// Startup
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeForm();

        resetForm();

    }

);

// ==========================================================
// Export
// ==========================================================

export {

    loginSupplier

};

// ==========================================================
// Redirect Helpers
// ==========================================================

function getRedirectUrl() {

    return (

        sessionStorage.getItem(

            "redirectAfterLogin"

        ) ||

        "/supplier/dashboard/"

    );

}

function clearRedirectUrl() {

    sessionStorage.removeItem(

        "redirectAfterLogin"

    );

}

// ==========================================================
// Login Audit Log
// ==========================================================

async function logLogin(user) {

    try {

        await setDoc(

            doc(

                db,

                "supplierLogins",

                user.uid

            ),

            {

                uid: user.uid,

                email: user.email,

                lastLogin: new Date(),

                platform: navigator.platform,

                userAgent: navigator.userAgent

            },

            {

                merge: true

            }

        );

    }

    catch (error) {

        console.error(

            "Login log failed:",

            error

        );

    }

}



