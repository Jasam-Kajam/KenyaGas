// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/auth.js
// Version: 1.0.0
//
// Shared Authentication Utilities
// ==========================================================

import {

    auth,

    db

} from "./firebase.js";

import {

    onAuthStateChanged,

    signOut,

    reload

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {

    doc,

    getDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// Current User Cache
// ==========================================================

let currentUser = null;

let currentProfile = null;

// ==========================================================
// Authentication Listener
// ==========================================================

onAuthStateChanged(

    auth,

    async (user) => {

        currentUser = user;

        currentProfile = null;

        if (user) {

            currentProfile = await loadUserProfile(user.uid);

        }

        document.dispatchEvent(

            new CustomEvent(

                "kg-auth-ready",

                {

                    detail: {

                        user: currentUser,

                        profile: currentProfile

                    }

                }

            )

        );

    }

);

// ==========================================================
// Get Current User
// ==========================================================

export function getCurrentUser() {

    return currentUser;

}

// ==========================================================
// Get Current Profile
// ==========================================================

export function getCurrentProfile() {

    return currentProfile;

}

// ==========================================================
// Is User Logged In
// ==========================================================

export function isAuthenticated() {

    return currentUser !== null;

}

// ==========================================================
// Reload Logged In User
// ==========================================================

export async function refreshCurrentUser() {

    if (!auth.currentUser) {

        return null;

    }

    await reload(auth.currentUser);

    currentUser = auth.currentUser;

    return currentUser;

}

// ==========================================================
// Email Verification
// ==========================================================

export function isEmailVerified() {

    if (!currentUser) {

        return false;

    }

    return currentUser.emailVerified;

}

// ==========================================================
// Logout
// ==========================================================

export async function logout() {

    await signOut(auth);

}

// ==========================================================
// Load Customer Profile
// ==========================================================

async function loadUserProfile(uid) {

    try {

        const ref = doc(

            db,

            "users",

            uid

        );

        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {

            return null;

        }

        return snapshot.data();

    }

    catch (error) {

        console.error(

            "Unable to load user profile:",

            error

        );

        return null;

    }

}

// ==========================================================
// User Role Detection
// ==========================================================

export async function getUserRole(uid = null) {

    try {

        const userId = uid || currentUser?.uid;

        if (!userId) {

            return null;

        }

        // --------------------------------------------------
        // Customer
        // --------------------------------------------------

        let reference = doc(

            db,

            "users",

            userId

        );

        let snapshot = await getDoc(reference);

        if (snapshot.exists()) {

            return {

                role: "customer",

                profile: snapshot.data()

            };

        }

        // --------------------------------------------------
        // Supplier
        // --------------------------------------------------

        reference = doc(

            db,

            "suppliers",

            userId

        );

        snapshot = await getDoc(reference);

        if (snapshot.exists()) {

            return {

                role: "supplier",

                profile: snapshot.data()

            };

        }

        // --------------------------------------------------
        // Admin
        // --------------------------------------------------

        reference = doc(

            db,

            "admins",

            userId

        );

        snapshot = await getDoc(reference);

        if (snapshot.exists()) {

            return {

                role: "admin",

                profile: snapshot.data()

            };

        }

        return null;

    }

    catch (error) {

        console.error(

            "Role detection failed:",

            error

        );

        return null;

    }

}

// ==========================================================
// Require Login
// ==========================================================

export function requireLogin() {

    if (!currentUser) {

        window.location.href = "/login/";

        return false;

    }

    return true;

}

// ==========================================================
// Require Guest
// ==========================================================

export function requireGuest() {

    if (currentUser) {

        window.location.href = "/";

        return false;

    }

    return true;

}

// ==========================================================
// Require Customer
// ==========================================================

export async function requireCustomer() {

    if (!requireLogin()) {

        return false;

    }

    const user = await getUserRole();

    if (!user || user.role !== "customer") {

        window.location.href = "/";

        return false;

    }

    return true;

}

// ==========================================================
// Require Supplier
// ==========================================================

export async function requireSupplier() {

    if (!requireLogin()) {

        return false;

    }

    const user = await getUserRole();

    if (!user) {

        window.location.href = "/";

        return false;

    }

    if (user.role !== "supplier") {

        window.location.href = "/";

        return false;

    }

    if (user.profile.verified !== true) {

        window.location.href = "/supplier/pending/";

        return false;

    }

    return true;

}

// ==========================================================
// Require Admin
// ==========================================================

export async function requireAdmin() {

    if (!requireLogin()) {

        return false;

    }

    const user = await getUserRole();

    if (!user || user.role !== "admin") {

        window.location.href = "/";

        return false;

    }

    return true;

}

// ==========================================================
// Redirect After Login
// ==========================================================

export async function redirectAfterLogin() {

    const user = await getUserRole();

    if (!user) {

        window.location.href = "/";

        return;

    }

    switch (user.role) {

        case "admin":

            window.location.href = "/admin/";

            break;

        case "supplier":

            window.location.href = "/supplier/dashboard/";

            break;

        case "customer":

            window.location.href = "/account/";

            break;

        default:

            window.location.href = "/";

    }

}

// ==========================================================
// Helper Methods
// ==========================================================

export function getUserId() {

    return currentUser?.uid || null;

}

export function getUserEmail() {

    return currentUser?.email || null;

}

export function isSupplierVerified() {

    return currentProfile?.verified === true;

}

export function isAdmin() {

    return currentProfile?.role === "admin";

}
