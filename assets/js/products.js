// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/products.js
// Version: 1.0.0
//
// Public Products Controller
// ==========================================================

import {

    db

} from "./firebase.js";

import {

    collection,

    query,

    where,

    orderBy,

    limit,

    startAfter,

    onSnapshot

}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// Firestore Collection
// ==========================================================

const productsRef = collection(

    db,

    "products"

);

// ==========================================================
// DOM Elements
// ==========================================================

const productsGrid =

    document.getElementById("productsGrid");

const loadingContainer =

    document.getElementById("productsLoading");

const emptyState =

    document.getElementById("emptyProducts");

const loadMoreButton =

    document.getElementById("loadMoreProducts");

const totalProducts =

    document.getElementById("totalProducts");

const searchInput =

    document.getElementById("productSearch");

const countyFilter =

    document.getElementById("countyFilter");

const townFilter =

    document.getElementById("townFilter");

const brandFilter =

    document.getElementById("brandFilter");

const sizeFilter =

    document.getElementById("sizeFilter");

const sortFilter =

    document.getElementById("sortFilter");

// ==========================================================
// State
// ==========================================================

const PAGE_SIZE = 20;

let lastVisible = null;

let allProducts = [];

let filteredProducts = [];

let unsubscribe = null;

// ==========================================================
// UI Helpers
// ==========================================================

function showLoading() {

    if (loadingContainer) {

        loadingContainer.classList.remove(

            "d-none"

        );

    }

}

function hideLoading() {

    if (loadingContainer) {

        loadingContainer.classList.add(

            "d-none"

        );

    }

}

function showEmptyState() {

    if (emptyState) {

        emptyState.classList.remove(

            "d-none"

        );

    }

}

function hideEmptyState() {

    if (emptyState) {

        emptyState.classList.add(

            "d-none"

        );

    }

}

function clearProducts() {

    if (productsGrid) {

        productsGrid.innerHTML = "";

    }

}

// ==========================================================
// Product Counter
// ==========================================================

function updateProductCounter() {

    if (!totalProducts) return;

    totalProducts.textContent =

        filteredProducts.length;

}

// ==========================================================
// Cleanup Listener
// ==========================================================

function stopRealtimeUpdates() {

    if (

        typeof unsubscribe ===

        "function"

    ) {

        unsubscribe();

        unsubscribe = null;

    }

}

// ==========================================================
// Load Products
// ==========================================================

function loadProducts() {

    showLoading();

    hideEmptyState();

    stopRealtimeUpdates();

    const productsQuery = query(

        productsRef,

        where("status", "==", "active"),

        where("supplierVerified", "==", true),

        orderBy("createdAt", "desc"),

        limit(PAGE_SIZE)

    );

    unsubscribe = onSnapshot(

        productsQuery,

        (snapshot) => {

            hideLoading();

            allProducts = [];

            filteredProducts = [];

            clearProducts();

            if (snapshot.empty) {

                showEmptyState();

                updateProductCounter();

                return;

            }

            snapshot.forEach((document) => {

                const product = {

                    id: document.id,

                    ...document.data()

                };

                allProducts.push(product);

            });

            filteredProducts = [...allProducts];

            lastVisible =

                snapshot.docs[

                    snapshot.docs.length - 1

                ];

            updateProductCounter();

            renderProducts(filteredProducts);

            if (loadMoreButton) {

                loadMoreButton.disabled =

                    snapshot.size < PAGE_SIZE;

            }

        },

        (error) => {

            console.error(

                "Unable to load products:",

                error

            );

            hideLoading();

            showEmptyState();

        }

    );

}

// ==========================================================
// Load More Products
// ==========================================================

async function loadMoreProducts() {

    if (!lastVisible) {

        return;

    }

    showLoading();

    try {

        const nextQuery = query(

            productsRef,

            where("status", "==", "active"),

            where("supplierVerified", "==", true),

            orderBy("createdAt", "desc"),

            startAfter(lastVisible),

            limit(PAGE_SIZE)

        );

        const {

            getDocs

        } = await import(

            "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"

        );

        const snapshot =

            await getDocs(nextQuery);

        hideLoading();

        if (snapshot.empty) {

            if (loadMoreButton) {

                loadMoreButton.disabled = true;

            }

            return;

        }

        snapshot.forEach((document) => {

            const product = {

                id: document.id,

                ...document.data()

            };

            allProducts.push(product);

            filteredProducts.push(product);

        });

        lastVisible =

            snapshot.docs[

                snapshot.docs.length - 1

            ];

        updateProductCounter();

        renderProducts(filteredProducts);

    }

    catch (error) {

        hideLoading();

        console.error(

            "Unable to load more products:",

            error

        );

    }

}

// ==========================================================
// Load More Button
// ==========================================================

if (loadMoreButton) {

    loadMoreButton.addEventListener(

        "click",

        loadMoreProducts

    );

}

// ==========================================================
// Product Helpers
// ==========================================================

const PLACEHOLDER_IMAGE =
"/assets/images/product-placeholder.webp";

const PLACEHOLDER_LOGO =
"/assets/images/supplier-placeholder.webp";

function escapeHTML(text = "") {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}

// ==========================================================
// Currency Formatter
// ==========================================================

function formatPrice(price) {

    return new Intl.NumberFormat(

        "en-KE",

        {

            style: "currency",

            currency: "KES",

            maximumFractionDigits: 0

        }

    ).format(Number(price || 0));

}

// ==========================================================
// Product Image
// ==========================================================

function productImage(product) {

    if (

        Array.isArray(product.images) &&

        product.images.length

    ) {

        return product.images[0];

    }

    return PLACEHOLDER_IMAGE;

}

// ==========================================================
// Supplier Logo
// ==========================================================

function supplierLogo(product) {

    return product.supplierLogo ||

        PLACEHOLDER_LOGO;

}

// ==========================================================
// Discount
// ==========================================================

function discountBadge(product) {

    if (

        !product.discountPercentage ||

        product.discountPercentage <= 0

    ) {

        return "";

    }

    return `

        <span class="badge-discount">

            -${product.discountPercentage}%

        </span>

    `;

}

// ==========================================================
// Featured Badge
// ==========================================================

function featuredBadge(product) {

    if (!product.featured) {

        return "";

    }

    return `

        <span class="badge-featured">

            Featured

        </span>

    `;

}

// ==========================================================
// Verification Badge
// ==========================================================

function verifiedBadge(product) {

    if (!product.supplierVerified) {

        return "";

    }

    return `

        <span class="supplier-verified">

            <i class="fas fa-check-circle"></i>

            Verified

        </span>

    `;

}

// ==========================================================
// Delivery Badge
// ==========================================================

function deliveryBadge(product) {

    if (!product.deliveryAvailable) {

        return "";

    }

    return `

        <span class="delivery-badge">

            Delivery Available

        </span>

    `;

}

// ==========================================================
// Stock Indicator
// ==========================================================

function stockIndicator(product) {

    const stock =

        Number(product.stock || 0);

    if (stock <= 0) {

        return `

            <span class="stock-out">

                Out of Stock

            </span>

        `;

    }

    if (

        stock <=

        Number(

            product.lowStockThreshold || 5

        )

    ) {

        return `

            <span class="stock-low">

                Low Stock

            </span>

        `;

    }

    return `

        <span class="stock-ok">

            In Stock

        </span>

    `;

}

// ==========================================================
// Rating
// ==========================================================

function ratingHTML(product) {

    const rating =

        Number(product.rating || 0)

        .toFixed(1);

    const reviews =

        Number(product.totalReviews || 0);

    return `

        <div class="product-rating">

            ★ ${rating}

            <span>

                (${reviews})

            </span>

        </div>

    `;

}

// ==========================================================
// Product Card
// ==========================================================

function createProductCard(product) {

    return `

<article class="product-card">

<div class="product-image">

<a href="/product/?id=${product.id}">

<img

src="${productImage(product)}"

alt="${escapeHTML(product.productName)}"

loading="lazy"

onerror="this.src='${PLACEHOLDER_IMAGE}'">

</a>

${featuredBadge(product)}

${discountBadge(product)}

</div>

<div class="product-body">

<div class="supplier-row">

<img

src="${supplierLogo(product)}"

class="supplier-logo"

loading="lazy"

onerror="this.src='${PLACEHOLDER_LOGO}'">

<div>

<div class="supplier-name">

${escapeHTML(product.supplierName)}

</div>

${verifiedBadge(product)}

</div>

</div>

<h3>

<a href="/product/?id=${product.id}">

${escapeHTML(product.productName)}

</a>

</h3>

<div class="product-brand">

${escapeHTML(product.brand)}

</div>

<div class="product-size">

${escapeHTML(product.cylinderSize)}

•

${escapeHTML(product.gasType)}

</div>

${ratingHTML(product)}

<div class="price-section">

<span class="current-price">

${formatPrice(product.price)}

</span>

${
product.originalPrice >

product.price ?

`<span class="old-price">

${formatPrice(product.originalPrice)}

</span>`

:

""

}

</div>

<div class="product-location">

${escapeHTML(product.town)},

${escapeHTML(product.county)}

</div>

<div class="product-badges">

${deliveryBadge(product)}

${stockIndicator(product)}

</div>

<div class="product-actions">

<a

href="/product/?id=${product.id}"

class="btn btn-primary">

View Details

</a>

</div>

</div>

</article>

`;

}

// ==========================================================
// Kenya Gas Marketplace
// Products Rendering Engine
// Version 2.0.0
// ==========================================================

// ==========================================================
// Render Products
// ==========================================================

function renderProducts(products = []) {

    if (!productsGrid) return;

    productsGrid.replaceChildren();

    hideLoading();

    hideEmptyState();

    updateProductCounter();

    if (!products.length) {

        showEmptyState();

        return;

    }

    const fragment =

        document.createDocumentFragment();

    for (const product of products) {

        const wrapper =

            document.createElement("div");

        wrapper.className =

            "product-grid-item";

        wrapper.dataset.productId =

            product.id;

        wrapper.innerHTML =

            createProductCard(product);

        fragment.appendChild(wrapper);

    }

    productsGrid.appendChild(fragment);

    initializeProductImages();

    initializeProductButtons();

}

// ==========================================================
// Image Initializer
// ==========================================================

function initializeProductImages() {

    const images =

        productsGrid.querySelectorAll("img");

    images.forEach((image) => {

        image.loading = "lazy";

        image.decoding = "async";

        image.referrerPolicy =

            "no-referrer";

        image.onerror = () => {

            image.src =

                PLACEHOLDER_IMAGE;

        };

    });

}

// ==========================================================
// Product Buttons
// ==========================================================

function initializeProductButtons() {

    document

        .querySelectorAll(

            ".btn-view-product"

        )

        .forEach((button) => {

            button.addEventListener(

                "click",

                () => {

                    const id =

                        button.dataset.product;

                    if (!id) return;

                    window.location.assign(

                        `/product/${id}`

                    );

                }

            );

        });

}

// ==========================================================
// Product Statistics
// ==========================================================

function updateMarketplaceStatistics() {

    const available =

        filteredProducts.filter(

            product =>

                Number(product.stock) > 0

        ).length;

    const featured =

        filteredProducts.filter(

            product =>

                product.featured

        ).length;

    const verified =

        filteredProducts.filter(

            product =>

                product.supplierVerified

        ).length;

    const availableElement =

        document.getElementById(

            "availableProducts"

        );

    const featuredElement =

        document.getElementById(

            "featuredProducts"

        );

    const verifiedElement =

        document.getElementById(

            "verifiedSuppliers"

        );

    if (availableElement) {

        availableElement.textContent =

            available.toLocaleString();

    }

    if (featuredElement) {

        featuredElement.textContent =

            featured.toLocaleString();

    }

    if (verifiedElement) {

        verifiedElement.textContent =

            verified.toLocaleString();

    }

}

// ==========================================================
// Refresh Marketplace
// ==========================================================

function refreshMarketplace() {

    renderProducts(

        filteredProducts

    );

    updateMarketplaceStatistics();

}

// ==========================================================
// Empty State CTA
// ==========================================================

function initializeEmptyState() {

    const button =

        document.getElementById(

            "clearFiltersButton"

        );

    if (!button) return;

    button.addEventListener(

        "click",

        () => {

            if (searchInput)

                searchInput.value = "";

            if (countyFilter)

                countyFilter.value = "";

            if (townFilter)

                townFilter.value = "";

            if (brandFilter)

                brandFilter.value = "";

            if (sizeFilter)

                sizeFilter.value = "";

            if (sortFilter)

                sortFilter.selectedIndex = 0;

            filteredProducts =

                [...allProducts];

            refreshMarketplace();

        }

    );

}

// ==========================================================
// Startup
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeEmptyState();

        loadProducts();

    }

);

// ==========================================================
// Cleanup
// ==========================================================

window.addEventListener(

    "beforeunload",

    stopRealtimeUpdates

);

// ==========================================================
// Kenya Gas Marketplace
// Products Search & Filters
// ==========================================================

// ==========================================================
// Search Delay
// ==========================================================

const SEARCH_DELAY = 300;

let searchTimeout = null;

// ==========================================================
// Normalize Text
// ==========================================================

function normalize(value) {

    return String(value || "")

        .trim()

        .toLowerCase();

}

// ==========================================================
// Apply Filters
// ==========================================================

function applyFilters() {

    const keyword =

        normalize(searchInput?.value);

    const county =

        normalize(countyFilter?.value);

    const town =

        normalize(townFilter?.value);

    const brand =

        normalize(brandFilter?.value);

    const size =

        normalize(sizeFilter?.value);

    filteredProducts =

        allProducts.filter((product) => {

            if (

                keyword &&

                ![
                    product.productName,
                    product.brand,
                    product.supplierName,
                    product.county,
                    product.town
                ]

                .join(" ")

                .toLowerCase()

                .includes(keyword)

            ) {

                return false;

            }

            if (

                county &&

                normalize(product.county) !== county

            ) {

                return false;

            }

            if (

                town &&

                normalize(product.town) !== town

            ) {

                return false;

            }

            if (

                brand &&

                normalize(product.brand) !== brand

            ) {

                return false;

            }

            if (

                size &&

                normalize(product.cylinderSize) !== size

            ) {

                return false;

            }

            return true;

        });

    sortProducts();

}

// ==========================================================
// Sorting
// ==========================================================

function sortProducts() {

    const sort =

        sortFilter?.value ||

        "latest";

    switch (sort) {

        case "price-asc":

            filteredProducts.sort(

                (a, b) =>

                    Number(a.price) -

                    Number(b.price)

            );

            break;

        case "price-desc":

            filteredProducts.sort(

                (a, b) =>

                    Number(b.price) -

                    Number(a.price)

            );

            break;

        case "name":

            filteredProducts.sort(

                (a, b) =>

                    a.productName.localeCompare(

                        b.productName

                    )

            );

            break;

        case "rating":

            filteredProducts.sort(

                (a, b) =>

                    Number(b.rating || 0) -

                    Number(a.rating || 0)

            );

            break;

        case "latest":

        default:

            filteredProducts.sort(

                (a, b) =>

                    b.createdAt.seconds -

                    a.createdAt.seconds

            );

    }

    refreshMarketplace();

}

// ==========================================================
// Search
// ==========================================================

function handleSearch() {

    clearTimeout(

        searchTimeout

    );

    searchTimeout =

        setTimeout(

            applyFilters,

            SEARCH_DELAY

        );

}

// ==========================================================
// Event Listeners
// ==========================================================

if (searchInput) {

    searchInput.addEventListener(

        "input",

        handleSearch

    );

}

if (countyFilter) {

    countyFilter.addEventListener(

        "change",

        applyFilters

    );

}

if (townFilter) {

    townFilter.addEventListener(

        "change",

        applyFilters

    );

}

if (brandFilter) {

    brandFilter.addEventListener(

        "change",

        applyFilters

    );

}

if (sizeFilter) {

    sizeFilter.addEventListener(

        "change",

        applyFilters

    );

}

if (sortFilter) {

    sortFilter.addEventListener(

        "change",

        sortProducts

    );

}

// ==========================================================
// Kenya Gas Marketplace
// Products Controller
// Part 5 - Final
// ==========================================================

// ==========================================================
// Local Cache
// ==========================================================

const PRODUCTS_CACHE_KEY =

    "kenyaGasProductsCache";

// ==========================================================
// Save Cache
// ==========================================================

function saveProductsCache() {

    try {

        sessionStorage.setItem(

            PRODUCTS_CACHE_KEY,

            JSON.stringify(filteredProducts)

        );

    }

    catch (error) {

        console.warn(

            "Unable to cache products.",

            error

        );

    }

}

// ==========================================================
// Restore Cache
// ==========================================================

function restoreProductsCache() {

    try {

        const cache =

            sessionStorage.getItem(

                PRODUCTS_CACHE_KEY

            );

        if (!cache) return false;

        const data =

            JSON.parse(cache);

        if (!Array.isArray(data)) {

            return false;

        }

        filteredProducts = data;

        renderProducts(filteredProducts);

        updateMarketplaceStatistics();

        return true;

    }

    catch {

        return false;

    }

}

// ==========================================================
// URL Parameters
// ==========================================================

function loadFiltersFromURL() {

    const params =

        new URLSearchParams(

            window.location.search

        );

    if (

        searchInput &&

        params.has("search")

    ) {

        searchInput.value =

            params.get("search");

    }

    if (

        countyFilter &&

        params.has("county")

    ) {

        countyFilter.value =

            params.get("county");

    }

    if (

        townFilter &&

        params.has("town")

    ) {

        townFilter.value =

            params.get("town");

    }

    if (

        brandFilter &&

        params.has("brand")

    ) {

        brandFilter.value =

            params.get("brand");

    }

    if (

        sizeFilter &&

        params.has("size")

    ) {

        sizeFilter.value =

            params.get("size");

    }

    if (

        sortFilter &&

        params.has("sort")

    ) {

        sortFilter.value =

            params.get("sort");

    }

}

// ==========================================================
// Save URL State
// ==========================================================

function updateURL() {

    const params =

        new URLSearchParams();

    if (searchInput?.value)

        params.set(

            "search",

            searchInput.value

        );

    if (countyFilter?.value)

        params.set(

            "county",

            countyFilter.value

        );

    if (townFilter?.value)

        params.set(

            "town",

            townFilter.value

        );

    if (brandFilter?.value)

        params.set(

            "brand",

            brandFilter.value

        );

    if (sizeFilter?.value)

        params.set(

            "size",

            sizeFilter.value

        );

    if (sortFilter?.value)

        params.set(

            "sort",

            sortFilter.value

        );

    history.replaceState(

        {},

        "",

        `${location.pathname}?${params}`

    );

}

// ==========================================================
// Marketplace Refresh
// ==========================================================

function refreshMarketplaceView() {

    renderProducts(

        filteredProducts

    );

    updateMarketplaceStatistics();

    updateProductCounter();

    saveProductsCache();

    updateURL();

}

// ==========================================================
// Override Refresh
// ==========================================================

function refreshMarketplace() {

    refreshMarketplaceView();

}

// ==========================================================
// Initialize
// ==========================================================

async function initializeMarketplace() {

    loadFiltersFromURL();

    const restored =

        restoreProductsCache();

    if (!restored) {

        showLoading();

    }

    loadProducts();

}

// ==========================================================
// Startup
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    initializeMarketplace

);

// ==========================================================
// Visibility
// ==========================================================

document.addEventListener(

    "visibilitychange",

    () => {

        if (

            document.visibilityState ===

            "visible"

        ) {

            saveProductsCache();

        }

    }

);

// ==========================================================
// Cleanup
// ==========================================================

window.addEventListener(

    "beforeunload",

    () => {

        stopRealtimeUpdates();

        saveProductsCache();

    }

);
