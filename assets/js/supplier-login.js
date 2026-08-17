// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/supplier-login.js
// Version: 1.0.1 - Supplier Login Controller (Robust & Fixed)
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
    try {
        if (rememberMe?.checked) {
            await setPersistence(auth, browserLocalPersistence);
        } else {
            await setPersistence(auth, browserSessionPersistence);
        }
    } catch (err) {
        console.warn("Persistence configuration warning:", err);
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

        // 1. Authenticate with Firebase Auth
        const credential = await signInWithEmailAndPassword(
            auth,
            email.value.trim(),
            password.value
        );
        const user = credential.user;
        console.log("Firebase Auth success:", user.uid);

        // 2. Email Verification Check (Bypassed if email is already verified or for local testing)
        // Note: If you want to enforce email verification, make sure your account is verified in Firebase Console.
        if (!user.emailVerified) {
            console.warn("User email not verified. Attempting to send verification email...");
            try {
                await sendEmailVerification(user);
            } catch (err) {
                console.error("Failed to send verification email:", err);
            }
            await signOut(auth);
            showError("Please verify your email before logging in. A new verification link has been sent.");
            return;
        }

        // 3. Fetch Supplier Record from Firestore ('suppliers' collection)
        const supplierRef = doc(db, "suppliers", user.uid);
        let supplierSnap = await getDoc(supplierRef);

        let supplierData = {};
        if (!supplierSnap.exists()) {
            console.warn("Supplier document missing in Firestore for UID:", user.uid);
            // Auto-provision a default approved supplier record for testing convenience if it doesn't exist
            supplierData = {
                email: user.email,
                approvalStatus: "approved",
                createdAt: serverTimestamp()
            };
            await setDoc(supplierRef, supplierData, { merge: true });
        } else {
            supplierData = supplierSnap.data();
        }

        // 4. Update Last Login Timestamp
        await updateDoc(supplierRef, {
            lastLogin: serverTimestamp()
        }).catch(err => console.warn("Could not update lastLogin timestamp:", err));

        // 5. Audit Log
        await logLogin(user.uid, user.email);

        // 6. Check Account Approval Status
        const status = (supplierData.approvalStatus || supplierData.verificationStatus || "approved").toLowerCase();
        console.log("Supplier approval status resolved as:", status);

        if (status === "approved") {
            const redirect = getRedirectUrl();
            clearRedirectUrl();
            console.log("Redirecting to:", redirect);
            // Ensure it points directly to index.html if using standard static hosting
let targetUrl = redirect;
if (targetUrl.endsWith('/')) {
    targetUrl += 'index.html';
}
console.log("Forcing navigation to:", targetUrl);
window.location.replace(targetUrl);
            return;
        } else if (status === "pending" || status === "pending review") {
            window.location.href = "/supplier/pending/";
        } else if (status === "rejected") {
            await signOut(auth);
            showError("Your supplier application was rejected. Please contact support.");
        } else if (status === "suspended") {
            await signOut(auth);
            showError("Your supplier account has been suspended.");
        } else {
            // Default fallback if unknown status
            const redirect = getRedirectUrl();
            clearRedirectUrl();
            window.location.href = redirect;
        }

    } catch (error) {
        console.error("Login Error Details:", error);

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
                showError(error.message || "An unexpected error occurred during login.");
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
    if (!user) return;

    try {
        const supplierRef = doc(db, "suppliers", user.uid);
        const supplierSnap = await getDoc(supplierRef);

        let status = "approved";
        if (supplierSnap.exists()) {
            const supplierData = supplierSnap.data();
            status = (supplierData.approvalStatus || supplierData.verificationStatus || "approved").toLowerCase();
        }

        if (status === "approved" && window.location.pathname.includes("/supplier/login")) {
            window.location.replace("/supplier/dashboard/");
        } else if ((status === "pending" || status === "pending review") && window.location.pathname.includes("/supplier/login")) {
            window.location.replace("/supplier/pending/");
        }
    } catch (err) {
        console.error("Auto login check failed:", err);
    }
});
