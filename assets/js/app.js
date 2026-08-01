// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/app.js
// Version: 1.0.0
//
// Global Application Controller
// ==========================================================

import {

    auth

} from "./firebase.js";

import {

    signOut

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// ==========================================================
// Cached Elements
// ==========================================================

const searchForm = document.getElementById("marketplaceSearchForm");

const searchInput = document.getElementById("heroSearchInput");

const cartCount = document.getElementById("cartCount");

const logoutButtons = document.querySelectorAll("[data-logout]");

// ==========================================================
// Search
// ==========================================================

function initializeSearch() {

    if (!searchForm) return;

    searchForm.addEventListener("submit", (event) => {

        event.preventDefault();

        const keyword = searchInput.value.trim();

        if (!keyword) return;

        window.location.href =
            `/products/?search=${encodeURIComponent(keyword)}`;

    });

}

// ==========================================================
// Cart Badge
// ==========================================================

function updateCartBadge() {

    const count = Number(

        localStorage.getItem("cartCount") || 0

    );

    if (cartCount) {

        cartCount.textContent = count;

    }

}

// ==========================================================
// Logout
// ==========================================================

function initializeLogout() {

    logoutButtons.forEach((button) => {

        button.addEventListener("click", async () => {

            try {

                await signOut(auth);

                window.location.href = "/login/";

            }

            catch (error) {

                console.error(error);

                showToast(

                    "Unable to sign out.",

                    "danger"

                );

            }

        });

    });

}

// ==========================================================
// Toast Notification
// ==========================================================

export function showToast(

    message,

    type = "success"

) {

    const toast = document.createElement("div");

    toast.className = `kg-toast ${type}`;

    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {

        toast.classList.add("show");

    });

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => toast.remove(), 300);

    }, 3000);

}

// ==========================================================
// Authentication Events
// ==========================================================

document.addEventListener(

    "auth-state-changed",

    (event) => {

        const user = event.detail.user;

        document.body.classList.toggle(

            "authenticated",

            !!user

        );

    }

);

// ==========================================================
// Back To Top Button
// ==========================================================

function initializeBackToTop() {

    const button = document.getElementById("backToTop");

    if (!button) return;

    window.addEventListener("scroll", () => {

        button.classList.toggle(

            "show",

            window.scrollY > 400

        );

    });

    button.addEventListener("click", () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

}

// ==========================================================
// Startup
// ==========================================================

function initializeApplication() {

    initializeSearch();

    initializeLogout();

    initializeBackToTop();

    updateCartBadge();

    console.log(

        "Kenya Gas Marketplace Ready"

    );

}

document.addEventListener(

    "DOMContentLoaded",

    initializeApplication

);
