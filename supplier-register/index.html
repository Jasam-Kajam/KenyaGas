// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/supplier-register.js
// Version: 1.0.0
// Part 1: Imports, Constants, DOM Cache, Global State
// ==========================================================


// ==========================================================
// Firebase Imports
// ==========================================================

import {

    auth,

    db,

    storage,

    now

} from "./firebase.js";



// ==========================================================
// Firebase Authentication Functions
// ==========================================================

import {

    createUserWithEmailAndPassword,

    sendEmailVerification

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";



// ==========================================================
// Firebase Firestore Functions
// ==========================================================

import {

    doc,

    setDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// Kenya Counties & Towns Data
// ==========================================================

import {
    kenyaCounties,
    townsData
} from "./counties.js";

// ==========================================================
// Firebase Storage Functions
// ==========================================================

import {

    ref,

    uploadBytes,

    getDownloadURL

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";




// ==========================================================
// Constants
// ==========================================================

const MAX_LOGO_SIZE = 2 * 1024 * 1024;


const ALLOWED_LOGO_TYPES = [

    "image/jpeg",

    "image/png",

    "image/webp"

];




// ==========================================================
// DOM Cache
// ==========================================================


// Registration Form

const supplierRegisterForm =
    document.getElementById(
        "supplierRegisterForm"
    );


// Error

const registerError =
    document.getElementById(
        "registerError"
    );


// Business Information

const businessName =
    document.getElementById(
        "businessName"
    );


const ownerName =
    document.getElementById(
        "ownerName"
    );


const email =
    document.getElementById(
        "email"
    );


const phone =
    document.getElementById(
        "phone"
    );


// Location

const county =
    document.getElementById(
        "county"
    );


const town =
    document.getElementById(
        "town"
    );


const address =
    document.getElementById(
        "address"
    );


// Verification

const licenceNumber =
    document.getElementById(
        "licenceNumber"
    );


const kraPin =
    document.getElementById(
        "kraPin"
    );


// Logo

const businessLogo =
    document.getElementById(
        "businessLogo"
    );


const logoPreview =
    document.getElementById(
        "logoPreview"
    );


// Security

const password =
    document.getElementById(
        "password"
    );


const confirmPassword =
    document.getElementById(
        "confirmPassword"
    );


const passwordStrengthBar =
    document.getElementById(
        "passwordStrengthBar"
    );


const passwordStrengthText =
    document.getElementById(
        "passwordStrengthText"
    );


const agreeTerms =
    document.getElementById(
        "agreeTerms"
    );


// Submit

const registerButton =
    document.getElementById(
        "registerButton"
    );


const registerSpinner =
    document.getElementById(
        "registerSpinner"
    );




// ==========================================================
// Global State
// ==========================================================

let logoURL = "";

let isSubmitting = false;





// ==========================================================
// End Part 1
// ==========================================================


// ==========================================================
// Part 2
// Utilities & Loading/Error Helpers
// ==========================================================


// ==========================================================
// Show Error Message
// ==========================================================

function showError(message) {


    if (!registerError) {

        return;

    }


    registerError.textContent = message;


    registerError.classList.remove(
        "d-none"
    );


}



// ==========================================================
// Clear Error Message
// ==========================================================

function clearError() {


    if (!registerError) {

        return;

    }


    registerError.textContent = "";


    registerError.classList.add(
        "d-none"
    );


}



// ==========================================================
// Set Loading State
// ==========================================================

function setLoading(state) {


    if (!registerButton) {

        return;

    }



    isSubmitting = state;



    registerButton.disabled = state;



    if (registerSpinner) {


        if (state) {


            registerSpinner.classList.remove(
                "d-none"
            );


        } else {


            registerSpinner.classList.add(
                "d-none"
            );


        }

    }



    const buttonText =
        registerButton.querySelector(
            "span"
        );


    if (buttonText) {


        buttonText.textContent = state

            ? "Creating Account..."

            : "Register Supplier";


    }


}




// ==========================================================
// Sanitize Input
// ==========================================================

function sanitizeInput(value) {


    if (!value) {

        return "";

    }


    return value

        .trim()

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        );

}




// ==========================================================
// Email Validation Helper
// ==========================================================

function isValidEmail(emailValue) {


    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        .test(
            emailValue
        );


}




// ==========================================================
// Kenyan Phone Validation Helper
// ==========================================================

function isValidKenyanPhone(phoneValue) {


    return /^(\+254|254|0)7\d{8}$/

        .test(
            phoneValue
        );


}




// ==========================================================
// Password Strength Calculation
// ==========================================================

function calculatePasswordStrength(value) {


    let strength = 0;



    if (value.length >= 8) {

        strength++;

    }


    if (/[A-Z]/.test(value)) {

        strength++;

    }


    if (/[0-9]/.test(value)) {

        strength++;

    }


    if (/[^A-Za-z0-9]/.test(value)) {

        strength++;

    }



    return strength;


}




// ==========================================================
// Update Password Strength UI
// ==========================================================

function updatePasswordStrength(value) {


    const strength =
        calculatePasswordStrength(
            value
        );



    const labels = [

        "Weak",

        "Fair",

        "Good",

        "Strong",

        "Excellent"

    ];



    if (passwordStrengthBar) {


        passwordStrengthBar.style.width =

            `${strength * 25}%`;


    }



    if (passwordStrengthText) {


        passwordStrengthText.textContent =

            labels[strength];


    }


}



// ==========================================================
// End Part 2
// ==========================================================


// ==========================================================
// Part 3
// County & Town Loader
// ==========================================================


// ==========================================================
// Load Counties
// ==========================================================

function loadCounties() {


    if (!county) {

        return;

    }


    county.innerHTML = `

        <option value="">

            Select County

        </option>

    `;



    kenyaCounties.forEach((item) => {


        const option =
            document.createElement(
                "option"
            );


        option.value = item;


        option.textContent = item;


        county.appendChild(
            option
        );


    });


}




// ==========================================================
// Load Towns By County
// ==========================================================

function loadTowns(selectedCounty) {


    if (!town) {

        return;

    }



    town.innerHTML = `

        <option value="">

            Select Town

        </option>

    `;



    if (!selectedCounty) {


        town.disabled = true;


        return;


    }



    const availableTowns =

        townsData[selectedCounty] || [];




    availableTowns.forEach((item) => {


        const option =

            document.createElement(
                "option"
            );



        option.value = item;


        option.textContent = item;



        town.appendChild(
            option
        );


    });



    town.disabled = false;


}




// ==========================================================
// County Change Handler
// ==========================================================

function handleCountyChange() {


    if (!county) {

        return;

    }



    loadTowns(

        county.value

    );


}



// ==========================================================
// End Part 3
// ==========================================================


// ==========================================================
// Part 4
// Form Validation
// ==========================================================


// ==========================================================
// Validate Supplier Registration Form
// ==========================================================

function validateSupplierForm() {


    clearError();



    // Business Name

    if (!businessName.value.trim()) {


        showError(
            "Business name is required."
        );


        businessName.focus();


        return false;

    }




    // Owner Name

    if (!ownerName.value.trim()) {


        showError(
            "Owner name is required."
        );


        ownerName.focus();


        return false;

    }




    // Email

    const emailValue =
        email.value.trim();



    if (!emailValue) {


        showError(
            "Email address is required."
        );


        email.focus();


        return false;


    }



    if (!isValidEmail(emailValue)) {


        showError(
            "Enter a valid email address."
        );


        email.focus();


        return false;


    }




    // Phone

    const phoneValue =
        phone.value.trim();



    if (!phoneValue) {


        showError(
            "Phone number is required."
        );


        phone.focus();


        return false;


    }



    if (!isValidKenyanPhone(phoneValue)) {


        showError(
            "Enter a valid Kenyan phone number."
        );


        phone.focus();


        return false;


    }




    // Location

    if (!county.value) {


        showError(
            "Please select a county."
        );


        county.focus();


        return false;


    }



    if (!town.value) {


        showError(
            "Please select a town."
        );


        town.focus();


        return false;


    }




    // Address

    if (!address.value.trim()) {


        showError(
            "Business address is required."
        );


        address.focus();


        return false;


    }




    // Logo

    if (!businessLogo.files.length) {


        showError(
            "Business logo is required."
        );


        businessLogo.focus();


        return false;


    }




    // Password

    const passwordValue =
        password.value;



    if (!passwordValue) {


        showError(
            "Password is required."
        );


        password.focus();


        return false;


    }



    if (passwordValue.length < 8) {


        showError(
            "Password must be at least 8 characters."
        );


        password.focus();


        return false;


    }




    // Confirm Password

    if (
        passwordValue !==
        confirmPassword.value
    ) {


        showError(
            "Passwords do not match."
        );


        confirmPassword.focus();


        return false;


    }




    // Terms

    if (!agreeTerms.checked) {


        showError(
            "You must agree to the Terms & Conditions."
        );


        agreeTerms.focus();


        return false;


    }




    return true;


}



// ==========================================================
// End Part 4
// ==========================================================


// ==========================================================
// Part 5
// Logo Upload & Preview
// ==========================================================


// ==========================================================
// Validate Logo File
// ==========================================================

function validateLogoFile(file) {


    if (!file) {


        showError(
            "Please upload a business logo."
        );


        return false;


    }



    if (
        !ALLOWED_LOGO_TYPES.includes(
            file.type
        )
    ) {


        showError(
            "Only JPG, PNG and WEBP images are allowed."
        );


        return false;


    }




    if (
        file.size > MAX_LOGO_SIZE
    ) {


        showError(
            "Logo size must not exceed 2MB."
        );


        return false;


    }



    return true;


}




// ==========================================================
// Preview Logo
// ==========================================================

function previewLogo(file) {


    if (!logoPreview || !file) {


        return;


    }



    const reader =

        new FileReader();



    reader.onload = function(event) {


        logoPreview.src =

            event.target.result;



        logoPreview.classList.remove(

            "d-none"

        );


    };



    reader.readAsDataURL(file);


}




// ==========================================================
// Upload Logo To Firebase Storage
// ==========================================================

async function uploadSupplierLogo(userId, file) {


    if (!validateLogoFile(file)) {


        throw new Error(

            "Invalid logo file."

        );


    }



    const logoReference =

        ref(

            storage,

            `suppliers/${userId}/logo/${file.name}`

        );



    await uploadBytes(

        logoReference,

        file

    );



    const downloadURL =

        await getDownloadURL(

            logoReference

        );



    return downloadURL;


}




// ==========================================================
// Logo Change Handler
// ==========================================================

function handleLogoChange() {


    const file =

        businessLogo.files[0];



    if (!file) {


        return;


    }



    clearError();



    if (
        validateLogoFile(file)
    ) {


        previewLogo(file);


    } else {


        businessLogo.value = "";


    }


}



// ==========================================================
// End Part 5
// ==========================================================


// ==========================================================
// Part 6
// Firebase Authentication
// ==========================================================


// ==========================================================
// Create Supplier Authentication Account
// ==========================================================

async function createSupplierAccount() {


    const emailValue =

        email.value.trim();



    const passwordValue =

        password.value;



    try {


        const userCredential =

            await createUserWithEmailAndPassword(

                auth,

                emailValue,

                passwordValue

            );



        const user =

            userCredential.user;



        await sendEmailVerification(

            user

        );



        return user;



    } catch (error) {



        console.error(

            "Supplier authentication error:",

            error

        );



        throw new Error(

            getAuthErrorMessage(

                error.code

            )

        );


    }


}




// ==========================================================
// Firebase Auth Error Messages
// ==========================================================

function getAuthErrorMessage(errorCode) {


    switch (errorCode) {


        case "auth/email-already-in-use":


            return (

                "This email address is already registered."

            );



        case "auth/invalid-email":


            return (

                "The email address is invalid."

            );



        case "auth/weak-password":


            return (

                "Password is too weak. Use a stronger password."

            );



        case "auth/network-request-failed":


            return (

                "Network error. Check your internet connection."

            );



        default:


            return (

                "Unable to create account. Please try again."

            );


    }


}



// ==========================================================
// End Part 6
// ==========================================================


// ==========================================================
// Part 7
// Firestore Supplier Profile Creation
// ==========================================================


// ==========================================================
// Create Supplier Firestore Profile
// ==========================================================

async function createSupplierProfile(
    user,
    logoURL
) {


    try {


        const supplierData = {


            // Account Identity

            uid: user.uid,


            email: user.email,


            accountType: "supplier",



            // Business Information

            businessName:

                businessName.value.trim(),



            ownerName:

                ownerName.value.trim(),



            phone:

                phone.value.trim(),



            // Location

            county:

                county.value,



            town:

                town.value,



            address:

                address.value.trim(),



            // Verification Information

            licenceNumber:

                licenceNumber.value.trim(),



            kraPin:

                kraPin.value.trim(),



            // Logo

            logoURL: logoURL || "",



            // Account Status

            verified: false,


            status: "pending",



            // Platform Information

            createdAt:

                now(),



            updatedAt:

                now()


        };




        await setDoc(

            doc(

                db,

                "suppliers",

                user.uid

            ),

            supplierData

        );



        return supplierData;



    } catch (error) {



        console.error(

            "Firestore supplier profile error:",

            error

        );



        throw new Error(

            "Unable to save supplier profile."

        );


    }


}



// ==========================================================
// End Part 7
// ==========================================================


// ==========================================================
// Part 8
// Registration Workflow
// ==========================================================


// ==========================================================
// Handle Supplier Registration
// ==========================================================

async function handleSupplierRegistration() {


    if (isSubmitting) {


        return;


    }




    if (!validateSupplierForm()) {


        return;


    }




    try {


        setLoading(true);



        clearError();



        // ==================================================
        // Step 1:
        // Create Firebase Authentication Account
        // ==================================================

        const user =

            await createSupplierAccount();




        // ==================================================
        // Step 2:
        // Upload Business Logo
        // ==================================================

        const logoFile =

            businessLogo.files[0];



        logoURL =

            await uploadSupplierLogo(

                user.uid,

                logoFile

            );





        // ==================================================
        // Step 3:
        // Create Firestore Supplier Profile
        // ==================================================

        await createSupplierProfile(

            user,

            logoURL

        );





        // ==================================================
        // Success
        // ==================================================

        alert(

            "Supplier registration successful. Please verify your email."

        );



        window.location.href =

            "/supplier/login/";





    } catch (error) {



        console.error(

            "Registration workflow error:",

            error

        );



        showError(

            error.message

        );



    } finally {



        setLoading(false);


    }


}



// ==========================================================
// End Part 8
// ==========================================================


// ==========================================================
// Part 9
// Initialization & Event Listeners
// ==========================================================


// ==========================================================
// Initialize Supplier Registration
// ==========================================================

function initializeSupplierRegistration() {


    // Load counties

    loadCounties();



    // Disable town until county selected

    if (town) {


        town.disabled = true;


    }


}



// ==========================================================
// Event Listeners
// ==========================================================


// Form Submit

if (supplierRegisterForm) {


    supplierRegisterForm.addEventListener(

        "submit",

        function(event) {


            event.preventDefault();


            handleSupplierRegistration();


        }

    );


}




// County Selection

if (county) {


    county.addEventListener(

        "change",

        function() {


            loadTowns(

                this.value

            );


        }

    );


}




// Logo Selection

if (businessLogo) {


    businessLogo.addEventListener(

        "change",

        function() {


            handleLogoChange();


        }

    );


}




// Password Strength

if (password) {


    password.addEventListener(

        "input",

        function() {


            updatePasswordStrength(

                this.value

            );


        }

    );


}




// Clear Error While Typing

const formInputs =

    document.querySelectorAll(

        "#supplierRegisterForm input, #supplierRegisterForm select, #supplierRegisterForm textarea"

    );



formInputs.forEach(

    (input) => {


        input.addEventListener(

            "input",

            function() {


                clearError();


            }

        );


    }

);




// ==========================================================
// Start Supplier Registration
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {


        initializeSupplierRegistration();


    }

);




// ==========================================================
// End Part 9
// ==========================================================


// ==========================================================
// Part 10
// Final Polish & Exports
// ==========================================================


// ==========================================================
// Prevent Accidental Double Submission
// ==========================================================

window.addEventListener(

    "beforeunload",

    () => {


        if (isSubmitting) {


            isSubmitting = false;


        }


    }

);




// ==========================================================
// Global Error Protection
// ==========================================================

window.addEventListener(

    "error",

    (event) => {


        console.error(

            "Supplier registration error:",

            event.error

        );


    }

);




// ==========================================================
// Export Functions
// ==========================================================

export {


    validateSupplierForm,

    loadCounties,

    loadTowns,

    uploadSupplierLogo,

    createSupplierAccount,

    createSupplierProfile,

    handleSupplierRegistration

};



// ==========================================================
// Supplier Register JS Complete
// ==========================================================