// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/add-product.js
// Version: 1.0.0
//
// Supplier Product Creation
// ==========================================================

import {

    auth,

    db,

    storage,

    now

} from "./firebase.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {

    doc,

    getDoc,

    collection

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {

    ref,

    uploadBytesResumable,

    getDownloadURL

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// ==========================================================
// Firestore Collections
// ==========================================================

const productsRef = collection(

    db,

    "products"

);

// ==========================================================
// DOM Elements
// ==========================================================

const productForm =
    document.getElementById("addProductForm");

const submitButton =
    document.getElementById("submitProduct");

const resetButton =
    document.getElementById("resetProduct");

const uploadProgress =
    document.getElementById("uploadProgress");

const uploadProgressBar =
    document.getElementById("uploadProgressBar");

const uploadStatus =
    document.getElementById("uploadStatus");

const imageInput =
    document.getElementById("productImages");

const imagePreview =
    document.getElementById("imagePreview");

const productName =
    document.getElementById("productName");

const brand =
    document.getElementById("brand");

const category =
    document.getElementById("category");

const cylinderSize =
    document.getElementById("cylinderSize");

const gasType =
    document.getElementById("gasType");

const price =
    document.getElementById("price");

const originalPrice =
    document.getElementById("originalPrice");

const stock =
    document.getElementById("stock");

const county =
    document.getElementById("county");

const town =
    document.getElementById("town");

const description =
    document.getElementById("description");

// ==========================================================
// State
// ==========================================================

let currentUser = null;

let supplier = null;

let selectedImages = [];

let uploading = false;

// ==========================================================
// Helpers
// ==========================================================

function setLoading(state) {

    uploading = state;

    if (submitButton) {

        submitButton.disabled = state;

    }

    if (resetButton) {

        resetButton.disabled = state;

    }

}

function showProgress(value = 0, message = "Uploading...") {

    if (uploadProgress) {

        uploadProgress.classList.remove(

            "d-none"

        );

    }

    if (uploadProgressBar) {

        uploadProgressBar.style.width =

            `${value}%`;

        uploadProgressBar.setAttribute(

            "aria-valuenow",

            value

        );

    }

    if (uploadStatus) {

        uploadStatus.textContent =

            message;

    }

}

function hideProgress() {

    if (uploadProgress) {

        uploadProgress.classList.add(

            "d-none"

        );

    }

}

// ==========================================================
// Supplier Verification
// ==========================================================

async function loadSupplierProfile(uid) {

    const snapshot =

        await getDoc(

            doc(

                db,

                "suppliers",

                uid

            )

        );

    if (!snapshot.exists()) {

        throw new Error(

            "Supplier profile not found."

        );

    }

    supplier = snapshot.data();

    if (

        supplier.status !== "approved"

    ) {

        throw new Error(

            "Your supplier account is awaiting approval."

        );

    }

    return supplier;

}

// ==========================================================
// Authentication
// ==========================================================

onAuthStateChanged(

    auth,

    async (user) => {

        if (!user) {

            window.location.replace(

                "/login"

            );

            return;

        }

        try {

            currentUser = user;

            await loadSupplierProfile(

                user.uid

            );

            productForm?.classList.remove(

                "d-none"

            );

        }

        catch (error) {

            console.error(error);

            alert(

                error.message

            );

            window.location.replace(

                "/supplier/dashboard"

            );

        }

    }

);

// ==========================================================
// Kenya Gas Marketplace
// Add Product
// Part 2 - Validation & Slug
// ==========================================================

// ==========================================================
// Constants
// ==========================================================

const MAX_PRODUCT_NAME = 120;

const MAX_DESCRIPTION = 3000;

const MIN_PRICE = 1;

const MAX_IMAGES = 8;

// ==========================================================
// Slug Generator
// ==========================================================

function generateSlug(text) {

    return String(text || "")

        .toLowerCase()

        .trim()

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .replace(/[^a-z0-9\s-]/g, "")

        .replace(/\s+/g, "-")

        .replace(/-+/g, "-")

        .replace(/^-|-$/g, "");

}

// ==========================================================
// Unique Slug
// ==========================================================

async function generateUniqueSlug() {

    let baseSlug = generateSlug(

        productName.value

    );

    if (cylinderSize.value) {

        baseSlug += "-" +

        generateSlug(

            cylinderSize.value

        );

    }

    if (brand.value) {

        baseSlug += "-" +

        generateSlug(

            brand.value

        );

    }

    let slug = baseSlug;

    let counter = 1;

    while (true) {

        const snapshot = await getDocs(

            query(

                productsRef,

                where(

                    "slug",

                    "==",

                    slug

                ),

                limit(1)

            )

        );

        if (snapshot.empty) {

            return slug;

        }

        counter++;

        slug =

            `${baseSlug}-${counter}`;

    }

}

// ==========================================================
// Search Keywords
// ==========================================================

function buildSearchKeywords() {

    const fields = [

        productName.value,

        brand.value,

        category.value,

        cylinderSize.value,

        gasType.value,

        county.value,

        town.value,

        supplier.businessName

    ];

    const keywords =

        new Set();

    fields.forEach((field) => {

        const value =

            String(field || "")

            .toLowerCase()

            .trim();

        if (!value) return;

        const words =

            value.split(/\s+/);

        words.forEach((word) => {

            for (

                let i = 1;

                i <= word.length;

                i++

            ) {

                keywords.add(

                    word.substring(0, i)

                );

            }

        });

    });

    return [...keywords];

}

// ==========================================================
// Validation
// ==========================================================

function validateProduct() {

    if (

        !productName.value.trim()

    ) {

        alert(

            "Enter a product name."

        );

        productName.focus();

        return false;

    }

    if (

        productName.value.length >

        MAX_PRODUCT_NAME

    ) {

        alert(

            "Product name is too long."

        );

        return false;

    }

    if (

        !brand.value

    ) {

        alert(

            "Select a brand."

        );

        return false;

    }

    if (

        !category.value

    ) {

        alert(

            "Select a category."

        );

        return false;

    }

    if (

        Number(price.value) <

        MIN_PRICE

    ) {

        alert(

            "Invalid selling price."

        );

        return false;

    }

    if (

        Number(originalPrice.value) &&

        Number(originalPrice.value) <

        Number(price.value)

    ) {

        alert(

            "Original price must be greater than or equal to the selling price."

        );

        return false;

    }

    if (

        Number(stock.value) < 0

    ) {

        alert(

            "Invalid stock quantity."

        );

        return false;

    }

    if (

        description.value.length >

        MAX_DESCRIPTION

    ) {

        alert(

            "Description is too long."

        );

        return false;

    }

    if (

        selectedImages.length === 0

    ) {

        alert(

            "Upload at least one product image."

        );

        return false;

    }

    if (

        selectedImages.length >

        MAX_IMAGES

    ) {

        alert(

            `Maximum ${MAX_IMAGES} images allowed.`

        );

        return false;

    }

    return true;

}

// ==========================================================
// Auto-format Product Name
// ==========================================================

productName?.addEventListener(

    "blur",

    () => {

        productName.value =

            productName.value

            .trim()

            .replace(/\s+/g, " ");

    }

);

// ==========================================================
// Auto-format Description
// ==========================================================

description?.addEventListener(

    "blur",

    () => {

        description.value =

            description.value.trim();

    }

);

// ==========================================================
// Kenya Gas Marketplace
// Add Product
// Part 3 - Images & Storage
// ==========================================================

// ==========================================================
// Configuration
// ==========================================================

const MAX_IMAGE_SIZE =

    5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = [

    "image/jpeg",

    "image/png",

    "image/webp"

];

// ==========================================================
// Image Selection
// ==========================================================

imageInput?.addEventListener(

    "change",

    handleImageSelection

);

function handleImageSelection(event) {

    const files =

        Array.from(

            event.target.files || []

        );

    if (!files.length) {

        return;

    }

    if (

        selectedImages.length +

        files.length >

        MAX_IMAGES

    ) {

        alert(

            `You can upload a maximum of ${MAX_IMAGES} images.`

        );

        imageInput.value = "";

        return;

    }

    for (const file of files) {

        if (

            !ALLOWED_IMAGE_TYPES.includes(

                file.type

            )

        ) {

            alert(

                `${file.name} is not a supported image.`

            );

            continue;

        }

        if (

            file.size >

            MAX_IMAGE_SIZE

        ) {

            alert(

                `${file.name} exceeds the 5 MB limit.`

            );

            continue;

        }

        selectedImages.push(file);

    }

    imageInput.value = "";

    renderImagePreview();

}

// ==========================================================
// Image Preview
// ==========================================================

function renderImagePreview() {

    if (!imagePreview) {

        return;

    }

    imagePreview.replaceChildren();

    selectedImages.forEach(

        (file, index) => {

            const reader =

                new FileReader();

            reader.onload =

                ({ target }) => {

                    const card =

                        document.createElement(

                            "div"

                        );

                    card.className =

                        "image-preview-card";

                    card.innerHTML = `

<div class="image-preview-wrapper">

<img

src="${target.result}"

alt="${file.name}"

loading="lazy">

<button

type="button"

class="remove-image"

data-index="${index}"

aria-label="Remove image">

<i class="fas fa-times"></i>

</button>

</div>

`;

                    imagePreview.appendChild(

                        card

                    );

                };

            reader.readAsDataURL(

                file

            );

        }

    );

}

// ==========================================================
// Remove Image
// ==========================================================

imagePreview?.addEventListener(

    "click",

    (event) => {

        const button =

            event.target.closest(

                ".remove-image"

            );

        if (!button) {

            return;

        }

        const index =

            Number(

                button.dataset.index

            );

        selectedImages.splice(

            index,

            1

        );

        renderImagePreview();

    }

);

// ==========================================================
// Upload Images
// ==========================================================

async function uploadProductImages(

    productId

) {

    const urls = [];

    for (

        let index = 0;

        index <

        selectedImages.length;

        index++

    ) {

        const file =

            selectedImages[index];

        const extension =

            file.name

                .split(".")

                .pop()

                .toLowerCase();

        const storagePath =

            `products/${currentUser.uid}/${productId}/${index + 1}.${extension}`;

        const storageReference =

            ref(

                storage,

                storagePath

            );

        const uploadTask =

            uploadBytesResumable(

                storageReference,

                file,

                {

                    contentType:

                        file.type

                }

            );

        const downloadURL =

            await new Promise(

                (

                    resolve,

                    reject

                ) => {

                    uploadTask.on(

                        "state_changed",

                        (snapshot) => {

                            const progress =

                                Math.round(

                                    (

                                        snapshot.bytesTransferred /

                                        snapshot.totalBytes

                                    ) * 100

                                );

                            showProgress(

                                progress,

                                `Uploading image ${index + 1} of ${selectedImages.length}`

                            );

                        },

                        reject,

                        async () => {

                            resolve(

                                await getDownloadURL(

                                    uploadTask.snapshot.ref

                                )

                            );

                        }

                    );

                }

            );

        urls.push(downloadURL);

    }

    hideProgress();

    return urls;

}

// ==========================================================
// Kenya Gas Marketplace
// Add Product
// Part 4 - Firestore Product Creation
// ==========================================================

import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    limit,
    getDocs,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// Create Product
// ==========================================================

async function createProduct() {

    if (uploading) {

        return;

    }

    if (!validateProduct()) {

        return;

    }

    setLoading(true);

    showProgress(

        0,

        "Preparing product..."

    );

    try {

        // --------------------------------------------------
        // Generate Product ID
        // --------------------------------------------------

        const productRef =

            doc(productsRef);

        const productId =

            productRef.id;

        // --------------------------------------------------
        // Slug
        // --------------------------------------------------

        const slug =

            await generateUniqueSlug();

        // --------------------------------------------------
        // Upload Images
        // --------------------------------------------------

        const imageURLs =

            await uploadProductImages(

                productId

            );

        // --------------------------------------------------
        // Discount
        // --------------------------------------------------

        const sellingPrice =

            Number(price.value);

        const regularPrice =

            Number(

                originalPrice.value ||

                sellingPrice

            );

        const discount =

            regularPrice >

            sellingPrice

            ? Math.round(

                (

                    (

                        regularPrice -

                        sellingPrice

                    ) /

                    regularPrice

                ) * 100

            )

            : 0;

        // --------------------------------------------------
        // Product Document
        // --------------------------------------------------

        const productData = {

            supplierId:

                currentUser.uid,

            supplierName:

                supplier.businessName,

            supplierLogo:

                supplier.logoURL || "",

            supplierVerified:

                supplier.verified === true,

            productName:

                productName.value.trim(),

            slug,

            brand:

                brand.value,

            category:

                category.value,

            cylinderSize:

                cylinderSize.value,

            gasType:

                gasType.value,

            description:

                description.value.trim(),

            price:

                sellingPrice,

            originalPrice:

                regularPrice,

            discountPercentage:

                discount,

            currency:

                "KES",

            stock:

                Number(stock.value),

            lowStockThreshold:

                5,

            county:

                county.value,

            town:

                town.value,

            deliveryAvailable:

                true,

            rating: 0,

            totalReviews: 0,

            views: 0,

            featured: false,

            status: "active",

            images:

                imageURLs,

            searchKeywords:

                buildSearchKeywords(),

            createdAt:

                serverTimestamp(),

            updatedAt:

                serverTimestamp()

        };

        // --------------------------------------------------
        // Save Product
        // --------------------------------------------------

        await setDoc(

            productRef,

            productData

        );

        showProgress(

            100,

            "Product published successfully."

        );

        return {

    productId,

    slug

};

    }

    catch (error) {

        console.error(

            "Product creation failed:",

            error

        );

        alert(

            "Unable to publish the product. Please try again."

        );

        throw error;

    }

    finally {

        setLoading(false);

        hideProgress();

    }

}

// ==========================================================
// Kenya Gas Marketplace
// Add Product
// Part 5 - Final
// ==========================================================

// ==========================================================
// Reset Form
// ==========================================================

function resetProductForm() {

    productForm?.reset();

    selectedImages = [];

    if (imagePreview) {

        imagePreview.replaceChildren();

    }

    if (imageInput) {

        imageInput.value = "";

    }

    hideProgress();

}

// ==========================================================
// Success
// ==========================================================

function handleSuccess(result) {

    window.location.replace(

        `/product/${result.slug}`

    );

}

// ==========================================================
// Form Submission
// ==========================================================

productForm?.addEventListener(

    "submit",

    async (event) => {

        event.preventDefault();

        if (uploading) {

            return;

        }

        try {

            const result =

    await createProduct();

if (!result) {

    return;

}

resetProductForm();

handleSuccess(

    result

);
        
}

        catch (error) {

            console.error(

                error

            );

        }

    }

);

// ==========================================================
// Reset Button
// ==========================================================

resetButton?.addEventListener(

    "click",

    (event) => {

        event.preventDefault();

        if (uploading) {

            return;

        }

        const confirmed =

            confirm(

                "Discard all entered product information?"

            );

        if (!confirmed) {

            return;

        }

        resetProductForm();

    }

);

// ==========================================================
// Prevent Leaving During Upload
// ==========================================================

window.addEventListener(

    "beforeunload",

    (event) => {

        if (!uploading) {

            return;

        }

        event.preventDefault();

        event.returnValue = "";

    }

);

// ==========================================================
// Keyboard Shortcut
// Ctrl + Enter = Submit
// ==========================================================

document.addEventListener(

    "keydown",

    (event) => {

        if (

            event.ctrlKey &&

            event.key === "Enter"

        ) {

            event.preventDefault();

            productForm?.requestSubmit();

        }

    }

);

// ==========================================================
// Initialize
// ==========================================================

function initializeAddProduct() {

    hideProgress();

    setLoading(false);

}

document.addEventListener(

    "DOMContentLoaded",

    initializeAddProduct

);