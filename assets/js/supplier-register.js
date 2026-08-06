/* ==========================================================
   Kenya Gas Marketplace
   Supplier Registration Logic
   File: /assets/js/supplier-register.js
========================================================== */

/* ==========================
   FIREBASE IMPORTS
========================== */
import { auth, db, storage } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

/* ==========================
   COUNTIES & TOWNS IMPORT
========================== */
import townsByCounty, { kenyaCounties } from "./counties.js";

/* ==========================
   DOM ELEMENTS
========================== */
const form = document.getElementById("supplierRegisterForm");
const registerError = document.getElementById("registerError");
const pageLoader = document.getElementById("pageLoader");

// Business Details
const businessName = document.getElementById("businessName");
const ownerName = document.getElementById("ownerName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");

// Location Details
const county = document.getElementById("county");
const town = document.getElementById("town");
const address = document.getElementById("address");

// Verification & Files
const licenceNumber = document.getElementById("licenceNumber");
const kraPin = document.getElementById("kraPin");
const businessLogo = document.getElementById("businessLogo");
const logoPreview = document.getElementById("logoPreview");

// Account Security
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const passwordStrengthBar = document.getElementById("passwordStrengthBar");
const passwordStrengthText = document.getElementById("passwordStrengthText");
const agreeTerms = document.getElementById("agreeTerms");

// Action Buttons
const registerButton = document.getElementById("registerButton");
const registerSpinner = document.getElementById("registerSpinner");

/* ==========================
   GLOBAL CONFIG
========================== */
let isSubmitting = false;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB maximum limit from HTML

/* ==========================
   ALERT UTILITIES
========================== */
function showAlert(message, type = "danger") {
    if (!registerError) return;
    registerError.className = `alert alert-${type}`;
    registerError.textContent = message;
    registerError.classList.remove("d-none");
    registerError.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearAlert() {
    if (!registerError) return;
    registerError.classList.add("d-none");
    registerError.textContent = "";
}

/* ==========================
   LOADING UTILITIES
========================== */
function showLoading() {
    if (registerButton) registerButton.disabled = true;
    if (registerSpinner) registerSpinner.classList.remove("d-none");
}

function hideLoading() {
    if (registerButton) registerButton.disabled = false;
    if (registerSpinner) registerSpinner.classList.add("d-none");
}

/* ==========================
   PAGE LOADER
========================== */
window.addEventListener("load", () => {
    if (!pageLoader) return;
    pageLoader.classList.add("hidden");
    setTimeout(() => {
        pageLoader.remove();
    }, 400);
});

/* ==========================
   COUNTY & TOWN SELECTORS
========================== */
function loadCounties() {
    if (!county) return;
    county.innerHTML = `<option value="">Select County</option>`;
    
    if (Array.isArray(kenyaCounties)) {
        kenyaCounties.forEach(countyName => {
            const opt = document.createElement("option");
            opt.value = countyName;
            opt.textContent = countyName;
            county.appendChild(opt);
        });
    }
}

function loadTowns(selectedCounty) {
    if (!town) return;
    town.innerHTML = "";

    if (!selectedCounty || !townsByCounty || !townsByCounty[selectedCounty]) {
        town.disabled = true;
        town.innerHTML = `<option value="">Select County First</option>`;
        return;
    }

    town.disabled = false;
    town.innerHTML = `<option value="">Select Town</option>`;
    townsByCounty[selectedCounty].forEach(location => {
        const opt = document.createElement("option");
        opt.value = location;
        opt.textContent = location;
        town.appendChild(opt);
    });
}

if (county) {
    county.addEventListener("change", () => {
        loadTowns(county.value);
    });
}

/* ==========================
   PHONE FORMATTER
========================== */
if (phone) {
    phone.addEventListener("blur", () => {
        let value = phone.value.trim();
        if (value.startsWith("07") || value.startsWith("01")) {
            value = "+254" + value.substring(1);
        } else if (value.startsWith("254")) {
            value = "+" + value;
        }
        phone.value = value;
    });
}

/* ==========================
   PASSWORD STRENGTH METER
========================== */
function calculatePasswordStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
}

function updatePasswordStrength() {
    if (!passwordStrengthBar || !passwordStrengthText) return;

    const pwd = password.value;
    const score = calculatePasswordStrength(pwd);

    if (pwd.length === 0) {
        passwordStrengthBar.style.width = "0%";
        passwordStrengthText.textContent = "Weak";
        return;
    }

    switch (score) {
        case 1:
        case 2:
            passwordStrengthBar.style.width = "33%";
            passwordStrengthBar.style.backgroundColor = "#dc3545";
            passwordStrengthText.textContent = "Weak";
            break;
        case 3:
        case 4:
            passwordStrengthBar.style.width = "66%";
            passwordStrengthBar.style.backgroundColor = "#ffc107";
            passwordStrengthText.textContent = "Medium";
            break;
        case 5:
            passwordStrengthBar.style.width = "100%";
            passwordStrengthBar.style.backgroundColor = "#198754";
            passwordStrengthText.textContent = "Strong";
            break;
    }
}

if (password) {
    password.addEventListener("input", updatePasswordStrength);
}

/* ==========================
   BUSINESS LOGO PREVIEW
========================== */
if (businessLogo) {
    businessLogo.addEventListener("change", () => {
        const file = businessLogo.files[0];
        
        if (!file) {
            if (logoPreview) logoPreview.classList.add("d-none");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            showAlert("Business logo must not exceed 2 MB.");
            businessLogo.value = "";
            if (logoPreview) logoPreview.classList.add("d-none");
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            if (logoPreview) {
                logoPreview.src = e.target.result;
                logoPreview.classList.remove("d-none");
            }
        };
        reader.readAsDataURL(file);
    });
}

/* ==========================
   VALIDATIONS
========================== */
function isValidEmail(emailStr) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
}

function isValidPhone(phoneStr) {
    return /^(\+254|254|0)[71]\d{8}$/.test(phoneStr);
}

function validateForm() {
    clearAlert();

    if (!businessName || !businessName.value.trim()) {
        showAlert("Please enter your business name.");
        if (businessName) businessName.focus();
        return false;
    }

    if (!ownerName || !ownerName.value.trim()) {
        showAlert("Please enter the owner name.");
        if (ownerName) ownerName.focus();
        return false;
    }

    if (!email || !isValidEmail(email.value.trim())) {
        showAlert("Please enter a valid email address.");
        if (email) email.focus();
        return false;
    }

    if (!phone || !isValidPhone(phone.value.trim())) {
        showAlert("Please enter a valid Kenyan mobile number.");
        if (phone) phone.focus();
        return false;
    }

    if (!county || !county.value) {
        showAlert("Please select a county.");
        if (county) county.focus();
        return false;
    }

    if (!town || !town.value) {
        showAlert("Please select a town.");
        if (town) town.focus();
        return false;
    }

    if (!address || !address.value.trim()) {
        showAlert("Please enter your business address.");
        if (address) address.focus();
        return false;
    }

    if (!businessLogo || !businessLogo.files || businessLogo.files.length === 0) {
        showAlert("Please upload a business logo.");
        if (businessLogo) businessLogo.focus();
        return false;
    }

    if (!password || password.value.length < 8) {
        showAlert("Password must be at least 8 characters long.");
        if (password) password.focus();
        return false;
    }

    if (!confirmPassword || password.value !== confirmPassword.value) {
        showAlert("Passwords do not match.");
        if (confirmPassword) confirmPassword.focus();
        return false;
    }

    if (!agreeTerms || !agreeTerms.checked) {
        showAlert("You must agree to the Terms & Conditions and Privacy Policy.");
        return false;
    }

    return true;
}

/* ==========================
   FIREBASE STORAGE UPLOAD
========================== */
async function uploadLogoFile(uid) {
    const file = businessLogo.files[0];
    if (!file) return "";

    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const storageRef = ref(storage, `suppliers/${uid}/logo/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
}

/* ==========================
   REGISTER SUPPLIER SUBMIT
========================== */
if (form) {
    form.addEventListener("submit", registerSupplier);
}

async function registerSupplier(e) {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) return;

    isSubmitting = true;
    showLoading();

    try {
        // 1. Create Authentication Account
        const credential = await createUserWithEmailAndPassword(
            auth,
            email.value.trim(),
            password.value
        );
        const user = credential.user;

        // 2. Set Firebase Auth Display Name
        await updateProfile(user, {
            displayName: ownerName.value.trim()
        });

        // 3. Send Verification Email
        await sendEmailVerification(user);

        // 4. Upload Business Logo to Firebase Storage
        let logoURL = "";
        try {
            logoURL = await uploadLogoFile(user.uid);
        } catch (uploadError) {
            console.error("Logo upload warning:", uploadError);
        }

        // 5. Structure Document for Firestore ('suppliers' collection)
        const supplierData = {
            uid: user.uid,
            businessName: businessName.value.trim(),
            ownerName: ownerName.value.trim(),
            email: email.value.trim().toLowerCase(),
            phone: phone.value.trim(),
            county: county.value,
            town: town.value,
            address: address.value.trim(),
            licenceNumber: licenceNumber ? licenceNumber.value.trim() : "",
            kraPin: kraPin ? kraPin.value.trim() : "",
            logoURL: logoURL,
            emailVerified: user.emailVerified,
            verified: false,
            verificationStatus: "Pending",
            approvalStatus: "Pending Review",
            sellerStatus: "Inactive",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // 6. Save Data to Firestore
        await setDoc(doc(db, "suppliers", user.uid), supplierData);

        // 7. Show Success Message & Redirect
        showAlert(
            "✅ Account created successfully! Please check your email to verify your account before logging in.",
            "success"
        );

        setTimeout(() => {
            window.location.href = "/supplier/login/";
        }, 3000);

    } catch (error) {
        console.error("Registration Error:", error);

        let message = "Registration failed. Please try again.";

        switch (error.code) {
            case "auth/email-already-in-use":
                message = "This email address is already registered.";
                break;
            case "auth/invalid-email":
                message = "Invalid email format.";
                break;
            case "auth/weak-password":
                message = "Password is too weak.";
                break;
            case "auth/network-request-failed":
                message = "Network error. Please check your internet connection.";
                break;
        }

        showAlert(message, "danger");
    } finally {
        isSubmitting = false;
        hideLoading();
    }
}

/* ==========================
   INITIALIZATION & NETWORK LISTENERS
========================== */
document.addEventListener("DOMContentLoaded", () => {
    loadCounties();
    loadTowns("");
    clearAlert();
    hideLoading();
    console.log("✅ Supplier Registration Initialized");
});

window.addEventListener("online", () => {
    showAlert("Internet connection restored.", "success");
});

window.addEventListener("offline", () => {
    showAlert("You are offline. Please check your internet connection.", "warning");
});
