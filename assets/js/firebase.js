// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/firebase.js
// Version: 1.0.0
// Firebase Configuration
// ==========================================================

// ==========================================================
// Firebase SDK Imports
// ==========================================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    FacebookAuthProvider,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    enableIndexedDbPersistence,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getStorage
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

import {
    getAnalytics,
    isSupported
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";

// ==========================================================
// Firebase Configuration
// ==========================================================

const firebaseConfig = {

    apiKey: "AIzaSyCRm2KV_UTnd9YC2n7qS3ue4d9EfFhCv08",

    authDomain: "kenyagas-46f74.firebaseapp.com",

    projectId: "kenyagas-46f74",

    storageBucket: "kenyagas-46f74.firebasestorage.app",

    messagingSenderId: "788150431037",

    appId: "1:788150431037:web:a3364a333bc7e09995e954",

    measurementId: "G-ELBF8JH72C"

};

// ==========================================================
// Initialize Firebase
// ==========================================================

const app = initializeApp(firebaseConfig);

// ==========================================================
// Services
// ==========================================================

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);

// ==========================================================
// Authentication Providers
// ==========================================================

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({

    prompt: "select_account"

});

const facebookProvider = new FacebookAuthProvider();

// ==========================================================
// Offline Persistence
// ==========================================================

enableIndexedDbPersistence(db)

.catch((error) => {

    console.warn(
        "Firestore persistence unavailable:",
        error.code
    );

});

// ==========================================================
// Analytics
// ==========================================================

let analytics = null;

isSupported()

.then((supported) => {

    if (supported) {

        analytics = getAnalytics(app);

    }

});

// ==========================================================
// Authentication Observer
// ==========================================================

onAuthStateChanged(auth, (user) => {

    window.currentUser = user || null;

    document.dispatchEvent(

        new CustomEvent("auth-state-changed", {

            detail: {

                user

            }

        })

    );

});

// ==========================================================
// Global Helper
// ==========================================================

function now() {

    return serverTimestamp();

}

// ==========================================================
// Exports
// ==========================================================

export {

    app,

    auth,

    db,

    storage,

    analytics,

    googleProvider,

    facebookProvider,

    now

};
