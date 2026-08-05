// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/supplier-dashboard.js
// Version: 1.0.0
//
// Supplier Dashboard Controller
// ==========================================================

import {

    auth,

    db,

    now

} from "./firebase.js";

import {

    onAuthStateChanged,

    signOut

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {

    doc,

    getDoc,

    collection,

    query,

    where,

    orderBy,

    limit,

    getDocs,

    onSnapshot

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================================
// Global Variables
// ==========================================================

let currentUser = null;

let supplierProfile = null;

let dashboardReady = false;

// ==========================================================
// Collections
// ==========================================================

const USERS_COLLECTION = "users";

const SUPPLIERS_COLLECTION = "supplierPublic";

const PRODUCTS_COLLECTION = "products";

const ORDERS_COLLECTION = "orders";

const NOTIFICATIONS_COLLECTION = "notifications";

// ==========================================================
// Dashboard State
// ==========================================================

const dashboardState = {

    totalProducts: 0,

    totalOrders: 0,

    pendingOrders: 0,

    completedOrders: 0,

    revenue: 0,

    unreadNotifications: 0,

    profileCompletion: 0,

    verificationStatus: "pending"

};

// ==========================================================
// DOM Elements
// ==========================================================

// Dashboard
const dashboard =
    document.getElementById("supplierDashboard");

// ==========================================================
// Header
// ==========================================================

const supplierName =
    document.getElementById("supplierName");

const supplierBusiness =
    document.getElementById("supplierBusiness");

const supplierLogo =
    document.getElementById("supplierLogo");

const supplierStatus =
    document.getElementById("supplierStatus");

const supplierGreeting =
    document.getElementById("supplierGreeting");

// ==========================================================
// Dashboard Statistics
// ==========================================================

const totalProducts =
    document.getElementById("totalProducts");

const totalOrders =
    document.getElementById("totalOrders");

const pendingOrders =
    document.getElementById("pendingOrders");

const completedOrders =
    document.getElementById("completedOrders");

const totalRevenue =
    document.getElementById("totalRevenue");

const unreadNotifications =
    document.getElementById("unreadNotifications");

// ==========================================================
// Recent Products
// ==========================================================

const recentProducts =
    document.getElementById("recentProducts");

// ==========================================================
// Recent Orders
// ==========================================================

const recentOrders =
    document.getElementById("recentOrders");

// ==========================================================
// Low Stock
// ==========================================================

const lowStockProducts =
    document.getElementById("lowStockProducts");

// ==========================================================
// Revenue
// ==========================================================

const revenueChart =
    document.getElementById("revenueChart");

// ==========================================================
// Notifications
// ==========================================================

const notificationList =
    document.getElementById("notificationList");

// ==========================================================
// Profile Completion
// ==========================================================

const profileCompletion =
    document.getElementById("profileCompletion");

const profileCompletionText =
    document.getElementById("profileCompletionText");

// ==========================================================
// Verification
// ==========================================================

const verificationBadge =
    document.getElementById("verificationBadge");

// ==========================================================
// Quick Actions
// ==========================================================

const addProductButton =
    document.getElementById("addProductButton");

const viewOrdersButton =
    document.getElementById("viewOrdersButton");

const editProfileButton =
    document.getElementById("editProfileButton");

const refreshDashboardButton =
    document.getElementById("refreshDashboardButton");

// ==========================================================
// Sidebar
// ==========================================================

const sidebar =
    document.getElementById("supplierSidebar");

const sidebarToggle =
    document.getElementById("sidebarToggle");

// ==========================================================
// User Menu
// ==========================================================

const accountMenu =
    document.getElementById("accountMenu");

const logoutButton =
    document.getElementById("logoutButton");

// ==========================================================
// Loading
// ==========================================================

const pageLoader =
    document.getElementById("pageLoader");

const dashboardLoader =
    document.getElementById("dashboardLoader");

// ==========================================================
// Error Message
// ==========================================================

const dashboardError =
    document.getElementById("dashboardError");

// ==========================================================
// Dashboard Initialization
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeDashboard();

    }

);

// ==========================================================
// Initialize Dashboard
// ==========================================================

function initializeDashboard() {

    listenForAuthentication();

}

// ==========================================================
// Authentication Guard
// ==========================================================

function listenForAuthentication() {

    onAuthStateChanged(

        auth,

        async (user) => {

            // ---------------------------------------------
            // User Not Logged In
            // ---------------------------------------------

            if (!user) {

                window.location.replace(

                    "/supplier/login/"

                );

                return;

            }

            currentUser = user;

            try {

                showDashboardLoader();

                // -----------------------------------------
                // Load User Record
                // -----------------------------------------

                const userRef = doc(

                    db,

                    USERS_COLLECTION,

                    user.uid

                );

                const userSnap =

                    await getDoc(userRef);

                if (!userSnap.exists()) {

                    await signOut(auth);

                    window.location.replace(

                        "/supplier/login/"

                    );

                    return;

                }

                const userData =

                    userSnap.data();

                // -----------------------------------------
                // Role Protection
                // -----------------------------------------

                if (

                    userData.role !== "supplier"

                ) {

                    await signOut(auth);

                    window.location.replace(

                        "/login/"

                    );

                    return;

                }

                // -----------------------------------------
                // Account Status
                // -----------------------------------------

                switch (userData.status) {

                    case "pending":

                        window.location.replace(

                            "/supplier/pending/"

                        );

                        return;

                    case "suspended":

                        window.location.replace(

                            "/supplier/suspended/"

                        );

                        return;

                    case "rejected":

                        window.location.replace(

                            "/supplier/rejected/"

                        );

                        return;

                    case "approved":

                        break;

                    default:

                        window.location.replace(

                            "/supplier/pending/"

                        );

                        return;

                }

                // -----------------------------------------
                // Email Verification
                // -----------------------------------------

                if (

                    !user.emailVerified

                ) {

                    window.location.replace(

                        "/verify-email/"

                    );

                    return;

                }

                // -----------------------------------------
                // Ready
                // -----------------------------------------

                dashboardReady = true;

                await loadDashboard();

            }

            catch (error) {

                console.error(

                    "Dashboard authentication failed:",

                    error

                );

                showDashboardError(

                    "Unable to load your dashboard. Please refresh the page."

                );

            }

            finally {

                hideDashboardLoader();

            }

        }

    );

}

// ==========================================================
// Load Dashboard
// ==========================================================

async function loadDashboard() {

    try {

        await Promise.all([

            loadSupplierProfile(),

            loadDashboardStatistics(),

            loadRecentProducts(),

            loadRecentOrders(),

            loadLowStockProducts(),

            loadNotifications(),

            loadProfileCompletion()

        ]);

    }

    catch (error) {

        console.error(

            "Dashboard loading failed:",

            error

        );

        showDashboardError(

            "Unable to load dashboard data."

        );

    }

}

// ==========================================================
// Load Supplier Profile
// ==========================================================

async function loadSupplierProfile() {

    const supplierRef = doc(

        db,

        SUPPLIERS_COLLECTION,

        currentUser.uid

    );

    const supplierSnap =

        await getDoc(

            supplierRef

        );

    if (

        !supplierSnap.exists()

    ) {

        throw new Error(

            "Supplier profile not found."

        );

    }

    supplierData =

        supplierSnap.data();

    // ------------------------------------------------------
    // Header
    // ------------------------------------------------------

    if (supplierName) {

        supplierName.textContent =

            supplierData.ownerName ||

            "Supplier";

    }

    if (supplierBusiness) {

        supplierBusiness.textContent =

            supplierData.businessName ||

            "";

    }

    if (

        supplierLogo &&

        supplierData.logoURL

    ) {

        supplierLogo.src =

            supplierData.logoURL;

    }

    if (supplierStatus) {

        supplierStatus.textContent =

            supplierData.status ||

            "Pending";

    }

    if (

        verificationBadge

    ) {

        verificationBadge.classList.toggle(

            "verified",

            supplierData.verified === true

        );

    }

}

// ==========================================================
// Dashboard Statistics
// ==========================================================

async function loadDashboardStatistics() {

    const statsRef = doc(

        db,

        DASHBOARD_COLLECTION,

        currentUser.uid

    );

    const statsSnap =

        await getDoc(

            statsRef

        );

    if (

        !statsSnap.exists()

    ) {

        return;

    }

    const stats =

        statsSnap.data();

    if (totalProducts) {

        totalProducts.textContent =

            stats.totalProducts || 0;

    }

    if (totalOrders) {

        totalOrders.textContent =

            stats.totalOrders || 0;

    }

    if (pendingOrders) {

        pendingOrders.textContent =

            stats.pendingOrders || 0;

    }

    if (completedOrders) {

        completedOrders.textContent =

            stats.completedOrders || 0;

    }

    if (totalRevenue) {

        totalRevenue.textContent =

            `KES ${Number(

                stats.totalRevenue || 0

            ).toLocaleString()}`;

    }

    if (

        unreadNotifications

    ) {

        unreadNotifications.textContent =

            stats.unreadNotifications || 0;

    }

}

// ==========================================================
// Recent Products
// ==========================================================

async function loadRecentProducts() {

    if (!recentProductsContainer) {

        return;

    }

    recentProductsContainer.innerHTML = "";

    try {

        const q = query(

            collection(db, PRODUCTS_COLLECTION),

            where(

                "supplierId",

                "==",

                currentUser.uid

            ),

            orderBy(

                "createdAt",

                "desc"

            ),

            limit(5)

        );

        const snapshot =

            await getDocs(q);

        if (snapshot.empty) {

            recentProductsContainer.innerHTML =

                `<p class="empty-state">
                    No products available.
                 </p>`;

            return;

        }

        snapshot.forEach((docSnap) => {

            const product =

                docSnap.data();

            const card =

                document.createElement("div");

            card.className =

                "dashboard-product-card";

            card.innerHTML = `

                <img
                    src="${product.imageURL || '/assets/images/product-placeholder.png'}"
                    alt="${product.productName}">

                <div class="dashboard-product-info">

                    <h4>

                        ${product.productName}

                    </h4>

                    <p>

                        ${product.brand || "Brand"}

                    </p>

                    <span>

                        KES ${Number(
                            product.price || 0
                        ).toLocaleString()}

                    </span>

                </div>

                <a
                    href="/supplier/products/edit/?id=${docSnap.id}"
                    class="btn btn-outline btn-sm">

                    Edit

                </a>

            `;

            recentProductsContainer.appendChild(

                card

            );

        });

    }

    catch (error) {

        console.error(

            "Products loading failed:",

            error

        );

    }

}

// ==========================================================
// Recent Orders
// ==========================================================

async function loadRecentOrders() {

    if (!recentOrdersContainer) {

        return;

    }

    recentOrdersContainer.innerHTML = "";

    try {

        const q = query(

            collection(db, ORDERS_COLLECTION),

            where(

                "supplierId",

                "==",

                currentUser.uid

            ),

            orderBy(

                "createdAt",

                "desc"

            ),

            limit(5)

        );

        const snapshot =

            await getDocs(q);

        if (snapshot.empty) {

            recentOrdersContainer.innerHTML =

                `<p class="empty-state">
                    No recent orders.
                 </p>`;

            return;

        }

        snapshot.forEach((docSnap) => {

            const order =

                docSnap.data();

            const item =

                document.createElement("div");

            item.className =

                "dashboard-order-item";

            item.innerHTML = `

                <div>

                    <strong>

                        #${docSnap.id.slice(0,8)}

                    </strong>

                    <p>

                        ${order.customerName || "Customer"}

                    </p>

                </div>

                <div>

                    KES ${Number(
                        order.total || 0
                    ).toLocaleString()}

                </div>

                <span class="status-badge ${order.status}">

                    ${order.status}

                </span>

            `;

            recentOrdersContainer.appendChild(

                item

            );

        });

    }

    catch (error) {

        console.error(

            "Orders loading failed:",

            error

        );

    }

}

// ==========================================================
// Low Stock Products
// ==========================================================

async function loadLowStockProducts() {

    if (!lowStockContainer) {

        return;

    }

    lowStockContainer.innerHTML = "";

    try {

        const q = query(

            collection(db, PRODUCTS_COLLECTION),

            where(

                "supplierId",

                "==",

                currentUser.uid

            ),

            where(

                "stock",

                "<=",

                5

            ),

            orderBy(

                "stock"

            ),

            limit(5)

        );

        const snapshot =

            await getDocs(q);

        if (snapshot.empty) {

            lowStockContainer.innerHTML =

                `<p class="empty-state">
                    No low stock products.
                 </p>`;

            return;

        }

        snapshot.forEach((docSnap) => {

            const product =

                docSnap.data();

            const item =

                document.createElement("div");

            item.className =

                "low-stock-item";

            item.innerHTML = `

                <span>

                    ${product.productName}

                </span>

                <strong>

                    ${product.stock} left

                </strong>

            `;

            lowStockContainer.appendChild(

                item

            );

        });

    }

    catch (error) {

        console.error(

            "Low stock loading failed:",

            error

        );

    }

}

// ==========================================================
// Dashboard Initialization
// ==========================================================

async function initializeDashboard() {

    try {

        await requireSupplier();

        await Promise.all([

            loadSupplierProfile(),

            loadDashboardStats(),

            loadSalesSummary(),

            loadRecentProducts(),

            loadRecentOrders(),

            loadLowStockProducts()

        ]);

        startRealtimeListeners();

    }

    catch (error) {

        console.error(

            "Dashboard initialization failed:",

            error

        );

    }

}

// ==========================================================
// Real-time Dashboard Updates
// ==========================================================

function startRealtimeListeners() {

    if (!currentUser) {

        return;

    }

    onSnapshot(

        query(

            collection(db, ORDERS_COLLECTION),

            where(

                "supplierId",

                "==",

                currentUser.uid

            )

        ),

        () => {

            loadDashboardStats();

            loadRecentOrders();

            loadSalesSummary();

        }

    );

    onSnapshot(

        query(

            collection(db, PRODUCTS_COLLECTION),

            where(

                "supplierId",

                "==",

                currentUser.uid

            )

        ),

        () => {

            loadDashboardStats();

            loadRecentProducts();

            loadLowStockProducts();

        }

    );

}

// ==========================================================
// Logout
// ==========================================================

async function logoutSupplier() {

    try {

        await signOut(auth);

        window.location.href =

            "/supplier/login/";

    }

    catch (error) {

        console.error(

            "Logout failed:",

            error

        );

    }

}

logoutButton?.addEventListener(

    "click",

    logoutSupplier

);

// ==========================================================
// Start Dashboard
// ==========================================================

document.addEventListener(

    "DOMContentLoaded",

    initializeDashboard

);

// ==========================================================
// Exports
// ==========================================================

export {

    initializeDashboard,

    loadDashboardStats,

    loadSalesSummary,

    loadRecentProducts,

    loadRecentOrders,

    loadLowStockProducts,

    logoutSupplier

};
