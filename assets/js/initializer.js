// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/initializer.js
// Version: 1.0.0
//
// Application Initializer
// ==========================================================

import {

    db,

    auth,

    now

} from "./firebase.js";

import {

    doc,

    getDoc,

    setDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================================
// Loader
// ==========================================================

const loader = document.getElementById("appLoader");

function hideLoader() {

    if (!loader) return;

    loader.classList.add("hide");

    setTimeout(() => {

        loader.remove();

    }, 500);

}


// ==========================================================
// Create Default Settings
// ==========================================================

async function initializeSettings() {

    try {

        const settingsRef = doc(

            db,

            "system",

            "settings"

        );

        const snapshot = await getDoc(settingsRef);

        if (!snapshot.exists()) {

            await setDoc(

                settingsRef,

                {

                    siteName:

                        "Kenya Gas Marketplace",

                    version:

                        "1.0.0",

                    maintenanceMode:

                        false,

                    registrationOpen:

                        true,

                    supplierRegistrationOpen:

                        true,

                    currency:

                        "KES",

                    country:

                        "Kenya",

                    supportEmail:

                        "support@kenyagas.com",

                    createdAt:

                        now()

                }

            );

            console.log(

                "Default system settings created."

            );

        }

    }

    catch (error) {

        console.error(

            "Settings initialization failed:",

            error

        );

    }

}


// ==========================================================
// Global UI Initialization
// ==========================================================

function initializeUI() {

    document.documentElement.classList.add(

        "app-ready"

    );

    // Current Year

    const year = document.getElementById(

        "currentYear"

    );

    if (year) {

        year.textContent =

            new Date().getFullYear();

    }

}


// ==========================================================
// Marketplace Startup
// ==========================================================

async function startApplication() {

    try {

        console.log(

            "Starting Kenya Gas Marketplace..."

        );

        await initializeSettings();

        initializeUI();

        console.log(

            "Marketplace initialized successfully."

        );

    }

    catch (error) {

        console.error(

            "Application startup failed:",

            error

        );

    }

    finally {

        hideLoader();

    }

}


// ==========================================================
// Start When DOM Is Ready
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        startApplication();

    }

);


// ==========================================================
// Safety Timeout
// Prevent loader from remaining forever
// ==========================================================

setTimeout(() => {

    hideLoader();

}, 5000);


// ==========================================================
// Export
// ==========================================================

export {

    startApplication

};
