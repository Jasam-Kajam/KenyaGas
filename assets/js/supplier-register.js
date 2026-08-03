/* ==========================================================
   Kenya Gas Marketplace
   Supplier Registration
   Part 1
========================================================== */

/* ==========================
   FIREBASE
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
   COUNTIES
========================== */

import townsByCounty, {
    kenyaCounties
} from "./counties.js";

/* ==========================
   DOM ELEMENTS
========================== */

const form = document.getElementById("supplierRegisterForm");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const alertContainer =
    document.getElementById("alertContainer");

/* ==========================
   PERSONAL DETAILS
========================== */

const firstName =
    document.getElementById("firstName");

const lastName =
    document.getElementById("lastName");

const phone =
    document.getElementById("phone");

/* ==========================
   BUSINESS DETAILS
========================== */

const businessName =
    document.getElementById("businessName");

const businessType =
    document.getElementById("businessType");

const yearsOperation =
    document.getElementById("yearsOperation");

const registrationNumber =
    document.getElementById("registrationNumber");

const kraPin =
    document.getElementById("kraPin");

const businessDescription =
    document.getElementById("businessDescription");

/* ==========================
   LOCATION
========================== */

const address =
    document.getElementById("address");

const county =
    document.getElementById("county");

const town =
    document.getElementById("town");

const landmark =
    document.getElementById("landmark");

const deliveryRadius =
    document.getElementById("deliveryRadius");

const googleMaps =
    document.getElementById("googleMaps");

/* ==========================
   FILES
========================== */

const businessLogo =
    document.getElementById("businessLogo");

const businessLicense =
    document.getElementById("businessLicense");

const taxCertificate =
    document.getElementById("taxCertificate");

const logoPreview =
    document.getElementById("logoPreview");

const licensePreview =
    document.getElementById("licensePreview");

const taxPreview =
    document.getElementById("taxPreview");

const licenseFileName =
    document.getElementById("licenseFileName");

const licenseFileSize =
    document.getElementById("licenseFileSize");

const taxFileName =
    document.getElementById("taxFileName");

const taxFileSize =
    document.getElementById("taxFileSize");

/* ==========================
   ACCOUNT
========================== */

const email =
    document.getElementById("email");

const password =
    document.getElementById("password");

const confirmPassword =
    document.getElementById("confirmPassword");

const agreeTerms =
    document.getElementById("agreeTerms");

const receiveUpdates =
    document.getElementById("receiveUpdates");

/* ==========================
   PASSWORD
========================== */

const passwordStrengthBar =
    document.getElementById("passwordStrengthBar");

const passwordStrengthText =
    document.getElementById("passwordStrengthText");

const passwordMatch =
    document.getElementById("passwordMatch");

const togglePassword =
    document.getElementById("togglePassword");

const togglePasswordIcon =
    document.getElementById("togglePasswordIcon");

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");

const toggleConfirmPasswordIcon =
    document.getElementById("toggleConfirmPasswordIcon");

/* ==========================
   BUTTONS
========================== */

const registerBtn =
    document.getElementById("registerBtn");

const registerBtnText =
    document.getElementById("registerBtnText");

const registerSpinner =
    document.getElementById("registerSpinner");

/* ==========================
   GLOBAL VARIABLES
========================== */

let logoURL = "";

let licenseURL = "";

let taxURL = "";

const MAX_IMAGE_SIZE =
    5 * 1024 * 1024;

const MAX_DOCUMENT_SIZE =
    10 * 1024 * 1024;
/* ==========================================================
   Kenya Gas Marketplace
   Supplier Registration
   Part 2
========================================================== */

/* ==========================
   ALERTS
========================== */

function showAlert(message, type = "danger") {

    alertContainer.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

function clearAlert() {

    alertContainer.innerHTML = "";

}

/* ==========================
   LOADING
========================== */

function showLoading() {

    registerBtn.disabled = true;

    registerBtnText.style.display = "none";

    registerSpinner.style.display = "inline-block";

}

function hideLoading() {

    registerBtn.disabled = false;

    registerBtnText.style.display = "inline";

    registerSpinner.style.display = "none";

}

/* ==========================
   PAGE LOADER
========================== */

window.addEventListener("load", () => {

    if (!loadingOverlay) return;

    loadingOverlay.classList.add("hidden");

    setTimeout(() => {

        loadingOverlay.remove();

    }, 400);

});

/* ==========================
   LOAD COUNTIES
========================== */

function loadCounties() {

    county.innerHTML =
        `<option value="">Select County</option>`;

    kenyaCounties.forEach(countyName => {

        county.innerHTML += `
            <option value="${countyName}">
                ${countyName}
            </option>
        `;

    });

}

/* ==========================
   LOAD TOWNS
========================== */

function loadTowns(selectedCounty) {

    town.innerHTML = "";

    if (!selectedCounty ||
        !townsByCounty[selectedCounty]) {

        town.disabled = true;

        town.innerHTML = `
            <option value="">
                Select County First
            </option>
        `;

        return;

    }

    town.disabled = false;

    town.innerHTML =
        `<option value="">Select Town</option>`;

    townsByCounty[selectedCounty].forEach(location => {

        town.innerHTML += `
            <option value="${location}">
                ${location}
            </option>
        `;

    });

}

/* ==========================
   COUNTY CHANGED
========================== */

county.addEventListener("change", () => {

    loadTowns(county.value);

});

/* ==========================
   PHONE FORMAT
========================== */

phone.addEventListener("blur", () => {

    let value = phone.value.trim();

    if (value.startsWith("07")) {

        value = "+254" + value.substring(1);

    }

    if (value.startsWith("254")) {

        value = "+" + value;

    }

    phone.value = value;

});

/* ==========================
   INITIALIZE
========================== */

document.addEventListener("DOMContentLoaded", () => {

    loadCounties();

    loadTowns("");

    hideLoading();

    console.log(
        "✅ Supplier registration initialized."
    );

});

/* ==========================================================
   Kenya Gas Marketplace
   Supplier Registration
   Part 3
========================================================== */

/* ==========================
   PASSWORD TOGGLE
========================== */

function togglePasswordVisibility(input, icon) {

    if (input.type === "password") {

        input.type = "text";

        icon.classList.remove("bi-eye");
        icon.classList.add("bi-eye-slash");

    } else {

        input.type = "password";

        icon.classList.remove("bi-eye-slash");
        icon.classList.add("bi-eye");

    }

}

togglePassword.addEventListener("click", () => {

    togglePasswordVisibility(
        password,
        togglePasswordIcon
    );

});

toggleConfirmPassword.addEventListener("click", () => {

    togglePasswordVisibility(
        confirmPassword,
        toggleConfirmPasswordIcon
    );

});

/* ==========================
   PASSWORD STRENGTH
========================== */

function calculatePasswordStrength(passwordValue) {

    let score = 0;

    if (passwordValue.length >= 8) score++;
    if (/[A-Z]/.test(passwordValue)) score++;
    if (/[a-z]/.test(passwordValue)) score++;
    if (/[0-9]/.test(passwordValue)) score++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score++;

    return score;

}

function updatePasswordStrength() {

    const pwd = password.value;

    const score = calculatePasswordStrength(pwd);

    passwordStrengthBar.classList.remove(
        "bg-danger",
        "bg-warning",
        "bg-success"
    );

    if (pwd.length === 0) {

        passwordStrengthBar.style.width = "0%";

        passwordStrengthBar.classList.add("bg-danger");

        passwordStrengthText.textContent =
            "Password strength will appear here.";

        return;

    }

    switch (score) {

        case 1:
        case 2:

            passwordStrengthBar.style.width = "30%";

            passwordStrengthBar.classList.add("bg-danger");

            passwordStrengthText.textContent =
                "Weak password";

            break;

        case 3:

            passwordStrengthBar.style.width = "60%";

            passwordStrengthBar.classList.add("bg-warning");

            passwordStrengthText.textContent =
                "Medium password";

            break;

        case 4:

            passwordStrengthBar.style.width = "80%";

            passwordStrengthBar.classList.add("bg-success");

            passwordStrengthText.textContent =
                "Strong password";

            break;

        case 5:

            passwordStrengthBar.style.width = "100%";

            passwordStrengthBar.classList.add("bg-success");

            passwordStrengthText.textContent =
                "Very strong password";

            break;

    }

}

password.addEventListener("input", () => {

    updatePasswordStrength();

    checkPasswordMatch();

});

/* ==========================
   PASSWORD MATCH
========================== */

function checkPasswordMatch() {

    if (confirmPassword.value === "") {

        passwordMatch.textContent = "";

        return;

    }

    if (password.value === confirmPassword.value) {

        passwordMatch.textContent =
            "✓ Passwords match";

        passwordMatch.style.color = "#198754";

    } else {

        passwordMatch.textContent =
            "✗ Passwords do not match";

        passwordMatch.style.color = "#dc3545";

    }

}

confirmPassword.addEventListener("input", checkPasswordMatch);

/* ==========================
   EMAIL VALIDATION
========================== */

function isValidEmail(emailAddress) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);

}

/* ==========================
   PHONE VALIDATION
========================== */

function isValidPhone(phoneNumber) {

    return /^(\+254|254|0)7\d{8}$/.test(phoneNumber);

}

/* ==========================
   FORM VALIDATION
========================== */

function validateForm() {

    clearAlert();

    if (!firstName.value.trim()) {

        showAlert("Please enter your first name.");

        firstName.focus();

        return false;

    }

    if (!lastName.value.trim()) {

        showAlert("Please enter your last name.");

        lastName.focus();

        return false;

    }

    if (!businessName.value.trim()) {

        showAlert("Please enter your business name.");

        businessName.focus();

        return false;

    }

    if (!isValidPhone(phone.value.trim())) {

        showAlert(
            "Please enter a valid Kenyan phone number."
        );

        phone.focus();

        return false;

    }

    if (!isValidEmail(email.value.trim())) {

        showAlert(
            "Please enter a valid email address."
        );

        email.focus();

        return false;

    }

    if (!county.value) {

        showAlert("Please select your county.");

        county.focus();

        return false;

    }

    if (!town.value) {

        showAlert("Please select your town.");

        town.focus();

        return false;

    }

    if (password.value.length < 8) {

        showAlert(
            "Password must contain at least 8 characters."
        );

        password.focus();

        return false;

    }

    if (password.value !== confirmPassword.value) {

        showAlert("Passwords do not match.");

        confirmPassword.focus();

        return false;

    }

    if (!agreeTerms.checked) {

        showAlert(
            "You must agree to the Terms & Conditions."
        );

        return false;

    }

    return true;

}

/* ==========================================================
   Kenya Gas Marketplace
   Supplier Registration
   Part 4
========================================================== */

/* ==========================
   FILE SIZE FORMATTER
========================== */

function formatFileSize(bytes) {

    if (bytes < 1024) {

        return bytes + " Bytes";

    }

    if (bytes < 1024 * 1024) {

        return (bytes / 1024).toFixed(1) + " KB";

    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";

}

/* ==========================
   BUSINESS LOGO PREVIEW
========================== */

businessLogo.addEventListener("change", () => {

    const file = businessLogo.files[0];

    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {

        showAlert("Business logo must not exceed 5 MB.");

        businessLogo.value = "";

        return;

    }

    const reader = new FileReader();

    reader.onload = e => {

        logoPreview.innerHTML = `
            <img
                src="${e.target.result}"
                alt="Business Logo Preview">
        `;

    };

    reader.readAsDataURL(file);

});

/* ==========================
   LICENSE PREVIEW
========================== */

businessLicense.addEventListener("change", () => {

    const file = businessLicense.files[0];

    if (!file) {

        licensePreview.style.display = "none";

        return;

    }

    if (file.size > MAX_DOCUMENT_SIZE) {

        showAlert("Business license must not exceed 10 MB.");

        businessLicense.value = "";

        return;

    }

    licenseFileName.textContent = file.name;

    licenseFileSize.textContent = formatFileSize(file.size);

    licensePreview.style.display = "flex";

});

/* ==========================
   TAX CERTIFICATE PREVIEW
========================== */

taxCertificate.addEventListener("change", () => {

    const file = taxCertificate.files[0];

    if (!file) {

        taxPreview.style.display = "none";

        return;

    }

    if (file.size > MAX_DOCUMENT_SIZE) {

        showAlert("Tax certificate must not exceed 10 MB.");

        taxCertificate.value = "";

        return;

    }

    taxFileName.textContent = file.name;

    taxFileSize.textContent = formatFileSize(file.size);

    taxPreview.style.display = "flex";

});

/* ==========================
   REMOVE PREVIEWS
========================== */

function clearFilePreviews() {

    logoPreview.innerHTML = `
        <div class="logo-placeholder">
            <i class="bi bi-image fs-1"></i>
            <p class="mt-2 mb-0">
                Logo Preview
            </p>
        </div>
    `;

    licensePreview.style.display = "none";

    taxPreview.style.display = "none";

}

/* ==========================
   RESET FILE INPUTS
========================== */

function resetFileInputs() {

    businessLogo.value = "";

    businessLicense.value = "";

    taxCertificate.value = "";

    clearFilePreviews();

}

/* ==========================================================
   Kenya Gas Marketplace
   Supplier Registration
   Part 5
========================================================== */

/* ==========================
   UPLOAD FILE TO FIREBASE
========================== */

async function uploadFile(file, folder) {

    if (!file) {

        return "";

    }

    try {

        const fileName =
            `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

        const storageRef = ref(
            storage,
            `${folder}/${fileName}`
        );

        const snapshot = await uploadBytes(
            storageRef,
            file
        );

        const downloadURL =
            await getDownloadURL(snapshot.ref);

        return downloadURL;

    } catch (error) {

        console.error(error);

        throw new Error(
            `Failed to upload ${file.name}`
        );

    }

}

/* ==========================
   UPLOAD LOGO
========================== */

async function uploadBusinessLogo(uid) {

    const file = businessLogo.files[0];

    if (!file) {

        return "";

    }

    return await uploadFile(
        file,
        `suppliers/${uid}/logo`
    );

}

/* ==========================
   UPLOAD LICENSE
========================== */

async function uploadBusinessLicense(uid) {

    const file =
        businessLicense.files[0];

    if (!file) {

        return "";

    }

    return await uploadFile(
        file,
        `suppliers/${uid}/license`
    );

}

/* ==========================
   UPLOAD TAX CERTIFICATE
========================== */

async function uploadTaxCertificate(uid) {

    const file =
        taxCertificate.files[0];

    if (!file) {

        return "";

    }

    return await uploadFile(
        file,
        `suppliers/${uid}/tax`
    );

}

/* ==========================
   UPLOAD ALL OPTIONAL FILES
========================== */

async function uploadSupplierFiles(uid) {

    logoURL = "";

    licenseURL = "";

    taxURL = "";

    try {

        if (businessLogo.files.length > 0) {

            logoURL =
                await uploadBusinessLogo(uid);

        }

        if (businessLicense.files.length > 0) {

            licenseURL =
                await uploadBusinessLicense(uid);

        }

        if (taxCertificate.files.length > 0) {

            taxURL =
                await uploadTaxCertificate(uid);

        }

        return {

            logoURL,
            licenseURL,
            taxURL

        };

    } catch (error) {

        console.error(error);

        showAlert(
            error.message,
            "danger"
        );

        throw error;

    }

}

/* ==========================
   DELETE EMPTY URLS
========================== */

function cleanUploadData(data) {

    const cleaned = {};

    Object.keys(data).forEach(key => {

        if (
            data[key] !== "" &&
            data[key] !== null &&
            data[key] !== undefined
        ) {

            cleaned[key] = data[key];

        }

    });

    return cleaned;

}

/* ==========================================================
   Kenya Gas Marketplace
   Supplier Registration
   Part 6
========================================================== */

/* ==========================
   REGISTER SUPPLIER
========================== */

form.addEventListener("submit", registerSupplier);

async function registerSupplier(e) {

    e.preventDefault();

    clearAlert();

    if (!validateForm()) {

        return;

    }

    try {

        showLoading();

       if (isSubmitting) return;

isSubmitting = true;

        /* --------------------------
           Create Authentication User
        -------------------------- */

        const credential =
            await createUserWithEmailAndPassword(

                auth,

                email.value.trim(),

                password.value

            );

        const user = credential.user;

        /* --------------------------
           Update Display Name
        -------------------------- */

        await updateProfile(user, {

            displayName:
                `${firstName.value.trim()} ${lastName.value.trim()}`

        });

        /* --------------------------
           Verify Email
        -------------------------- */

        await sendEmailVerification(user);

        /* --------------------------
           Upload Optional Files
        -------------------------- */

        const uploads =
            await uploadSupplierFiles(user.uid);

        /* --------------------------
           Selected LPG Brands
        -------------------------- */

        const brands = [];

        document
            .querySelectorAll(
                ".checkbox-grid input[type='checkbox']:checked"
            )
            .forEach(box => {

                brands.push(box.value);

            });

        /* --------------------------
           Firestore Data
        -------------------------- */

        const supplierData = {

            uid: user.uid,

            firstName:
                firstName.value.trim(),

            lastName:
                lastName.value.trim(),

            fullName:
                `${firstName.value.trim()} ${lastName.value.trim()}`,

            businessName:
                businessName.value.trim(),

            businessType:
                businessType.value,

            yearsOperation:
                yearsOperation.value || "",

            phone:
                phone.value.trim(),

            email:
                email.value.trim().toLowerCase(),

            address:
                address.value.trim(),

            county:
                county.value,

            town:
                town.value,

            landmark:
                landmark.value.trim(),

            deliveryRadius:
                deliveryRadius.value,

            googleMaps:
                googleMaps.value.trim(),

            businessDescription:
                businessDescription.value.trim(),

            registrationNumber:
                registrationNumber.value.trim(),

            kraPin:
                kraPin.value.trim(),

            brands,

            logoURL:
                uploads.logoURL || "",

            licenseURL:
                uploads.licenseURL || "",

            taxURL:
                uploads.taxURL || "",

            receiveUpdates:
                receiveUpdates.checked,

            emailVerified:
                user.emailVerified,

            verified: false,

            verificationStatus:
                "Pending",

            approvalStatus:
                "Pending Review",

            sellerStatus:
                "Inactive",

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };

        /* --------------------------
           Remove Empty Fields
        -------------------------- */

        const cleanData =
            cleanUploadData(supplierData);

        /* --------------------------
           Save To Firestore
        -------------------------- */

        await setDoc(

            doc(
                db,
                "suppliers",
                user.uid
            ),

            cleanData

        );

        /* --------------------------
           Success
        -------------------------- */
isSubmitting = false;

hideLoading();
       
        showAlert(

            "✅ Supplier account created successfully! Please verify your email before logging in.",

            "success"

        );

        /* --------------------------
           Redirect
        -------------------------- */
isSubmitting = false;

hideLoading();
       
        setTimeout(() => {

            window.location.href =
                "supplier-login.html";

        }, 2500);

    }

    catch (error) {

        console.error(error);

        hideLoading();

        let message =
            "Registration failed. Please try again.";

        switch (error.code) {

            case "auth/email-already-in-use":

                message =
                    "This email address is already registered.";

                break;

            case "auth/invalid-email":

                message =
                    "Invalid email address.";

                break;

            case "auth/weak-password":

                message =
                    "Password is too weak.";

                break;

            case "auth/network-request-failed":

                message =
                    "Network error. Check your internet connection.";

                break;

        }

        showAlert(message);

        return;

    }

}

/* ==========================================================
   Kenya Gas Marketplace
   Supplier Registration
   Part 7 (FIXED)
========================================================== */

/* ==========================
   SUBMISSION STATE
========================== */

let isSubmitting = false;

/* ==========================
   RESET FORM
========================== */

function resetRegistrationForm() {

    form.reset();

    passwordStrengthBar.style.width = "0%";
    passwordStrengthBar.className = "progress-bar bg-danger";
    passwordStrengthText.textContent =
        "Password strength will appear here.";

    passwordMatch.textContent = "";

    logoURL = "";
    licenseURL = "";
    taxURL = "";

    resetFileInputs();

    loadTowns("");

}

/* ==========================
   CONNECTION STATUS
========================== */

window.addEventListener("online", () => {

    showAlert(
        "Internet connection restored.",
        "success"
    );

});

window.addEventListener("offline", () => {

    showAlert(
        "You are offline. Please check your internet connection.",
        "warning"
    );

});

/* ==========================
   INITIALIZATION
========================== */

function initializeSupplierRegistration() {

    loadCounties();

    loadTowns("");

    clearAlert();

    hideLoading();

    console.log(
        "✅ Supplier Registration Initialized"
    );

}

document.addEventListener(

    "DOMContentLoaded",

    initializeSupplierRegistration

);

/* ==========================
   GLOBAL ERROR HANDLER
========================== */

window.addEventListener("error", event => {

    console.error(
        "Application Error:",
        event.error
    );

});

window.addEventListener("unhandledrejection", event => {

    console.error(
        "Unhandled Promise:",
        event.reason
    );

});

/* ==========================================================
   END OF FILE
========================================================== */
