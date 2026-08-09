// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/supplier-product-form.js
// Version: 1.0.1
//
// Supplier Product Registration Controller
// ==========================================================

"use strict";

// ==========================================================
// Firebase References
// (Loaded from firebase.js)
// ==========================================================

// auth
// db
// storage
// now()

// ==========================================================
// DOM Elements
// ==========================================================

const productForm =
    document.getElementById("productForm");

const productName =
    document.getElementById("productName");

const brand =
    document.getElementById("brand");

const cylinderSize =
    document.getElementById("cylinderSize");

const category =
    document.getElementById("category");

const price =
    document.getElementById("price");

const oldPrice =
    document.getElementById("oldPrice");

const stock =
    document.getElementById("stock");

const sku =
    document.getElementById("sku");

const inStock =
    document.getElementById("inStock");

const productImages =
    document.getElementById("productImages");

const imagePreview =
    document.getElementById("imagePreview");

const description =
    document.getElementById("description");

const safetyInformation =
    document.getElementById("safetyInformation");

const deliveryAvailable =
    document.getElementById("deliveryAvailable");

const deliveryFee =
    document.getElementById("deliveryFee");

const deliveryTime =
    document.getElementById("deliveryTime");

const county =
    document.getElementById("county");

const town =
    document.getElementById("town");

const location =
    document.getElementById("location");

const featuredProduct =
    document.getElementById("featuredProduct");

const published =
    document.getElementById("published");

const acceptReturns =
    document.getElementById("acceptReturns");

const productTags =
    document.getElementById("productTags");

const saveProductButton =
    document.getElementById("saveProductButton");

const saveProductSpinner =
    document.getElementById("saveProductSpinner");

const formError =
    document.getElementById("formError");

const formSuccess =
    document.getElementById("formSuccess");

const formMessage =
    document.getElementById("formMessage");

// ==========================================================
// Configuration
// ==========================================================

const MAX_IMAGES = 5;

const MAX_IMAGE_SIZE =
    2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

// ==========================================================
// Runtime Variables
// ==========================================================

let selectedImages = [];
let submitting = false;

// ==========================================================
// Loading State
// ==========================================================

function setLoading(loading) {
    if (saveProductButton) {
        saveProductButton.disabled = loading;
    }
    if (saveProductSpinner) {
        saveProductSpinner.classList.toggle(
            "d-none",
            !loading
        );
    }
}

// ==========================================================
// Error Handling
// ==========================================================

function showError(message) {
    if (!formError) {
        alert(message);
        return;
    }
    formError.textContent = message;
    formError.classList.remove(
        "d-none"
    );
    if (formSuccess) {
        formSuccess.classList.add(
            "d-none"
        );
    }
    if (formMessage) {
        formMessage.classList.add(
            "d-none"
        );
    }
}

// ==========================================================
// Success Message
// ==========================================================

function showSuccess(message) {
    if (!formSuccess) {
        alert(message);
        return;
    }
    formSuccess.textContent = message;
    formSuccess.classList.remove(
        "d-none"
    );
    if (formError) {
        formError.classList.add(
            "d-none"
        );
    }
    if (formMessage) {
        formMessage.className =
            "alert alert-success";
        formMessage.textContent =
            message;
        formMessage.classList.remove(
            "d-none"
        );
    }
}

// ==========================================================
// Clear Messages
// ==========================================================

function clearMessages() {
    if (formError) {
        formError.classList.add(
            "d-none"
        );
        formError.textContent = "";
    }
    if (formSuccess) {
        formSuccess.classList.add(
            "d-none"
        );
        formSuccess.textContent = "";
    }
    if (formMessage) {
        formMessage.classList.add(
            "d-none"
        );
        formMessage.textContent = "";
        formMessage.className =
            "alert d-none";
    }
}

// ==========================================================
// Reset Form Status
// ==========================================================

function resetFormState() {
    clearMessages();
    setLoading(false);
    submitting = false;
}

// ==========================================================
// Product Image Preview
// ==========================================================

if (productImages) {
    productImages.addEventListener(
        "change",
        previewImages
    );
}

function previewImages() {
    clearMessages();
    selectedImages = [];
    if (imagePreview) {
        imagePreview.innerHTML = "";
    }
    const files =
        Array.from(
            productImages.files
        );
    if (files.length === 0) {
        return;
    }
    if (files.length > MAX_IMAGES) {
        showError(
            `You can upload a maximum of ${MAX_IMAGES} images.`
        );
        productImages.value = "";
        return;
    }
    for (const file of files) {
        if (
            !ALLOWED_IMAGE_TYPES.includes(
                file.type
            )
        ) {
            showError(
                `${file.name} is not a supported image.`
            );
            productImages.value = "";
            imagePreview.innerHTML = "";
            return;
        }

        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {
            showError(
                `${file.name} exceeds the 2 MB limit.`
            );
            productImages.value = "";
            imagePreview.innerHTML = "";
            return;
        }

        selectedImages.push(file);
        createImagePreview(file);
    }
}

// ==========================================================
// Create Preview Card
// ==========================================================

function createImagePreview(file) {
    const reader =
        new FileReader();
    reader.onload =
        function (event) {
            const card =
                document.createElement(
                    "div"
                );
            card.className =
                "image-preview-item";
            const image =
                document.createElement(
                    "img"
                );
            image.src =
                event.target.result;
            image.alt =
                file.name;
            image.loading =
                "lazy";
            card.appendChild(
                image
            );
            imagePreview.appendChild(
                card
            );
        };
    reader.readAsDataURL(
        file
    );
}

// ==========================================================
// Clear Image Selection
// ==========================================================

function clearImagePreview() {
    selectedImages = [];
    if (productImages) {
        productImages.value = "";
    }
    if (imagePreview) {
        imagePreview.innerHTML = "";
    }
}

// ==========================================================
// Validate Product Form
// ==========================================================

function validateForm() {
    clearMessages();

    if (!productName.value.trim()) {
        showError(
            "Product name is required."
        );
        productName.focus();
        return false;
    }

    if (!brand.value) {
        showError(
            "Please select a product brand."
        );
        brand.focus();
        return false;
    }

    if (!cylinderSize.value) {
        showError(
            "Please select a cylinder size."
        );
        cylinderSize.focus();
        return false;
    }

    if (!category.value) {
        showError(
            "Please select a product category."
        );
        category.focus();
        return false;
    }

    if (
        !price.value ||
        Number(price.value) <= 0
    ) {
        showError(
            "Enter a valid selling price."
        );
        price.focus();
        return false;
    }

    if (
        stock.value === "" ||
        Number(stock.value) < 0
    ) {
        showError(
            "Enter a valid stock quantity."
        );
        stock.focus();
        return false;
    }

    if (
        selectedImages.length === 0
    ) {
        showError(
            "Upload at least one product image."
        );
        productImages.focus();
        return false;
    }

    if (
        !description.value.trim()
    ) {
        showError(
            "Product description is required."
        );
        description.focus();
        return false;
    }

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

    if (
        !location.value.trim()
    ) {
        showError(
            "Enter the product location."
        );
        location.focus();
        return false;
    }

    return true;
}

// ==========================================================
// Live Validation
// ==========================================================

[
    productName,
    brand,
    cylinderSize,
    category,
    price,
    stock,
    description,
    county,
    town,
    location
].forEach(
    (field) => {
        if (!field) return;
        field.addEventListener(
            "input",
            clearMessages
        );
        field.addEventListener(
            "change",
            clearMessages
        );
    }
);

// ==========================================================
// Load Counties
// ==========================================================

function loadCounties() {
    if (!county) return;
    county.innerHTML =
        '<option value="">Select County</option>';
    if (
        typeof counties === "undefined" ||
        !Array.isArray(counties)
    ) {
        console.error(
            "counties.js not loaded."
        );
        return;
    }
    counties.forEach(
        (item) => {
            const option =
                document.createElement(
                    "option"
                );
            option.value =
                item.name;
            option.textContent =
                item.name;
            county.appendChild(
                option
            );
        }
    );
}

// ==========================================================
// Load Towns
// ==========================================================

function loadTowns(
    countyName
) {
    if (!town) return;
    town.innerHTML =
        '<option value="">Select Town</option>';
    if (
        !countyName ||
        typeof counties === "undefined"
    ) {
        return;
    }
    const selectedCounty =
        counties.find(
            (item) =>
                item.name === countyName
        );
    if (
        !selectedCounty ||
        !selectedCounty.towns
    ) {
        return;
    }
    selectedCounty.towns.forEach(
        (townName) => {
            const option =
                document.createElement(
                    "option"
                );
            option.value =
                townName;
            option.textContent =
                townName;
            town.appendChild(
                option
            );
        }
    );
}

// ==========================================================
// County Change Event
// ==========================================================

if (county) {
    county.addEventListener(
        "change",
        function () {
            loadTowns(
                this.value
            );
        }
    );
}

// ==========================================================
// Upload Product Images To Firebase Storage
// ==========================================================

async function uploadProductImages(uid) {
    if (selectedImages.length === 0) {
        return [];
    }
    const imageURLs = [];
    for (
        let i = 0;
        i < selectedImages.length;
        i++
    ) {
        const file =
            selectedImages[i];
        const extension =
            file.name
            .split(".")
            .pop()
            .toLowerCase();
        const storageRef = ref(
            storage,
            `products/${uid}/${Date.now()}_${i}.${extension}`
        );

        await uploadBytes(
            storageRef,
            file,
            {
                contentType:
                    file.type
            }
        );

        const downloadURL =
            await getDownloadURL(
                storageRef
            );
        imageURLs.push(
            downloadURL
        );
    }
    return imageURLs;
}

// ==========================================================
// Reset Product Images
// ==========================================================

function resetImages() {
    selectedImages = [];
    if (productImages) {
        productImages.value = "";
    }
    if (imagePreview) {
        imagePreview.innerHTML = "";
    }
}

// ==========================================================
// Save Product
// ==========================================================

async function saveProduct() {
    if (!validateForm()) {
        return;
    }

    clearMessages();
    setLoading(true);

    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error(
                "You must be logged in."
            );
        }

        const imageURLs =
            await uploadProductImages(
                user.uid
            );

        const productRef =
            doc(
                collection(
                    db,
                    "products"
                )
            );

        await setDoc(
            productRef,
            {
                productId:
                    productRef.id,
                supplierId:
                    user.uid,
                productName:
                    productName.value.trim(),
                brand:
                    brand.value,
                category:
                    category.value,
                cylinderSize:
                    cylinderSize.value,
                description:
                    description.value.trim(),
                safetyInformation:
                    safetyInformation.value.trim(),
                price:
                    Number(
                        price.value
                    ),
                oldPrice:
                    oldPrice.value
                        ? Number(
                            oldPrice.value
                          )
                        : null,
                stock:
                    Number(
                        stock.value
                    ),
                sku:
                    sku.value.trim(),
                inStock:
                    inStock.checked,
                deliveryAvailable:
                    deliveryAvailable.checked,
                deliveryFee:
                    Number(
                        deliveryFee.value || 0
                    ),
                deliveryTime:
                    deliveryTime.value.trim(),
                county:
                    county.value,
                town:
                    town.value,
                location:
                    location.value.trim(),
                featured:
                    featuredProduct.checked,
                published:
                    published.checked,
                acceptReturns:
                    acceptReturns.checked,
                tags:
                    productTags.value
                        .split(",")
                        .map(
                            tag =>
                                tag.trim()
                        )
                        .filter(
                            tag =>
                                tag.length > 0
                        ),
                images:
                    imageURLs,
                rating: 0,
                totalReviews: 0,
                totalOrders: 0,
                views: 0,
                status: "active",
                createdAt:
                    now(),
                updatedAt:
                    now()
            }
        );

        showSuccess(
            "Product added successfully."
        );
        productForm.reset();
        resetImages();
        initializeForm();
    }
    catch (error) {
        console.error(error);
        showError(
            error.message ||
            "Failed to save product."
        );
    }
    finally {
        setLoading(false);
    }
}

// ==========================================================
// Submit Product
// ==========================================================

async function submitProduct(event) {
    event.preventDefault();
    if (submitting) {
        return;
    }
    submitting = true;
    try {
        await saveProduct();
    }
    finally {
        submitting = false;
    }
}

// ==========================================================
// Form Submission & Event Listeners
// ==========================================================

if (productForm) {
    productForm.addEventListener(
        "submit",
        submitProduct
    );
}

productForm?.addEventListener(
    "reset",
    () => {
        clearMessages();
        resetImages();
        setTimeout(
            () => {
                loadTowns(
                    county.value
                );
            },
            0
        );
    }
);

if (productName) {
    productName.addEventListener(
        "blur",
        () => {
            productName.value =
                productName.value
                .trim()
                .replace(/\s+/g, " ");
        }
    );
}

if (sku) {
    sku.addEventListener(
        "input",
        () => {
            sku.value =
                sku.value
                .toUpperCase()
                .replace(/\s+/g, "-");
        }
    );
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeForm();
    }
);

// ==========================================================
// Export
// ==========================================================

window.saveProduct = saveProduct;
window.resetProductImages = resetImages;
