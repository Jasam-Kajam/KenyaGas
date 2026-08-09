// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/products.js
// Version: 1.0.1
// Public Products Controller & Rendering Engine
// ==========================================================

import { db } from "./firebase.js";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// Firestore Collection & Constants
// ==========================================================

const productsRef = collection(db, "products");
const PAGE_SIZE = 20;
const SEARCH_DELAY = 300;
const PRODUCTS_CACHE_KEY = "kenyaGasProductsCache";

const PLACEHOLDER_IMAGE = "/assets/images/product-placeholder.webp";
const PLACEHOLDER_LOGO = "/assets/images/supplier-placeholder.webp";

// ==========================================================
// DOM Elements
// ==========================================================

const productsGrid = document.getElementById("productsGrid");
const loadingContainer = document.getElementById("productsLoading");
const emptyState = document.getElementById("emptyProducts");
const loadMoreButton = document.getElementById("loadMoreProducts");
const totalProducts = document.getElementById("totalProducts");
const searchInput = document.getElementById("productSearch");
const countyFilter = document.getElementById("countyFilter");
const townFilter = document.getElementById("townFilter");
const brandFilter = document.getElementById("brandFilter");
const sizeFilter = document.getElementById("sizeFilter");
const sortFilter = document.getElementById("sortFilter");
const clearFiltersButton = document.getElementById("clearFiltersButton");

// ==========================================================
// State
// ==========================================================

let lastVisible = null;
let allProducts = [];
let filteredProducts = [];
let unsubscribe = null;
let searchTimeout = null;

// ==========================================================
// UI Helpers
// ==========================================================

function showLoading() {
    if (loadingContainer) loadingContainer.classList.remove("d-none");
}

function hideLoading() {
    if (loadingContainer) loadingContainer.classList.add("d-none");
}

function showEmptyState() {
    if (emptyState) emptyState.classList.remove("d-none");
}

function hideEmptyState() {
    if (emptyState) emptyState.classList.add("d-none");
}

function clearProducts() {
    if (productsGrid) productsGrid.innerHTML = "";
}

function updateProductCounter() {
    if (totalProducts) {
        totalProducts.textContent = filteredProducts.length;
    }
}

function stopRealtimeUpdates() {
    if (typeof unsubscribe === "function") {
        unsubscribe();
        unsubscribe = null;
    }
}

// ==========================================================
// Formatting & Badge Helpers
// ==========================================================

function escapeHTML(text = "") {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 0
    }).format(Number(price || 0));
}

function productImage(product) {
    return (Array.isArray(product.images) && product.images.length) ? product.images[0] : PLACEHOLDER_IMAGE;
}

function supplierLogo(product) {
    return product.supplierLogo || PLACEHOLDER_LOGO;
}

function discountBadge(product) {
    if (!product.discountPercentage || product.discountPercentage <= 0) return "";
    return `<span class="badge-discount">-${product.discountPercentage}%</span>`;
}

function featuredBadge(product) {
    if (!product.featured) return "";
    return `<span class="badge-featured">Featured</span>`;
}

function verifiedBadge(product) {
    if (!product.supplierVerified) return "";
    return `<span class="supplier-verified"><i class="fas fa-check-circle"></i> Verified</span>`;
}

function deliveryBadge(product) {
    if (!product.deliveryAvailable) return "";
    return `<span class="delivery-badge">Delivery Available</span>`;
}

function stockIndicator(product) {
    const stock = Number(product.stock || 0);
    if (stock <= 0) return `<span class="stock-out">Out of Stock</span>`;
    if (stock <= Number(product.lowStockThreshold || 5)) return `<span class="stock-low">Low Stock</span>`;
    return `<span class="stock-ok">In Stock</span>`;
}

function ratingHTML(product) {
    const rating = Number(product.rating || 0).toFixed(1);
    const reviews = Number(product.totalReviews || 0);
    return `
        <div class="product-rating">
            ★ ${rating} <span>(${reviews})</span>
        </div>
    `;
}

// ==========================================================
// Product Card Template
// ==========================================================

function createProductCard(product) {
    return `
        <article class="product-card">
            <div class="product-image">
                <a href="/product/?id=${product.id}">
                    <img src="${productImage(product)}" alt="${escapeHTML(product.productName)}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                </a>
                ${featuredBadge(product)}
                ${discountBadge(product)}
            </div>
            <div class="product-body">
                <div class="supplier-row">
                    <img src="${supplierLogo(product)}" class="supplier-logo" loading="lazy" onerror="this.src='${PLACEHOLDER_LOGO}'">
                    <div>
                        <div class="supplier-name">${escapeHTML(product.supplierName)}</div>
                        ${verifiedBadge(product)}
                    </div>
                </div>
                <h3><a href="/product/?id=${product.id}">${escapeHTML(product.productName)}</a></h3>
                <div class="product-brand">${escapeHTML(product.brand)}</div>
                <div class="product-size">${escapeHTML(product.cylinderSize)} • ${escapeHTML(product.gasType)}</div>
                ${ratingHTML(product)}
                <div class="price-section">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.originalPrice > product.price ? `<span class="old-price">${formatPrice(product.originalPrice)}</span>` : ""}
                </div>
                <div class="product-location">${escapeHTML(product.town)}, ${escapeHTML(product.county)}</div>
                <div class="product-badges">${deliveryBadge(product)} ${stockIndicator(product)}</div>
                <div class="product-actions">
                    <a href="/product/?id=${product.id}" class="btn btn-primary">View Details</a>
                </div>
            </div>
        </article>
    `;
}

// ==========================================================
// Rendering Engine
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

    const fragment = document.createDocumentFragment();
    for (const product of products) {
        const wrapper = document.createElement("div");
        wrapper.className = "product-grid-item";
        wrapper.dataset.productId = product.id;
        wrapper.innerHTML = createProductCard(product);
        fragment.appendChild(wrapper);
    }
    productsGrid.appendChild(fragment);
    initializeProductImages();
}

function initializeProductImages() {
    if (!productsGrid) return;
    productsGrid.querySelectorAll("img").forEach((image) => {
        image.loading = "lazy";
        image.decoding = "async";
        image.referrerPolicy = "no-referrer";
        image.onerror = () => { image.src = PLACEHOLDER_IMAGE; };
    });
}

// ==========================================================
// Statistics & Refresh Pipeline
// ==========================================================

function updateMarketplaceStatistics() {
    const available = filteredProducts.filter(p => Number(p.stock) > 0).length;
    const featured = filteredProducts.filter(p => p.featured).length;
    const verified = filteredProducts.filter(p => p.supplierVerified).length;

    const availableElement = document.getElementById("availableProducts");
    const featuredElement = document.getElementById("featuredProducts");
    const verifiedElement = document.getElementById("verifiedSuppliers");

    if (availableElement) availableElement.textContent = available.toLocaleString();
    if (featuredElement) featuredElement.textContent = featured.toLocaleString();
    if (verifiedElement) verifiedElement.textContent = verified.toLocaleString();
}

function refreshMarketplace() {
    renderProducts(filteredProducts);
    updateMarketplaceStatistics();
    updateProductCounter();
    saveProductsCache();
    updateURL();
}

// ==========================================================
// Filtering & Sorting Logic
// ==========================================================

function normalize(value) {
    return String(value || "").trim().toLowerCase();
}

function applyFilters() {
    const keyword = normalize(searchInput?.value);
    const county = normalize(countyFilter?.value);
    const town = normalize(townFilter?.value);
    const brand = normalize(brandFilter?.value);
    const size = normalize(sizeFilter?.value);

    filteredProducts = allProducts.filter((product) => {
        if (keyword && ![
            product.productName,
            product.brand,
            product.supplierName,
            product.county,
            product.town
        ].join(" ").toLowerCase().includes(keyword)) {
            return false;
        }
        if (county && normalize(product.county) !== county) return false;
        if (town && normalize(product.town) !== town) return false;
        if (brand && normalize(product.brand) !== brand) return false;
        if (size && normalize(product.cylinderSize) !== size) return false;
        return true;
    });

    sortProducts(false); // Sort without triggering extra refresh loops
}

function sortProducts(triggerRefresh = true) {
    const sort = sortFilter?.value || "latest";

    switch (sort) {
        case "price-asc":
            filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
            break;
        case "price-desc":
            filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
            break;
        case "name":
            filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
            break;
        case "rating":
            filteredProducts.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
            break;
        case "latest":
        default:
            filteredProducts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }

    if (triggerRefresh) {
        refreshMarketplace();
    }
}

function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, SEARCH_DELAY);
}

// ==========================================================
// URL & Caching Management
// ==========================================================

function saveProductsCache() {
    try {
        sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(filteredProducts));
    } catch (error) {
        console.warn("Unable to cache products.", error);
    }
}

function restoreProductsCache() {
    try {
        const cache = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
        if (!cache) return false;
        const data = JSON.parse(cache);
        if (!Array.isArray(data)) return false;
        filteredProducts = data;
        renderProducts(filteredProducts);
        updateMarketplaceStatistics();
        return true;
    } catch {
        return false;
    }
}

function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (searchInput && params.has("search")) searchInput.value = params.get("search");
    if (countyFilter && params.has("county")) countyFilter.value = params.get("county");
    if (townFilter && params.has("town")) townFilter.value = params.get("town");
    if (brandFilter && params.has("brand")) brandFilter.value = params.get("brand");
    if (sizeFilter && params.has("size")) sizeFilter.value = params.get("size");
    if (sortFilter && params.has("sort")) sortFilter.value = params.get("sort");
}

function updateURL() {
    const params = new URLSearchParams();
    if (searchInput?.value) params.set("search", searchInput.value);
    if (countyFilter?.value) params.set("county", countyFilter.value);
    if (townFilter?.value) params.set("town", townFilter.value);
    if (brandFilter?.value) params.set("brand", brandFilter.value);
    if (sizeFilter?.value) params.set("size", sizeFilter.value);
    if (sortFilter?.value) params.set("sort", sortFilter.value);
    
    history.replaceState({}, "", `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
}

// ==========================================================
// Firestore Data Fetching
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

            if (snapshot.empty) {
                filteredProducts = [];
                showEmptyState();
                updateProductCounter();
                return;
            }

            snapshot.forEach((document) => {
                allProducts.push({
                    id: document.id,
                    ...document.data()
                });
            });

            lastVisible = snapshot.docs[snapshot.docs.length - 1];

            // Re-apply filters against new live data so active searches aren't wiped out
            applyFilters();

            if (loadMoreButton) {
                loadMoreButton.disabled = snapshot.size < PAGE_SIZE;
            }
        },
        (error) => {
            console.error("Unable to load products:", error);
            hideLoading();
            showEmptyState();
        }
    );
}

async function loadMoreProducts() {
    if (!lastVisible) return;
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

        const { getDocs } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");
        const snapshot = await getDocs(nextQuery);
        hideLoading();

        if (snapshot.empty) {
            if (loadMoreButton) loadMoreButton.disabled = true;
            return;
        }

        snapshot.forEach((document) => {
            const product = { id: document.id, ...document.data() };
            allProducts.push(product);
        });

        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        applyFilters();
    } catch (error) {
        hideLoading();
        console.error("Unable to load more products:", error);
    }
}

// ==========================================================
// Event Listeners Binding
// ==========================================================

function bindEvents() {
    if (loadMoreButton) loadMoreButton.addEventListener("click", loadMoreProducts);
    if (searchInput) searchInput.addEventListener("input", handleSearch);
    if (countyFilter) countyFilter.addEventListener("change", applyFilters);
    if (townFilter) townFilter.addEventListener("change", applyFilters);
    if (brandFilter) brandFilter.addEventListener("change", applyFilters);
    if (sizeFilter) sizeFilter.addEventListener("change", applyFilters);
    if (sortFilter) sortFilter.addEventListener("change", () => sortProducts(true));

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            if (countyFilter) countyFilter.value = "";
            if (townFilter) townFilter.value = "";
            if (brandFilter) brandFilter.value = "";
            if (sizeFilter) sizeFilter.value = "";
            if (sortFilter) sortFilter.selectedIndex = 0;
            filteredProducts = [...allProducts];
            refreshMarketplace();
        });
    }

    window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") saveProductsCache();
    });

    window.addEventListener("beforeunload", () => {
        stopRealtimeUpdates();
        saveProductsCache();
    });
}

// ==========================================================
// Initialization Startup
// ==========================================================

async function initializeMarketplace() {
    bindEvents();
    loadFiltersFromURL();
    const restored = restoreProductsCache();
    if (!restored) {
        showLoading();
    }
    loadProducts();
}

document.addEventListener("DOMContentLoaded", initializeMarketplace);
