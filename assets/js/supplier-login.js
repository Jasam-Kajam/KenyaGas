// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/supplier-login.js
// Version: 1.0.0 - Supplier Login Controller (FIXED)
// ==========================================================

import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ==========================================================
// DOM Elements
// ==========================================================

const supplierLoginForm = document.getElementById("supplierLoginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const togglePassword = document.getElementById("togglePassword");
const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginSpinner = document.getElementById("loginSpinner");
const errorBox = document.getElementById("loginError");

// ==========================================================
// Loading State
// ==========================================================

function setLoading(loading) {
    if (loginButton) {
        loginButton.disabled = loading;
    }
    if (loginButtonText) {
        loginButtonText.classList.toggle("d-none", loading);
    }
    if (loginSpinner) {
        loginSpinner.classList.toggle("d-none", !loading);
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
    errorBox.textContent = "";
    errorBox.classList.add("d-none");
}

// ==========================================================
// Validation Helpers
// ==========================================================

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateForm() {
    clearError();

    if (!email || !email.value.trim()) {
        showError("Email address is required.");
        email?.focus();
        return false;
    }

    if (!validEmail(email.value)) {
        showError("Enter a valid email address.");
        email.focus();
        return false;
    }

    if (!password || !password.value) {
        showError("Password is required.");
        password?.focus();
        return false;
    }

    if (password.value.length < 8) {
        showError("Password must contain at least 8 characters.");
        password.focus();
        return false;
    }

    return true;
}

// ==========================================================
// Password Visibility Toggle
// ==========================================================

if (togglePassword && password) {
    togglePassword.addEventListener("click", () => {
        const isPassword = password.type === "password";
        password.type = isPassword ? "text" : "password";
        togglePassword.innerHTML = isPassword
            ? '<i class="fas fa-eye-slash"></i>'
            : '<i class="fas fa-eye"></i>';
    });
}

// ==========================================================
// Firebase Auth Persistence
// ==========================================================

async function configurePersistence() {
    if (rememberMe?.checked) {
        await setPersistence(auth, browserLocalPersistence);
    } else {
        await setPersistence(auth, browserSessionPersistence);
    }
}

// ==========================================================
// Redirect Helpers
// ==========================================================

function getRedirectUrl() {
    return (
        sessionStorage.getItem("redirectAfterLogin") ||
        "/supplier/dashboard/"
    );
}

function clearRedirectUrl() {
    sessionStorage.removeItem("redirectAfterLogin");
}

// ==========================================================
// Audit Logging
// ==========================================================

async function logLogin(uid, emailAddress) {
    try {
        await setDoc(
            doc(db, "supplierLogins", uid),
            {
                uid: uid,
                email: emailAddress,
                lastLogin: serverTimestamp(),
                userAgent: navigator.userAgent
            },
            { merge: true }
        );
    } catch (err) {
        console.error("Audit log failed:", err);
    }
}

// ==========================================================
// Login Supplier Handler
// ==========================================================

async function loginSupplier() {
    if (!validateForm()) return;

    clearError();
    setLoading(true);

    try {
        await configurePersistence();

        // 1. Authenticate with Firebase
        const credential = await signInWithEmailAndPassword(
            auth,
            email.value.trim(),
            password.value
        );
        const user = credential.user;

        // 2. Email Verification Check
        if (!user.emailVerified) {
            await sendEmailVerification(user);
            await signOut(auth);
            showError("Please verify your email before logging in. A new verification link has been sent.");
            return;
        }

        // 3. Fetch Supplier Record from Firestore ('suppliers' collection)
        const supplierRef = doc(db, "suppliers", user.uid);
        const supplierSnap = await getDoc(supplierRef);

        if (!supplierSnap.exists()) {
            await signOut(auth);
            showError("Supplier account record not found.");
            return;
        }

        const supplierData = supplierSnap.data();

        // 4. Update Last Login Timestamp
        await updateDoc(supplierRef, {
            lastLogin: serverTimestamp()
        });

        // 5. Audit Log
        await logLogin(user.uid, user.email);

        // 6. Check Account Approval Status
        const status = (supplierData.approvalStatus || supplierData.verificationStatus || "Pending").toLowerCase();

        if (status === "approved") {
            const redirect = getRedirectUrl();
            clearRedirectUrl();
            window.location.href = redirect;
        } else if (status === "pending" || status === "pending review") {
            window.location.href = "/supplier/pending/";
        } else if (status === "rejected") {
            await signOut(auth);
            showError("Your supplier application was rejected. Please contact support.");
        } else if (status === "suspended") {
            await signOut(auth);
            showError("Your supplier account has been suspended.");
        } else {
            await signOut(auth);
            showError("Unknown account status. Please contact support.");
        }

    } catch (error) {
        console.error("Login Error:", error);

        switch (error.code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                showError("Invalid email or password.");
                break;
            case "auth/too-many-requests":
                showError("Too many failed login attempts. Please try again later.");
                break;
            case "auth/network-request-failed":
                showError("Network error. Please check your internet connection.");
                break;
            default:
                showError(error.message);
        }
    } finally {
        setLoading(false);
    }
}

// ==========================================================
// Form Submission Listener
// ==========================================================

if (supplierLoginForm) {
    supplierLoginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await loginSupplier();
    });
}

// Live clear error on input
[email, password].forEach((field) => {
    field?.addEventListener("input", clearError);
});

// ==========================================================
// Auto Redirect If Already Authenticated
// ==========================================================

onAuthStateChanged(auth, async (user) => {
    if (!user || !user.emailVerified) return;

    try {
        const supplierRef = doc(db, "suppliers", user.uid);
        const supplierSnap = await getDoc(supplierRef);

        if (!supplierSnap.exists()) return;

        const supplierData = supplierSnap.data();
        const status = (supplierData.approvalStatus || supplierData.verificationStatus || "").toLowerCase();

        if (status === "approved") {
            window.location.replace("/supplier/dashboard/");
        } else if (status === "pending" || status === "pending review") {
            window.location.replace("/supplier/pending/");
        }
    } catch (err) {
        console.error("Auto login check failed:", err);
    }
});
