// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/edit-product.js
// Version: 2.0.0
//
// Supplier Product Editor
// ==========================================================

import {

    auth,

    db,

    storage,

    now

} from "./firebase.js";

import {

    onAuthStateChanged

}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {

    doc,

    getDoc,

    collection

}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {

    ref,

    deleteObject

}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// ==========================================================
// Firestore Collections
// ==========================================================

const productsRef =

    collection(

        db,

        "products"

    );

// ==========================================================
// DOM
// ==========================================================

const form =
    document.getElementById("editProductForm");

const loader =
    document.getElementById("pageLoader");

const saveButton =
    document.getElementById("saveProduct");

const cancelButton =
    document.getElementById("cancelEdit");

const imagePreview =
    document.getElementById("imagePreview");

const imageInput =
    document.getElementById("productImages");

const progressContainer =
    document.getElementById("uploadProgress");

const progressBar =
    document.getElementById("uploadProgressBar");

const progressLabel =
    document.getElementById("uploadStatus");

// ==========================================================
// Form Fields
// ==========================================================

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

const description =
    document.getElementById("description");

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

const deliveryAvailable =
    document.getElementById("deliveryAvailable");

// ==========================================================
// State
// ==========================================================

let currentUser = null;

let supplier = null;

let product = null;

let saving = false;

let existingImages = [];

let newImages = [];

let removedImages = [];

let originalSlug = "";

// ==========================================================
// Configuration
// ==========================================================

const MAX_IMAGES = 8;

const MAX_IMAGE_SIZE =

    5 * 1024 * 1024;

// ==========================================================
// Product ID
// Internal pages use document IDs
// ==========================================================

function getProductId() {

    const params =

        new URLSearchParams(

            location.search

        );

    return params.get("id");

}

// ==========================================================
// Loading
// ==========================================================

function showLoader() {

    loader?.classList.remove(

        "d-none"

    );

    form?.classList.add(

        "d-none"

    );

}

function hideLoader() {

    loader?.classList.add(

        "d-none"

    );

    form?.classList.remove(

        "d-none"

    );

}

// ==========================================================
// Saving State
// ==========================================================

function setSaving(state) {

    saving = state;

    saveButton.disabled = state;

    cancelButton.disabled = state;

}

// ==========================================================
// Progress
// ==========================================================

function showProgress(

    percent,

    message

) {

    progressContainer?.classList.remove(

        "d-none"

    );

    if (progressBar) {

        progressBar.style.width =

            `${percent}%`;

    }

    if (progressLabel) {

        progressLabel.textContent =

            message;

    }

}

function hideProgress() {

    progressContainer?.classList.add(

        "d-none"

    );

}

// ==========================================================
// Supplier
// ==========================================================

async function loadSupplier(uid) {

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

    supplier =

        snapshot.data();

    if (

        supplier.status !==

        "approved"

    ) {

        throw new Error(

            "Supplier account is awaiting approval."

        );

    }

}

// ==========================================================
// Product
// ==========================================================

async function loadProduct() {

    const id =

        getProductId();

    if (!id) {

        throw new Error(

            "Missing product ID."

        );

    }

    const snapshot =

        await getDoc(

            doc(

                db,

                "products",

                id

            )

        );

    if (!snapshot.exists()) {

        throw new Error(

            "Product not found."

        );

    }

    product = {

        id: snapshot.id,

        ...snapshot.data()

    };

    if (

        product.supplierId !==

        currentUser.uid

    ) {

        throw new Error(

            "You are not allowed to edit this product."

        );

    }

    originalSlug =

        product.slug;

    existingImages =

        [...(product.images || [])];

}

// ==========================================================
// Authentication
// ==========================================================

onAuthStateChanged(

    auth,

    async (user) => {

        if (!user) {

            location.replace(

                "/login"

            );

            return;

        }

        currentUser = user;

        showLoader();

        try {

            await loadSupplier(

                user.uid

            );

            await loadProduct();

            hideLoader();

        }

        catch (error) {

            console.error(error);

            alert(error.message);

            location.replace(

                "/supplier/products"

            );

        }

    }

);

// ==========================================================
// Kenya Gas Marketplace
// Edit Product
// Part 2 - Form, Validation & Images
// ==========================================================

// ==========================================================
// Constants
// ==========================================================

const ALLOWED_IMAGE_TYPES = [

    "image/jpeg",

    "image/png",

    "image/webp"

];

const MAX_PRODUCT_NAME = 120;

const MAX_DESCRIPTION = 3000;

// ==========================================================
// Populate Form
// ==========================================================

function populateForm() {

    productName.value =
        product.productName || "";

    brand.value =
        product.brand || "";

    category.value =
        product.category || "";

    cylinderSize.value =
        product.cylinderSize || "";

    gasType.value =
        product.gasType || "";

    description.value =
        product.description || "";

    price.value =
        product.price || "";

    originalPrice.value =
        product.originalPrice || "";

    stock.value =
        product.stock || "";

    county.value =
        product.county || "";

    town.value =
        product.town || "";

    deliveryAvailable.checked =
        Boolean(
            product.deliveryAvailable
        );

    renderExistingImages();

}

// ==========================================================
// Slug Generator
// ==========================================================

function generateSlug(text) {

    return String(text)

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
// Slug Logic
// ==========================================================

function getUpdatedSlug() {

    if (

        product.productName ===

        productName.value.trim()

    ) {

        return originalSlug;

    }

    return generateSlug(

        productName.value

    );

}

// ==========================================================
// Existing Images
// ==========================================================

function renderExistingImages() {

    imagePreview.replaceChildren();

    existingImages.forEach(

        (url, index) => {

            const card =

                document.createElement(

                    "div"

                );

            card.className =

                "image-preview-card";

            card.innerHTML = `

<div class="image-preview-wrapper">

<img

src="${url}"

class="img-fluid"

loading="lazy">

<button

type="button"

class="remove-existing"

data-index="${index}">

<i class="fas fa-trash"></i>

</button>

</div>

`;

            imagePreview.appendChild(

                card

            );

        }

    );

    renderNewImages();

}

// ==========================================================
// New Images
// ==========================================================

function renderNewImages() {

    newImages.forEach(

        (file, index) => {

            const reader =

                new FileReader();

            reader.onload =

                (event) => {

                    const card =

                        document.createElement(

                            "div"

                        );

                    card.className =

                        "image-preview-card";

                    card.innerHTML = `

<div class="image-preview-wrapper">

<img

src="${event.target.result}"

loading="lazy">

<button

type="button"

class="remove-new"

data-index="${index}">

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
// Select Images
// ==========================================================

imageInput?.addEventListener(

    "change",

    (event) => {

        const files =

            Array.from(

                event.target.files

            );

        for (

            const file of files

        ) {

            if (

                !ALLOWED_IMAGE_TYPES.includes(

                    file.type

                )

            ) {

                continue;

            }

            if (

                file.size >

                MAX_IMAGE_SIZE

            ) {

                continue;

            }

            if (

                existingImages.length +

                newImages.length >=

                MAX_IMAGES

            ) {

                break;

            }

            newImages.push(

                file

            );

        }

        imageInput.value = "";

        renderExistingImages();

    }

);

// ==========================================================
// Remove Images
// ==========================================================

imagePreview?.addEventListener(

    "click",

    (event) => {

        const existing =

            event.target.closest(

                ".remove-existing"

            );

        if (existing) {

            const index =

                Number(

                    existing.dataset.index

                );

            removedImages.push(

                existingImages[index]

            );

            existingImages.splice(

                index,

                1

            );

            renderExistingImages();

            return;

        }

        const added =

            event.target.closest(

                ".remove-new"

            );

        if (added) {

            newImages.splice(

                Number(

                    added.dataset.index

                ),

                1

            );

            renderExistingImages();

        }

    }

);

// ==========================================================
// Validation
// ==========================================================

function validateForm() {

    if (

        !productName.value.trim()

    ) {

        alert(

            "Product name is required."

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

        Number(price.value) <= 0

    ) {

        alert(

            "Invalid price."

        );

        return false;

    }

    if (

        Number(stock.value) < 0

    ) {

        alert(

            "Invalid stock."

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

        existingImages.length +

        newImages.length === 0

    ) {

        alert(

            "Upload at least one product image."

        );

        return false;

    }

    return true;

}

// ==========================================================
// Kenya Gas Marketplace
// Edit Product
// Part 3 - Storage Image Management
// ==========================================================

import {

    uploadBytesResumable,

    getDownloadURL

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


// ==========================================================
// Upload New Images
// ==========================================================

async function uploadNewImages() {

    const uploadedURLs = [];

    if (!newImages.length) {

        return uploadedURLs;

    }


    for (

        let index = 0;

        index < newImages.length;

        index++

    ) {

        const file =

            newImages[index];


        const extension =

            file.name

                .split(".")

                .pop()

                .toLowerCase();


        const filePath =

            `products/${currentUser.uid}/${product.id}/${Date.now()}-${index}.${extension}`;


        const storageReference =

            ref(

                storage,

                filePath

            );


        const uploadTask =

            uploadBytesResumable(

                storageReference,

                file

            );


        const url =

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

                                `Uploading image ${index + 1} of ${newImages.length}`

                            );


                        },


                        (error) => {

                            reject(error);

                        },


                        async () => {

                            const downloadURL =

                                await getDownloadURL(

                                    uploadTask.snapshot.ref

                                );


                            resolve(

                                downloadURL

                            );

                        }

                    );


                }

            );


        uploadedURLs.push(

            url

        );

    }


    return uploadedURLs;

}



// ==========================================================
// Delete Removed Images
// ==========================================================

async function deleteRemovedImages() {


    if (!removedImages.length) {

        return;

    }


    for (

        const imageURL of removedImages

    ) {


        try {


            const imageRef =

                ref(

                    storage,

                    imageURL

                );


            await deleteObject(

                imageRef

            );


        }

        catch (error) {


            console.warn(

                "Unable to delete image:",

                error

            );


        }


    }

}



// ==========================================================
// Prepare Final Images
// ==========================================================

async function prepareProductImages() {


    showProgress(

        0,

        "Preparing images..."

    );


    const uploadedImages =

        await uploadNewImages();


    const finalImages = [

        ...existingImages,

        ...uploadedImages

    ];


    await deleteRemovedImages();


    hideProgress();


    return finalImages;

}

// ==========================================================
// Kenya Gas Marketplace
// Edit Product
// Part 4 - Firestore Update
// ==========================================================

import {

    setDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================================
// Build Search Keywords
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


    const keywords = new Set();


    fields.forEach(

        (field) => {


            const value =

                String(field || "")

                .toLowerCase()

                .trim();


            if (!value) {

                return;

            }


            const words =

                value.split(/\s+/);


            words.forEach(

                (word) => {


                    for (

                        let i = 1;

                        i <= word.length;

                        i++

                    ) {


                        keywords.add(

                            word.substring(

                                0,

                                i

                            )

                        );


                    }


                }

            );


        }

    );


    return [

        ...keywords

    ];

}


// ==========================================================
// Calculate Discount
// ==========================================================

function calculateDiscount() {


    const sellingPrice =

        Number(

            price.value

        );


    const oldPrice =

        Number(

            originalPrice.value ||

            sellingPrice

        );


    if (

        oldPrice <= sellingPrice

    ) {

        return 0;

    }


    return Math.round(

        (

            (

                oldPrice -

                sellingPrice

            )

            /

            oldPrice

        )

        *

        100

    );

}



// ==========================================================
// Update Product
// ==========================================================

async function updateProduct() {


    if (saving) {

        return;

    }


    if (!validateForm()) {

        return;

    }


    setSaving(true);


    try {


        showProgress(

            0,

            "Preparing update..."

        );


        const images =

            await prepareProductImages();



        const updatedProduct = {


            ...product,


            productName:

                productName.value.trim(),


            slug:

                getUpdatedSlug(),


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

                Number(

                    price.value

                ),


            originalPrice:

                Number(

                    originalPrice.value ||

                    price.value

                ),


            discountPercentage:

                calculateDiscount(),


            stock:

                Number(

                    stock.value

                ),


            county:

                county.value,


            town:

                town.value,


            deliveryAvailable:

                deliveryAvailable.checked,


            images,


            searchKeywords:

                buildSearchKeywords(),


            updatedAt:

                serverTimestamp()

        };



        await setDoc(

            doc(

                db,

                "products",

                product.id

            ),

            updatedProduct,

            {

                merge:true

            }

        );


        showProgress(

            100,

            "Product updated successfully."

        );


        return true;


    }


    catch(error) {


        console.error(

            "Update failed:",

            error

        );


        alert(

            "Unable to update product. Please try again."

        );


        return false;


    }


    finally {


        setSaving(false);


    }


}

// ==========================================================
// Kenya Gas Marketplace
// Edit Product
// Part 5 - Final Controls & Initialization
// ==========================================================


// ==========================================================
// Success Redirect
// ==========================================================

function handleUpdateSuccess() {

    window.location.replace(

        `/product/${getUpdatedSlug()}`

    );

}


// ==========================================================
// Submit Handler
// ==========================================================

form?.addEventListener(

    "submit",

    async (event) => {


        event.preventDefault();


        if (saving) {

            return;

        }


        const success =

            await updateProduct();


        if (success) {


            setTimeout(

                () => {

                    handleUpdateSuccess();

                },

                800

            );


        }


    }

);


// ==========================================================
// Cancel Editing
// ==========================================================

cancelButton?.addEventListener(

    "click",

    (event) => {


        event.preventDefault();


        if (saving) {

            return;

        }


        const confirmExit =

            confirm(

                "Discard changes and return?"

            );


        if (confirmExit) {


            window.location.replace(

                "/supplier/products"

            );


        }


    }

);



// ==========================================================
// Prevent Data Loss
// ==========================================================

let formChanged = false;


form?.addEventListener(

    "input",

    () => {

        formChanged = true;

    }

);



window.addEventListener(

    "beforeunload",

    (event) => {


        if (

            formChanged &&

            !saving

        ) {


            event.preventDefault();

            event.returnValue = "";

        }


    }

);



// ==========================================================
// Initialize Editor
// ==========================================================

async function initializeEditor() {


    try {


        await new Promise(

            (resolve) => {


                const check =

                    setInterval(

                        () => {


                            if (product) {


                                clearInterval(

                                    check

                                );


                                resolve();

                            }


                        },

                        100

                    );


            }

        );


        populateForm();


        hideLoader();


    }


    catch(error) {


        console.error(

            error

        );


    }


}


// ==========================================================
// DOM Ready
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    initializeEditor

);