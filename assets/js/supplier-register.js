// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/supplier-register.js
// Version: 1.0.0
//
// Supplier Registration Controller
// ==========================================================

import {

    auth,

    db,

    storage,

    now

} from "./firebase.js";

import {

    createUserWithEmailAndPassword,

    sendEmailVerification,

    updateProfile

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {

    doc,

    getDoc,

    setDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {

    ref,

    uploadBytes,

    getDownloadURL

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


import {
    kenyaCounties,
    getTowns
} from "./counties.js";

// ==========================================================
// DOM Elements
// ==========================================================
const countySelect = document.getElementById("county");
const townSelect = document.getElementById("town");

// Load counties
kenyaCounties.forEach(county => {

    const option = document.createElement("option");

    option.value = county;
    option.textContent = county;

    countySelect.appendChild(option);

});

// Load towns when county changes
countySelect.addEventListener("change", () => {

    townSelect.innerHTML =
        '<option value="">Select Town</option>';

    const towns = getTowns(countySelect.value);

    towns.forEach(town => {

        const option = document.createElement("option");

        option.value = town;
        option.textContent = town;

        townSelect.appendChild(option);

    });

});

const supplierForm =
    document.getElementById("supplierRegisterForm");

const businessName =
    document.getElementById("businessName");

const ownerName =
    document.getElementById("ownerName");

const email =
    document.getElementById("email");

const phone =
    document.getElementById("phone");

const county =
    document.getElementById("county");

const town =
    document.getElementById("town");

const address =
    document.getElementById("address");

const licenceNumber =
    document.getElementById("licenceNumber");

const kraPin =
    document.getElementById("kraPin");

const password =
    document.getElementById("password");

const confirmPassword =
    document.getElementById("confirmPassword");

const logoInput =
    document.getElementById("businessLogo");

const logoPreview =
    document.getElementById("logoPreview");

const registerButton =
    document.getElementById("registerButton");

const spinner =
    document.getElementById("registerSpinner");

const errorBox =
    document.getElementById("registerError");

const passwordStrength =
    document.getElementById("passwordStrengthBar");

const passwordStrengthText =
    document.getElementById("passwordStrengthText");

// ==========================================================
// Loading State
// ==========================================================

function setLoading(loading) {

    if (registerButton) {

        registerButton.disabled = loading;

    }

    if (spinner) {

        spinner.classList.toggle(

            "d-none",

            !loading

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

    return /^(\+254|254|0)7\d{8}$/

        .test(number.trim());

}

// ==========================================================
// Password Strength
// ==========================================================

function calculateStrength(passwordValue) {

    let score = 0;

    if (passwordValue.length >= 8) score++;

    if (/[A-Z]/.test(passwordValue)) score++;

    if (/[a-z]/.test(passwordValue)) score++;

    if (/\d/.test(passwordValue)) score++;

    if (/[^A-Za-z0-9]/.test(passwordValue)) score++;

    return score;

}

function updateStrengthMeter() {

    if (!passwordStrength) return;

    const score =

        calculateStrength(

            password.value

        );

    passwordStrength.style.width =

        `${score * 20}%`;

    switch (score) {

        case 0:
        case 1:

            passwordStrength.style.background = "#dc3545";

            passwordStrengthText.textContent = "Weak";

            break;

        case 2:
        case 3:

            passwordStrength.style.background = "#ffc107";

            passwordStrengthText.textContent = "Medium";

            break;

        default:

            passwordStrength.style.background = "#198754";

            passwordStrengthText.textContent = "Strong";

    }

}

// ==========================================================
// Form Validation
// ==========================================================

function validateForm() {

    clearError();

    if (!businessName.value.trim()) {

        showError("Business name is required.");

        businessName.focus();

        return false;

    }

    if (!ownerName.value.trim()) {

        showError("Owner name is required.");

        ownerName.focus();

        return false;

    }

    if (!email.value.trim()) {

        showError("Email address is required.");

        email.focus();

        return false;

    }

    if (!validPhone(phone.value)) {

        showError("Enter a valid Kenyan mobile number.");

        phone.focus();

        return false;

    }

    if (!county.value) {

        showError("Please select a county.");

        county.focus();

        return false;

    }

    if (!town.value) {

        showError("Please select a town.");

        town.focus();

        return false;

    }

    if (!address.value.trim()) {

        showError("Business address is required.");

        address.focus();

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

    if (

        !logoInput ||

        logoInput.files.length === 0

    ) {

        showError(

            "Please upload your business logo."

        );

        return false;

    }

    return true;

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

    businessName,

    ownerName,

    email,

    phone,

    county,

    town,

    address,

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
// Logo Upload Configuration
// ==========================================================

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB

const ALLOWED_TYPES = [

    "image/jpeg",

    "image/png",

    "image/webp"

];

// ==========================================================
// Logo Preview
// ==========================================================

if (logoInput) {

    logoInput.addEventListener(

        "change",

        previewLogo

    );

}

function previewLogo() {

    clearError();

    const file = logoInput.files[0];

    if (!file) {

        if (logoPreview) {

            logoPreview.src = "";

            logoPreview.classList.add("d-none");

        }

        return;

    }

    if (!ALLOWED_TYPES.includes(file.type)) {

        showError(

            "Only JPG, PNG and WEBP images are allowed."

        );

        logoInput.value = "";

        return;

    }

    if (file.size > MAX_LOGO_SIZE) {

        showError(

            "Logo size must not exceed 2 MB."

        );

        logoInput.value = "";

        return;

    }

    if (!logoPreview) return;

    const reader = new FileReader();

    reader.onload = (event) => {

        logoPreview.src = event.target.result;

        logoPreview.classList.remove("d-none");

    };

    reader.readAsDataURL(file);

}

// ==========================================================
// Upload Logo To Firebase Storage
// ==========================================================

async function uploadBusinessLogo(uid) {

    const file = logoInput.files[0];

    if (!file) {

        return "";

    }

    const extension =

        file.name.split(".").pop().toLowerCase();

    const storageRef = ref(

        storage,

        `supplier-logos/${uid}/logo.${extension}`

    );

    await uploadBytes(

        storageRef,

        file,

        {

            contentType: file.type

        }

    );

    const downloadURL =

        await getDownloadURL(

            storageRef

        );

    return downloadURL;

}

// ==========================================================
// Reset Logo Preview
// ==========================================================

function resetLogo() {

    if (logoInput) {

        logoInput.value = "";

    }

    if (logoPreview) {

        logoPreview.src = "";

        logoPreview.classList.add(

            "d-none"

        );

    }

}

// ==========================================================
// Export
// ==========================================================

export {

    uploadBusinessLogo

};

// ==========================================================
// Create Supplier Profile
// ==========================================================

async function createSupplierProfile(

    user,

    logoURL

) {

    try {

        // --------------------------------------------------
        // Users Collection
        // --------------------------------------------------

        await setDoc(

            doc(

                db,

                "users",

                user.uid

            ),

            {

                uid: user.uid,

                role: "supplier",

                fullName:

                    ownerName.value.trim(),

                email:

                    email.value.trim().toLowerCase(),

                phone:

                    phone.value.trim(),

                status: "pending",

                emailVerified: false,

                createdAt: now(),

                updatedAt: now()

            }

        );

        // --------------------------------------------------
        // Suppliers Collection
        // --------------------------------------------------

        await setDoc(

    doc(db, "supplierPublic", user.uid),

    {

        uid: user.uid,

        businessName: businessName.value.trim(),

        county: county.value,

        town: town.value,

        logoURL,

        verified: false,

        rating: 0,

        totalReviews: 0,

        featured: false,

        createdAt: now(),

        updatedAt: now()

    }

);

        // --------------------------------------------------
        // Redirect
        // --------------------------------------------------

        sessionStorage.setItem(

            "supplierRegistration",

            "success"

        );

        window.location.href =

            "/supplier/pending/";

    }

    catch (error) {

        console.error(

            "Supplier profile creation failed:",

            error

        );

        showError(

            "Your account was created, but we couldn't finish setting up your supplier profile. Please contact support."

        );

    }

}

// ==========================================================
// Password Match Validation
// ==========================================================

function validatePasswordMatch() {

    if (

        !password.value ||

        !confirmPassword.value

    ) {

        confirmPassword.setCustomValidity("");

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
// Live Validation
// ==========================================================

if (password) {

    password.addEventListener(

        "input",

        () => {

            updateStrengthMeter();

            validatePasswordMatch();

        }

    );

}

if (confirmPassword) {

    confirmPassword.addEventListener(

        "input",

        validatePasswordMatch

    );

}

// ==========================================================
// Auto-format Business Name
// ==========================================================

if (businessName) {

    businessName.addEventListener(

        "blur",

        () => {

            businessName.value =

                businessName.value

                .trim()

                .replace(/\s+/g, " ");

        }

    );

}

// ==========================================================
// Form Submission
// ==========================================================

if (supplierForm) {

    supplierForm.addEventListener(

        "submit",

        async (event) => {

            event.preventDefault();

            await registerSupplier();

        }

    );

}

// ==========================================================
// Auto Focus
// ==========================================================

function initializeForm() {

    if (businessName) {

        businessName.focus();

    }

    updateStrengthMeter();

}

// ==========================================================
// Prevent Multiple Submissions
// ==========================================================

let submitting = false;

async function submitRegistration(event) {

    event.preventDefault();

    if (submitting) {

        return;

    }

    submitting = true;

    try {

        await registerSupplier();

    }

    finally {

        submitting = false;

    }

}

if (supplierForm) {

    supplierForm.removeEventListener(

        "submit",

        registerSupplier

    );

    supplierForm.addEventListener(

        "submit",

        submitRegistration

    );

}

// ==========================================================
// Startup
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeForm();

    }

);

// ==========================================================
// Export
// ==========================================================

export {

    registerSupplier

};

