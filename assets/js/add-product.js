// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/supplier-product-form.js
// Version: 2.0.0
//
// Supplier Product Creation & Form Handling
// ==========================================================

import {
    auth,
    db,
    storage
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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

const productForm = document.getElementById("productForm");
const submitButton = document.getElementById("saveProductButton");
const submitSpinner = document.getElementById("saveProductSpinner");
const formError = document.getElementById("formError");
const formSuccess = document.getElementById("formSuccess");

const imageInput = document.getElementById("productImages");
const imagePreview = document.getElementById("imagePreview");

const productName = document.getElementById("productName");
const brand = document.getElementById("brand");
const category = document.getElementById("category");
const cylinderSize = document.getElementById("cylinderSize");
const price = document.getElementById("price");
const oldPrice = document.getElementById("oldPrice");
const stock = document.getElementById("stock");
const sku = document.getElementById("sku");
const inStock = document.getElementById("inStock");
const description = document.getElementById("description");
const safetyInformation = document.getElementById("safetyInformation");
const deliveryAvailable = document.getElementById("deliveryAvailable");
const deliveryFee = document.getElementById("deliveryFee");
const deliveryTime = document.getElementById("deliveryTime");
const county = document.getElementById("county");
const town = document.getElementById("town");
const locationInput = document.getElementById("location");
const featuredProduct = document.getElementById("featuredProduct");
const published = document.getElementById("published");
const acceptReturns = document.getElementById("acceptReturns");
const productTags = document.getElementById("productTags");

// ==========================================================
// State
// ==========================================================

let currentUser = null;
let supplier = null;
let selectedImages = [];
let uploading = false;

// ==========================================================
// Constants
// ==========================================================

const MAX_PRODUCT_NAME = 120;
const MAX_DESCRIPTION = 3000;
const MIN_PRICE = 1;
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

// ==========================================================
// Helpers & UI Feedback
// ==========================================================

function setLoading(state) {
    uploading = state;
    if (submitButton) {
        submitButton.disabled = state;
    }
    if (submitSpinner) {
        if (state) {
            submitSpinner.classList.remove("d-none");
        } else {
            submitSpinner.classList.add("d-none");
        }
    }
}

function showError(message) {
    if (formError) {
        formError.textContent = message;
        formError.classList.remove("d-none");
    }
    if (formSuccess) {
        formSuccess.classList.add("d-none");
    }
}

function showSuccess(message) {
    if (formSuccess) {
        formSuccess.textContent = message;
        formSuccess.classList.remove("d-none");
    }
    if (formError) {
        formError.classList.add("d-none");
    }
}

function hideAlerts() {
    if (formError) formError.classList.add("d-none");
    if (formSuccess) formSuccess.classList.add("d-none");
}

// ==========================================================
// Supplier Verification
// ==========================================================

async function loadSupplierProfile(uid) {
    const snapshot = await getDoc(
        doc(db, "suppliers", uid)
    );

    if (!snapshot.exists()) {
        throw new Error("Supplier profile not found.");
    }

    supplier = snapshot.data();

    if (supplier.status !== "approved") {
        throw new Error("Your supplier account is awaiting approval.");
    }

    return supplier;
}

// ==========================================================
// Authentication State
// ==========================================================

onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            window.location.replace("/login");
            return;
        }

        try {
            currentUser = user;
            await loadSupplierProfile(user.uid);
            productForm?.classList.remove("d-none");
        } catch (error) {
            console.error(error);
            alert(error.message);
            window.location.replace("/supplier/dashboard/");
        }
    }
);

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

async function generateUniqueSlug() {
    let baseSlug = generateSlug(productName.value);
    if (cylinderSize.value) {
        baseSlug += "-" + generateSlug(cylinderSize.value) + "kg";
    }
    if (brand.value) {
        baseSlug += "-" + generateSlug(brand.value);
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const snapshot = await getDocs(
            query(
                productsRef,
                where("slug", "==", slug),
                limit(1)
            )
        );

        if (snapshot.empty) {
            return slug;
        }

        counter++;
        slug = `${baseSlug}-${counter}`;
    }
}

// ==========================================================
// Search Keywords Builder
// ==========================================================

function buildSearchKeywords() {
    const fields = [
        productName?.value,
        brand?.value,
        category?.value,
        cylinderSize?.value,
        county?.value,
        town?.value,
        productTags?.value,
        supplier?.businessName
    ];

    const keywords = new Set();

    fields.forEach((field) => {
        const value = String(field || "").toLowerCase().trim();
        if (!value) return;

        const words = value.split(/[\s,]+/);
        words.forEach((word) => {
            for (let i = 1; i <= word.length; i++) {
                keywords.add(word.substring(0, i));
            }
        });
    });

    return [...keywords];
}

// ==========================================================
// Validation
// ==========================================================

function validateProduct() {
    hideAlerts();

    if (!productName.value.trim()) {
        showError("Enter a product name.");
        productName.focus();
        return false;
    }

    if (productName.value.length > MAX_PRODUCT_NAME) {
        showError(`Product name must be under ${MAX_PRODUCT_NAME} characters.`);
        productName.focus();
        return false;
    }

    if (!brand.value) {
        showError("Select a brand.");
        brand.focus();
        return false;
    }

    if (!cylinderSize.value) {
        showError("Select a cylinder size.");
        cylinderSize.focus();
        return false;
    }

    if (!category.value) {
        showError("Select a product category.");
        category.focus();
        return false;
    }

    if (Number(price.value) < MIN_PRICE) {
        showError("Enter a valid selling price.");
        price.focus();
        return false;
    }

    if (
        oldPrice.value &&
        Number(oldPrice.value) < Number(price.value)
    ) {
        showError("Previous price must be greater than or equal to selling price.");
        oldPrice.focus();
        return false;
    }

    if (Number(stock.value) < 0) {
        showError("Stock quantity cannot be negative.");
        stock.focus();
        return false;
    }

    if (description.value.length > MAX_DESCRIPTION) {
        showError("Description is too long.");
        description.focus();
        return false;
    }

    if (selectedImages.length === 0) {
        showError("Upload at least one product image.");
        imageInput.focus();
        return false;
    }

    if (selectedImages.length > MAX_IMAGES) {
        showError(`Maximum ${MAX_IMAGES} images allowed.`);
        return false;
    }

    if (!county.value) {
        showError("Select a county.");
        county.focus();
        return false;
    }

    if (!town.value) {
        showError("Select a town.");
        town.focus();
        return false;
    }

    if (!locationInput.value.trim()) {
        showError("Enter a physical address or pickup point.");
        locationInput.focus();
        return false;
    }

    return true;
}

// ==========================================================
// Image Handling & Preview
// ==========================================================

imageInput?.addEventListener("change", handleImageSelection);

function handleImageSelection(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (selectedImages.length + files.length > MAX_IMAGES) {
        alert(`You can upload a maximum of ${MAX_IMAGES} images.`);
        imageInput.value = "";
        return;
    }

    for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            alert(`${file.name} is not a supported image format (JPG, PNG, WEBP).`);
            continue;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            alert(`${file.name} exceeds the 5 MB limit.`);
            continue;
        }

        selectedImages.push(file);
    }

    imageInput.value = "";
    renderImagePreview();
}

function renderImagePreview() {
    if (!imagePreview) return;

    imagePreview.replaceChildren();

    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = ({ target }) => {
            const card = document.createElement("div");
            card.className = "image-preview-card";
            card.innerHTML = `
                <div class="image-preview-wrapper">
                    <img src="${target.result}" alt="${file.name}" loading="lazy">
                    <button type="button" class="remove-image" data-index="${index}" aria-label="Remove image">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            imagePreview.appendChild(card);
        };
        reader.readAsDataURL(file);
    });
}

imagePreview?.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-image");
    if (!button) return;

    const index = Number(button.dataset.index);
    selectedImages.splice(index, 1);
    renderImagePreview();
});

// ==========================================================
// Upload Images to Firebase Storage
// ==========================================================

async function uploadProductImages(productId) {
    const urls = [];

    for (let index = 0; index < selectedImages.length; index++) {
        const file = selectedImages[index];
        const extension = file.name.split(".").pop().toLowerCase();
        const storagePath = `products/${currentUser.uid}/${productId}/${index + 1}.${extension}`;
        const storageReference = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageReference, file, {
            contentType: file.type
        });

        const downloadURL = await new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                null,
                reject,
                async () => {
                    resolve(await getDownloadURL(uploadTask.snapshot.ref));
                }
            );
        });

        urls.push(downloadURL);
    }

    return urls;
}

// ==========================================================
// Create Product Execution
// ==========================================================

async function createProduct() {
    if (uploading) return;
    if (!validateProduct()) return;

    setLoading(true);
    showSuccess("Preparing product and uploading images...");

    try {
        const productRef = doc(productsRef);
        const productId = productRef.id;

        const slug = await generateUniqueSlug();
        const imageURLs = await uploadProductImages(productId);

        const sellingPrice = Number(price.value);
        const regularPrice = Number(oldPrice.value || sellingPrice);
        const discount = regularPrice > sellingPrice
            ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
            : 0;

        const productData = {
            supplierId: currentUser.uid,
            supplierName: supplier.businessName,
            supplierLogo: supplier.logoURL || "",
            supplierVerified: supplier.verified === true,
            productName: productName.value.trim(),
            slug,
            brand: brand.value,
            category: category.value,
            cylinderSize: cylinderSize.value,
            description: description.value.trim(),
            safetyInformation: safetyInformation?.value.trim() || "",
            price: sellingPrice,
            originalPrice: regularPrice,
            discountPercentage: discount,
            currency: "KES",
            stock: Number(stock.value),
            sku: sku?.value.trim() || "",
            inStock: inStock?.checked ?? true,
            lowStockThreshold: 5,
            county: county.value,
            town: town.value,
            location: locationInput.value.trim(),
            deliveryAvailable: deliveryAvailable?.checked ?? true,
            deliveryFee: Number(deliveryFee?.value || 0),
            deliveryTime: deliveryTime?.value.trim() || "",
            featured: featuredProduct?.checked ?? false,
            published: published?.checked ?? true,
            acceptReturns: acceptReturns?.checked ?? false,
            tags: productTags?.value ? productTags.value.split(',').map(t => t.trim()).filter(Boolean) : [],
            rating: 0,
            totalReviews: 0,
            views: 0,
            status: published?.checked ? "active" : "draft",
            images: imageURLs,
            searchKeywords: buildSearchKeywords(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(productRef, productData);

        showSuccess("Product published successfully!");
        return { productId, slug };
    } catch (error) {
        console.error("Product creation failed:", error);
        showError("Unable to publish the product. Please check your network and try again.");
        throw error;
    } finally {
        setLoading(false);
    }
}

// ==========================================================
// Reset Form Handler
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
    hideAlerts();
}

// ==========================================================
// Event Listeners
// ==========================================================

productForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (uploading) return;

    try {
        const result = await createProduct();
        if (!result) return;

        resetProductForm();
        window.location.replace(`/supplier/products/`);
    } catch (error) {
        console.error(error);
    }
});

// Prevent Leaving During Upload
window.addEventListener("beforeunload", (event) => {
    if (!uploading) return;
    event.preventDefault();
    event.returnValue = "";
});

// Keyboard Shortcut: Ctrl + Enter = Submit
document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        productForm?.requestSubmit();
    }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    hideAlerts();
    setLoading(false);
});
