// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/product-details.js
// Version: 1.0.0
//
// Single Product Controller
// ==========================================================

import {

    db,

    auth,

    now

} from "./firebase.js";

import {

    collection,

    query,

    where,

    limit,

    getDocs,

    doc,

    updateDoc,

    increment,

    onSnapshot

}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// Firestore Collections
// ==========================================================

const productsRef =

    collection(

        db,

        "products"

    );

const supplierPublicRef =

    collection(

        db,

        "supplierPublic"

    );

const reviewsRef =

    collection(

        db,

        "reviews"

    );

// ==========================================================
// Page Elements
// ==========================================================

const pageLoader =

    document.getElementById("pageLoader");

const productContainer =

    document.getElementById("productContainer");

const galleryContainer =

    document.getElementById("productGallery");

const thumbnailsContainer =

    document.getElementById("productThumbnails");

const productTitle =

    document.getElementById("productTitle");

const productBrand =

    document.getElementById("productBrand");

const productPrice =

    document.getElementById("productPrice");

const originalPrice =

    document.getElementById("originalPrice");

const discountBadge =

    document.getElementById("discountBadge");

const stockBadge =

    document.getElementById("stockBadge");

const supplierContainer =

    document.getElementById("supplierCard");

const descriptionContainer =

    document.getElementById("productDescription");

const specificationContainer =

    document.getElementById("productSpecifications");

const breadcrumbTitle =

    document.getElementById("breadcrumbProduct");

const similarProductsContainer =

    document.getElementById("similarProducts");

// ==========================================================
// State
// ==========================================================

let product = null;

let unsubscribeProduct = null;

// ==========================================================
// Product Slug
// ==========================================================

function getProductSlug() {

    const path =

        window.location.pathname

            .replace(/\/+$/, "")

            .split("/");

    return decodeURIComponent(

        path[path.length - 1]

    );

}

// ==========================================================
// Loading
// ==========================================================

function showLoader() {

    pageLoader?.classList.remove(

        "d-none"

    );

    productContainer?.classList.add(

        "d-none"

    );

}

function hideLoader() {

    pageLoader?.classList.add(

        "d-none"

    );

    productContainer?.classList.remove(

        "d-none"

    );

}

// ==========================================================
// Currency
// ==========================================================

function formatCurrency(value) {

    return new Intl.NumberFormat(

        "en-KE",

        {

            style: "currency",

            currency: "KES",

            maximumFractionDigits: 0

        }

    ).format(

        Number(value || 0)

    );

}

// ==========================================================
// Escape HTML
// ==========================================================

function escapeHTML(text = "") {

    const div =

        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}

// ==========================================================
// Image Placeholder
// ==========================================================

const PLACEHOLDER_IMAGE =

    "/assets/images/product-placeholder.webp";

// ==========================================================
// 404 Page
// ==========================================================

function productNotFound() {

    hideLoader();

    productContainer.innerHTML = `

<section class="empty-page">

<h2>

Product Not Found

</h2>

<p>

The requested product does not exist or has been removed.

</p>

<a

href="/products"

class="btn btn-primary">

Browse Products

</a>

</section>

`;

}

// ==========================================================
// Cleanup
// ==========================================================

function cleanupListeners() {

    if (

        typeof unsubscribeProduct ===

        "function"

    ) {

        unsubscribeProduct();

        unsubscribeProduct = null;

    }

}

// ==========================================================
// Kenya Gas Marketplace
// Product Loader
// Part 2
// ==========================================================

// ==========================================================
// Product Slug
// ==========================================================

const productSlug = getProductSlug();

// ==========================================================
// Load Product
// ==========================================================

async function loadProduct() {

    showLoader();

    cleanupListeners();

    try {

        const productQuery = query(

            productsRef,

            where("slug", "==", productSlug),

            where("status", "==", "active"),

            limit(1)

        );

        const snapshot =

            await getDocs(

                productQuery

            );

        if (snapshot.empty) {

            productNotFound();

            return;

        }

        const documentSnapshot =

            snapshot.docs[0];

        product = {

            id: documentSnapshot.id,

            ...documentSnapshot.data()

        };

        // --------------------------------------------------
        // Real-time Updates
        // --------------------------------------------------

        unsubscribeProduct = onSnapshot(

            doc(

                db,

                "products",

                product.id

            ),

            (snapshot) => {

                if (!snapshot.exists()) {

                    productNotFound();

                    return;

                }

                product = {

                    id: snapshot.id,

                    ...snapshot.data()

                };

                renderProduct();

            }

        );

        await incrementProductViews();

        updateSEO();

    }

    catch (error) {

        console.error(

            "Product Load Error:",

            error

        );

        productNotFound();

    }

}

// ==========================================================
// Increment Views
// ==========================================================

async function incrementProductViews() {

    try {

        await updateDoc(

            doc(

                db,

                "products",

                product.id

            ),

            {

                views: increment(1),

                lastViewedAt: now()

            }

        );

    }

    catch (error) {

        console.warn(

            "Unable to update product views.",

            error

        );

    }

}

// ==========================================================
// Update SEO
// ==========================================================

function updateSEO() {

    document.title =

        `${product.productName} | Kenya Gas Marketplace`;

    const description =

        `${product.brand} ${product.cylinderSize} available in ${product.town}, ${product.county}. Order safely from verified suppliers on Kenya Gas Marketplace.`;

    updateMeta(

        "description",

        description

    );

    updateMeta(

        "og:title",

        product.productName

    );

    updateMeta(

        "og:description",

        description

    );

    updateMeta(

        "og:image",

        Array.isArray(product.images)

            ? product.images[0]

            : PLACEHOLDER_IMAGE

    );

    updateCanonical();

}

// ==========================================================
// Update Meta Tag
// ==========================================================

function updateMeta(

    name,

    content

) {

    let tag =

        document.querySelector(

            `meta[name="${name}"]`

        ) ||

        document.querySelector(

            `meta[property="${name}"]`

        );

    if (!tag) {

        tag =

            document.createElement(

                "meta"

            );

        if (

            name.startsWith("og:")

        ) {

            tag.setAttribute(

                "property",

                name

            );

        }

        else {

            tag.setAttribute(

                "name",

                name

            );

        }

        document.head.appendChild(tag);

    }

    tag.setAttribute(

        "content",

        content

    );

}

// ==========================================================
// Canonical URL
// ==========================================================

function updateCanonical() {

    let canonical =

        document.querySelector(

            'link[rel="canonical"]'

        );

    if (!canonical) {

        canonical =

            document.createElement(

                "link"

            );

        canonical.rel =

            "canonical";

        document.head.appendChild(

            canonical

        );

    }

    canonical.href =

        `${location.origin}/product/${product.slug}`;

}

// ==========================================================
// Kenya Gas Marketplace
// Product Details Renderer
// Part 3
// ==========================================================

// ==========================================================
// Main Product Renderer
// ==========================================================

async function renderProduct() {

    if (!product) {

        productNotFound();

        return;

    }

    hideLoader();

    renderGallery();

    renderProductInformation();

    renderPricing();

    renderStockStatus();

    renderDescription();

    renderSpecifications();

    await renderSupplier();

}

// ==========================================================
// Image Gallery
// ==========================================================

function renderGallery() {

    if (!galleryContainer) return;

    const images =

        Array.isArray(product.images) &&

        product.images.length

            ? product.images

            : [PLACEHOLDER_IMAGE];

    galleryContainer.innerHTML = `

        <img
            id="mainProductImage"
            src="${images[0]}"
            alt="${escapeHTML(product.productName)}"
            class="img-fluid rounded"
            loading="eager">

    `;

    if (!thumbnailsContainer) return;

    thumbnailsContainer.innerHTML = "";

    images.forEach((image) => {

        const thumbnail =

            document.createElement("img");

        thumbnail.src = image;

        thumbnail.alt =

            product.productName;

        thumbnail.loading = "lazy";

        thumbnail.className =

            "product-thumbnail";

        thumbnail.onerror = () => {

            thumbnail.src =

                PLACEHOLDER_IMAGE;

        };

        thumbnail.addEventListener(

            "click",

            () => {

                document.getElementById(

                    "mainProductImage"

                ).src = image;

            }

        );

        thumbnailsContainer.appendChild(

            thumbnail

        );

    });

}

// ==========================================================
// Product Information
// ==========================================================

function renderProductInformation() {

    if (productTitle)

        productTitle.textContent =

            product.productName;

    if (breadcrumbTitle)

        breadcrumbTitle.textContent =

            product.productName;

    if (productBrand)

        productBrand.textContent =

            product.brand;

}

// ==========================================================
// Pricing
// ==========================================================

function renderPricing() {

    if (productPrice)

        productPrice.textContent =

            formatCurrency(product.price);

    if (

        originalPrice &&

        product.originalPrice >

        product.price

    ) {

        originalPrice.textContent =

            formatCurrency(

                product.originalPrice

            );

        originalPrice.classList.remove(

            "d-none"

        );

    }

    else if (originalPrice) {

        originalPrice.classList.add(

            "d-none"

        );

    }

    if (

        discountBadge &&

        product.discountPercentage >

        0

    ) {

        discountBadge.textContent =

            `-${product.discountPercentage}%`;

        discountBadge.classList.remove(

            "d-none"

        );

    }

    else if (discountBadge) {

        discountBadge.classList.add(

            "d-none"

        );

    }

}

// ==========================================================
// Stock
// ==========================================================

function renderStockStatus() {

    if (!stockBadge) return;

    const stock =

        Number(product.stock || 0);

    stockBadge.className =

        "stock-badge";

    if (stock <= 0) {

        stockBadge.textContent =

            "Out of Stock";

        stockBadge.classList.add(

            "stock-out"

        );

        return;

    }

    if (

        stock <=

        Number(

            product.lowStockThreshold || 5

        )

    ) {

        stockBadge.textContent =

            "Low Stock";

        stockBadge.classList.add(

            "stock-low"

        );

        return;

    }

    stockBadge.textContent =

        "In Stock";

    stockBadge.classList.add(

        "stock-available"

    );

}

// ==========================================================
// Description
// ==========================================================

function renderDescription() {

    if (!descriptionContainer)

        return;

    descriptionContainer.innerHTML =

        escapeHTML(

            product.description ||

            "No description available."

        ).replace(

            /\n/g,

            "<br>"

        );

}

// ==========================================================
// Specifications
// ==========================================================

function renderSpecifications() {

    if (!specificationContainer)

        return;

    specificationContainer.innerHTML = `

<table class="table table-bordered align-middle">

<tbody>

<tr>

<th>Brand</th>

<td>${escapeHTML(product.brand)}</td>

</tr>

<tr>

<th>Cylinder Size</th>

<td>${escapeHTML(product.cylinderSize)}</td>

</tr>

<tr>

<th>Gas Type</th>

<td>${escapeHTML(product.gasType)}</td>

</tr>

<tr>

<th>County</th>

<td>${escapeHTML(product.county)}</td>

</tr>

<tr>

<th>Town</th>

<td>${escapeHTML(product.town)}</td>

</tr>

<tr>

<th>Supplier</th>

<td>${escapeHTML(product.supplierName)}</td>

</tr>

</tbody>

</table>

`;

}

// ==========================================================
// Supplier Card
// ==========================================================

async function renderSupplier() {

    if (!supplierContainer) return;

    supplierContainer.innerHTML = `

<div class="supplier-card">

<img

src="${product.supplierLogo ||

PLACEHOLDER_IMAGE}"

class="supplier-logo"

alt="${escapeHTML(product.supplierName)}"

loading="lazy">

<div>

<h4>

${escapeHTML(product.supplierName)}

${product.supplierVerified
? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>'
: ""}

</h4>

<p>

${escapeHTML(product.town)},

${escapeHTML(product.county)}

</p>

<p>

⭐ ${Number(product.rating || 0).toFixed(1)}

(${Number(product.totalReviews || 0)} Reviews)

</p>

</div>

</div>

`;

}

// ==========================================================
// Kenya Gas Marketplace
// Product Details Controller
// Part 4
// ==========================================================

// ==========================================================
// DOM Elements
// ==========================================================

const contactSupplierButton =
    document.getElementById("contactSupplier");

const favouriteButton =
    document.getElementById("favouriteProduct");

const shareButton =
    document.getElementById("shareProduct");

// ==========================================================
// Load Similar Products
// ==========================================================

async function loadSimilarProducts() {

    if (!similarProductsContainer || !product) {

        return;

    }

    try {

        const similarQuery = query(

            productsRef,

            where("status", "==", "active"),

            where("brand", "==", product.brand),

            limit(5)

        );

        const snapshot =

            await getDocs(similarQuery);

        similarProductsContainer.innerHTML = "";

        snapshot.forEach((document) => {

            if (document.id === product.id) {

                return;

            }

            const item = {

                id: document.id,

                ...document.data()

            };

            const card =

                document.createElement("article");

            card.className =

                "similar-product-card";

            card.innerHTML = `

<a href="/product/${item.slug}">

<img
src="${item.images?.[0] || PLACEHOLDER_IMAGE}"
alt="${escapeHTML(item.productName)}"
loading="lazy">

<h4>

${escapeHTML(item.productName)}

</h4>

<p>

${formatCurrency(item.price)}

</p>

</a>

`;

            similarProductsContainer.appendChild(

                card

            );

        });

    }

    catch (error) {

        console.error(

            "Unable to load similar products.",

            error

        );

    }

}

// ==========================================================
// Contact Supplier
// ==========================================================

function initializeContactSupplier() {

    if (!contactSupplierButton) {

        return;

    }

    contactSupplierButton.addEventListener(

        "click",

        () => {

            if (!product.supplierPhone) {

                alert(

                    "Supplier contact is unavailable."

                );

                return;

            }

            window.location.href =

                `tel:${product.supplierPhone}`;

        }

    );

}

// ==========================================================
// Share Product
// ==========================================================

function initializeShareButton() {

    if (!shareButton) {

        return;

    }

    shareButton.addEventListener(

        "click",

        async () => {

            const url =

                `${location.origin}/product/${product.slug}`;

            if (

                navigator.share

            ) {

                try {

                    await navigator.share({

                        title:

                            product.productName,

                        text:

                            product.productName,

                        url

                    });

                }

                catch {}

                return;

            }

            try {

                await navigator.clipboard.writeText(

                    url

                );

                alert(

                    "Product link copied."

                );

            }

            catch {

                prompt(

                    "Copy this link",

                    url

                );

            }

        }

    );

}

// ==========================================================
// Favourite Product
// ==========================================================

function initializeFavouriteButton() {

    if (!favouriteButton) {

        return;

    }

    favouriteButton.addEventListener(

        "click",

        () => {

            const key =

                "kg-favourites";

            const favourites =

                JSON.parse(

                    localStorage.getItem(key)

                    || "[]"

                );

            if (

                favourites.includes(product.id)

            ) {

                const updated =

                    favourites.filter(

                        id =>

                            id !== product.id

                    );

                localStorage.setItem(

                    key,

                    JSON.stringify(updated)

                );

                favouriteButton.classList.remove(

                    "active"

                );

                return;

            }

            favourites.push(product.id);

            localStorage.setItem(

                key,

                JSON.stringify(favourites)

            );

            favouriteButton.classList.add(

                "active"

            );

        }

    );

}

// ==========================================================
// Restore Favourite State
// ==========================================================

function restoreFavouriteState() {

    if (!favouriteButton) {

        return;

    }

    const favourites =

        JSON.parse(

            localStorage.getItem(

                "kg-favourites"

            ) || "[]"

        );

    favouriteButton.classList.toggle(

        "active",

        favourites.includes(product.id)

    );

}

// ==========================================================
// Initialize Actions
// ==========================================================

function initializeProductActions() {

    initializeContactSupplier();

    initializeShareButton();

    initializeFavouriteButton();

    restoreFavouriteState();

    loadSimilarProducts();

}

// ==========================================================
// Kenya Gas Marketplace
// Product Details
// Part 5 - Final
// ==========================================================

// ==========================================================
// DOM Elements
// ==========================================================

const reviewsContainer =
    document.getElementById("reviewsContainer");

const averageRatingElement =
    document.getElementById("averageRating");

const totalReviewsElement =
    document.getElementById("totalReviews");

// ==========================================================
// Load Reviews
// ==========================================================

async function loadReviews() {

    if (!reviewsContainer || !product) {

        return;

    }

    try {

        const reviewsQuery = query(

            reviewsRef,

            where(

                "productId",

                "==",

                product.id

            ),

            where(

                "status",

                "==",

                "published"

            )

        );

        const snapshot =

            await getDocs(

                reviewsQuery

            );

        reviewsContainer.replaceChildren();

        if (snapshot.empty) {

            reviewsContainer.innerHTML = `

<div class="empty-reviews">

<p>

No reviews yet.

</p>

</div>

`;

            if (averageRatingElement) {

                averageRatingElement.textContent =

                    "0.0";

            }

            if (totalReviewsElement) {

                totalReviewsElement.textContent =

                    "0";

            }

            return;

        }

        let totalRating = 0;

        snapshot.forEach((document) => {

            const review =

                document.data();

            totalRating +=

                Number(

                    review.rating || 0

                );

            const article =

                document.createElement(

                    "article"

                );

            article.className =

                "review-card";

            article.innerHTML = `

<div class="review-header">

<strong>

${escapeHTML(review.customerName || "Customer")}

</strong>

<span>

${Number(review.rating).toFixed(1)} ★

</span>

</div>

<p>

${escapeHTML(review.comment || "")}

</p>

`;

            reviewsContainer.appendChild(

                article

            );

        });

        const average =

            totalRating /

            snapshot.size;

        if (averageRatingElement) {

            averageRatingElement.textContent =

                average.toFixed(1);

        }

        if (totalReviewsElement) {

            totalReviewsElement.textContent =

                snapshot.size.toLocaleString();

        }

    }

    catch (error) {

        console.error(

            "Unable to load reviews.",

            error

        );

    }

}

// ==========================================================
// Recently Viewed Products
// ==========================================================

function saveRecentlyViewed() {

    if (!product) {

        return;

    }

    const key =

        "kg_recent_products";

    let history =

        JSON.parse(

            localStorage.getItem(key)

            || "[]"

        );

    history = history.filter(

        (id) =>

            id !== product.id

    );

    history.unshift(

        product.id

    );

    history = history.slice(

        0,

        20

    );

    localStorage.setItem(

        key,

        JSON.stringify(history)

    );

}

// ==========================================================
// Product Initialization
// ==========================================================

async function initializeProductPage() {

    await loadProduct();

    if (!product) {

        return;

    }

    initializeProductActions();

    await loadReviews();

    saveRecentlyViewed();

}

// ==========================================================
// Startup
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    initializeProductPage

);

// ==========================================================
// Cleanup
// ==========================================================

window.addEventListener(

    "beforeunload",

    cleanupListeners

);

// ==========================================================
// Export
// ==========================================================

export {

    initializeProductPage,

    loadProduct

};