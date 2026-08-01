// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/my-products.js
// Version: 1.0.0
//
// Supplier Product Dashboard
// ==========================================================

import {

    auth,

    db,

    storage

} from "./firebase.js";


import {

    onAuthStateChanged

}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {

    collection,

    query,

    where,

    orderBy,

    getDocs,

    doc,

    getDoc

}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================================
// Collections
// ==========================================================

const productsRef =

    collection(

        db,

        "products"

    );


// ==========================================================
// DOM Elements
// ==========================================================

const productsContainer =

    document.getElementById(

        "productsContainer"

    );


const loader =

    document.getElementById(

        "productsLoader"

    );


const emptyState =

    document.getElementById(

        "emptyProducts"

    );


const searchInput =

    document.getElementById(

        "productSearch"

    );


const statusFilter =

    document.getElementById(

        "statusFilter"

    );


const sortSelect =

    document.getElementById(

        "sortProducts"

    );


// Dashboard statistics

const totalProductsElement =

    document.getElementById(

        "totalProducts"

    );


const activeProductsElement =

    document.getElementById(

        "activeProducts"

    );


const outOfStockElement =

    document.getElementById(

        "outOfStock"

    );


// ==========================================================
// State
// ==========================================================

let currentUser = null;


let supplier = null;


let products = [];


let filteredProducts = [];


let loading = false;


// ==========================================================
// UI Helpers
// ==========================================================

function showLoader(){

    loader?.classList.remove(

        "d-none"

    );

}


function hideLoader(){

    loader?.classList.add(

        "d-none"

    );

}


function showEmpty(){

    emptyState?.classList.remove(

        "d-none"

    );

}


function hideEmpty(){

    emptyState?.classList.add(

        "d-none"

    );

}


// ==========================================================
// Supplier Verification
// ==========================================================

async function loadSupplier(uid){

    const snapshot =

        await getDoc(

            doc(

                db,

                "suppliers",

                uid

            )

        );


    if(!snapshot.exists()){

        throw new Error(

            "Supplier profile not found."

        );

    }


    supplier = snapshot.data();


    if(

        supplier.status !==

        "approved"

    ){

        throw new Error(

            "Supplier account is not approved."

        );

    }

}



// ==========================================================
// Authentication
// ==========================================================

onAuthStateChanged(

    auth,

    async(user)=>{


        if(!user){


            window.location.replace(

                "/login"

            );


            return;


        }


        currentUser = user;


        try{


            await loadSupplier(

                user.uid

            );


            initializeDashboard();


        }


        catch(error){


            console.error(

                error

            );


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
// Dashboard Initialization
// ==========================================================

function initializeDashboard(){


    loadProducts();


}

// ==========================================================
// Kenya Gas Marketplace
// My Products
// Part 2 - Loading & Rendering
// ==========================================================


// ==========================================================
// Load Supplier Products
// ==========================================================

async function loadProducts(){

    if(loading){

        return;

    }


    loading = true;


    showLoader();


    try{


        const productsQuery = query(

            productsRef,

            where(

                "supplierId",

                "==",

                currentUser.uid

            ),

            orderBy(

                "createdAt",

                "desc"

            )

        );


        const snapshot =

            await getDocs(

                productsQuery

            );


        products = [];


        snapshot.forEach(

            (document)=>{


                products.push({

                    id: document.id,

                    ...document.data()

                });


            }

        );


        filteredProducts =

            [...products];


        updateStatistics();


        renderProducts();


    }


    catch(error){


        console.error(

            "Unable to load products:",

            error

        );


        productsContainer.innerHTML = `

<div class="alert alert-danger">

Unable to load your products.

Please try again.

</div>

`;


    }


    finally{


        loading = false;


        hideLoader();


    }


}


// ==========================================================
// Statistics
// ==========================================================

function updateStatistics(){


    const total =

        products.length;


    const active =

        products.filter(

            product =>

                product.status ===

                "active"

        ).length;



    const outOfStock =

        products.filter(

            product =>

                Number(

                    product.stock

                ) <= 0

        ).length;



    if(totalProductsElement){

        totalProductsElement.textContent =

            total;

    }


    if(activeProductsElement){

        activeProductsElement.textContent =

            active;

    }


    if(outOfStockElement){

        outOfStockElement.textContent =

            outOfStock;

    }

}



// ==========================================================
// Render Products
// ==========================================================

function renderProducts(){


    if(!productsContainer){

        return;

    }


    productsContainer.replaceChildren();



    if(!filteredProducts.length){


        showEmpty();


        return;


    }


    hideEmpty();



    filteredProducts.forEach(

        (product)=>{


            const card =

                createProductCard(

                    product

                );


            productsContainer.appendChild(

                card

            );


        }

    );


}



// ==========================================================
// Product Card
// ==========================================================

function createProductCard(product){


    const article =

        document.createElement(

            "article"

        );


    article.className =

        "supplier-product-card";



    const stockStatus =

        Number(

            product.stock

        ) > 0

        ? "In Stock"

        : "Out of Stock";



    article.innerHTML = `

<div class="product-image">

<img

src="${product.images?.[0] || '/assets/images/placeholder.png'}"

alt="${escapeHTML(product.productName)}"

loading="lazy">

</div>


<div class="product-content">


<h3>

${escapeHTML(product.productName)}

</h3>


<p>

${escapeHTML(product.brand || "")}

</p>


<div class="product-price">

KES ${Number(product.price).toLocaleString()}

</div>


<span class="stock-badge">

${stockStatus}

</span>


<div class="product-meta">

<span>

Views:

${product.views || 0}

</span>


<span>

Rating:

${product.rating || 0}

★

</span>

</div>


<div class="product-actions">


<a

href="/supplier/edit-product?id=${product.id}"

class="btn-edit">

Edit

</a>


<button

class="btn-toggle"

data-id="${product.id}">

${product.status === "active"

? "Disable"

: "Activate"}

</button>


<button

class="btn-delete"

data-id="${product.id}">

Delete

</button>


</div>


</div>

`;


    return article;


}


// ==========================================================
// Escape HTML Security Helper
// ==========================================================

function escapeHTML(value){

    return String(value || "")

        .replace(

            /[&<>"']/g,

            (char)=>({

                "&":"&amp;",

                "<":"&lt;",

                ">":"&gt;",

                '"':"&quot;",

                "'":"&#039;"

            }[char])

        );

}

// ==========================================================
// Kenya Gas Marketplace
// My Products
// Part 3 - Search, Filter & Sort
// ==========================================================


// ==========================================================
// Search Products
// ==========================================================

function searchProducts(){

    const keyword =

        searchInput.value

            .toLowerCase()

            .trim();


    if(!keyword){

        filteredProducts =

            [...products];


        renderProducts();

        return;

    }



    filteredProducts =

        products.filter(

            (product)=>{


                const searchable = [

                    product.productName,

                    product.brand,

                    product.category,

                    product.cylinderSize,

                    product.gasType,

                    product.county,

                    product.town

                ]

                .join(" ")

                .toLowerCase();



                return searchable.includes(

                    keyword

                );


            }

        );


    renderProducts();


}


// ==========================================================
// Status Filter
// ==========================================================

function filterByStatus(){


    const status =

        statusFilter.value;



    if(!status || status === "all"){


        filteredProducts =

            [...products];


        renderProducts();


        return;

    }



    filteredProducts =

        products.filter(

            product =>

                product.status === status

        );


    renderProducts();


}



// ==========================================================
// Sorting
// ==========================================================

function sortProducts(){


    const sortValue =

        sortSelect.value;



    filteredProducts.sort(

        (a,b)=>{


            switch(sortValue){


                case "price-low":


                    return (

                        Number(a.price)

                        -

                        Number(b.price)

                    );



                case "price-high":


                    return (

                        Number(b.price)

                        -

                        Number(a.price)

                    );



                case "stock-high":


                    return (

                        Number(b.stock)

                        -

                        Number(a.stock)

                    );



                case "stock-low":


                    return (

                        Number(a.stock)

                        -

                        Number(b.stock)

                    );



                case "views":


                    return (

                        Number(b.views || 0)

                        -

                        Number(a.views || 0)

                    );



                default:


                    return 0;


            }


        }

    );


    renderProducts();


}



// ==========================================================
// Stock Status Helper
// ==========================================================

function getStockStatus(stock){


    const quantity =

        Number(stock);



    if(quantity <= 0){


        return {

            text:"Out of Stock",

            className:"danger"

        };


    }



    if(quantity <= 5){


        return {

            text:"Low Stock",

            className:"warning"

        };


    }



    return {

        text:"Available",

        className:"success"

    };


}



// ==========================================================
// Enhanced Product Card Stock
// ==========================================================

function updateStockBadge(card, stock){


    const badge =

        card.querySelector(

            ".stock-badge"

        );


    if(!badge){

        return;

    }



    const status =

        getStockStatus(

            stock

        );


    badge.textContent =

        status.text;


    badge.className =

        `stock-badge ${status.className}`;


}



// ==========================================================
// Events
// ==========================================================

searchInput?.addEventListener(

    "input",

    searchProducts

);



statusFilter?.addEventListener(

    "change",

    filterByStatus

);



sortSelect?.addEventListener(

    "change",

    sortProducts

);

// ==========================================================
// Kenya Gas Marketplace
// My Products
// Part 4 - Product Actions
// ==========================================================

import {

    updateDoc,

    deleteDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {

    ref,

    deleteObject

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


// ==========================================================
// Product Actions Listener
// ==========================================================

productsContainer?.addEventListener(

    "click",

    async (event)=>{


        const editButton =

            event.target.closest(

                ".btn-edit"

            );


        const toggleButton =

            event.target.closest(

                ".btn-toggle"

            );


        const deleteButton =

            event.target.closest(

                ".btn-delete"

            );



        if(editButton){

            return;

        }



        if(toggleButton){


            const id =

                toggleButton.dataset.id;


            await toggleProductStatus(

                id

            );


        }



        if(deleteButton){


            const id =

                deleteButton.dataset.id;


            await deleteProduct(

                id

            );


        }


    }

);



// ==========================================================
// Toggle Product Status
// ==========================================================

async function toggleProductStatus(productId){


    const product =

        products.find(

            item =>

                item.id === productId

        );


    if(!product){

        return;

    }



    const newStatus =

        product.status === "active"

        ? "disabled"

        : "active";



    const confirmed =

        confirm(

            `Change product status to ${newStatus}?`

        );



    if(!confirmed){

        return;

    }



    try{


        await updateDoc(

            doc(

                db,

                "products",

                productId

            ),

            {

                status:newStatus,

                updatedAt:

                    serverTimestamp()

            }

        );



        product.status =

            newStatus;



        updateStatistics();


        renderProducts();



    }

    catch(error){


        console.error(

            error

        );


        alert(

            "Unable to update product status."

        );


    }


}



// ==========================================================
// Delete Product Images
// ==========================================================

async function deleteProductImages(images=[]){


    for(

        const imageURL of images

    ){


        try{


            const imageRef =

                ref(

                    storage,

                    imageURL

                );


            await deleteObject(

                imageRef

            );


        }


        catch(error){


            console.warn(

                "Image delete failed:",

                error

            );


        }


    }


}



// ==========================================================
// Delete Product
// ==========================================================

async function deleteProduct(productId){


    const product =

        products.find(

            item =>

                item.id === productId

        );



    if(!product){

        return;

    }



    const confirmed =

        confirm(

            `Delete "${product.productName}" permanently?`

        );



    if(!confirmed){

        return;

    }



    try{


        await deleteProductImages(

            product.images || []

        );



        await deleteDoc(

            doc(

                db,

                "products",

                productId

            )

        );



        products =

            products.filter(

                item =>

                    item.id !== productId

            );



        filteredProducts =

            filteredProducts.filter(

                item =>

                    item.id !== productId

            );



        updateStatistics();


        renderProducts();



        alert(

            "Product deleted successfully."

        );


    }


    catch(error){


        console.error(

            "Delete failed:",

            error

        );


        alert(

            "Unable to delete product."

        );


    }


}

// ==========================================================
// Kenya Gas Marketplace
// My Products
// Part 5 - Final Optimization
// ==========================================================


// ==========================================================
// Pagination State
// ==========================================================

const PRODUCTS_PER_PAGE = 12;

let currentPage = 1;


// ==========================================================
// Pagination Elements
// ==========================================================

const paginationContainer =

    document.getElementById(

        "productsPagination"

    );


// ==========================================================
// Paginate Products
// ==========================================================

function getPaginatedProducts(){


    const start =

        (currentPage - 1)

        *

        PRODUCTS_PER_PAGE;


    const end =

        start +

        PRODUCTS_PER_PAGE;


    return filteredProducts.slice(

        start,

        end

    );


}



// ==========================================================
// Render Pagination
// ==========================================================

function renderPagination(){


    if(!paginationContainer){

        return;

    }



    paginationContainer.replaceChildren();



    const totalPages =

        Math.ceil(

            filteredProducts.length /

            PRODUCTS_PER_PAGE

        );



    if(totalPages <= 1){

        return;

    }



    for(

        let page = 1;

        page <= totalPages;

        page++

    ){


        const button =

            document.createElement(

                "button"

            );



        button.className =

            page === currentPage

            ? "active"

            : "";



        button.textContent =

            page;



        button.addEventListener(

            "click",

            ()=>{


                currentPage = page;


                renderProducts();


            }

        );



        paginationContainer.appendChild(

            button

        );


    }


}



// ==========================================================
// Override Render With Pagination
// ==========================================================

const originalRenderProducts =

    renderProducts;



renderProducts = function(){


    if(!productsContainer){

        return;

    }



    productsContainer.replaceChildren();



    const pageProducts =

        getPaginatedProducts();



    if(!pageProducts.length){


        showEmpty();


        return;


    }



    hideEmpty();



    pageProducts.forEach(

        product => {


            productsContainer.appendChild(

                createProductCard(

                    product

                )

            );


        }

    );


    renderPagination();


};



// ==========================================================
// Refresh Dashboard
// ==========================================================

const refreshButton =

    document.getElementById(

        "refreshProducts"

    );



refreshButton?.addEventListener(

    "click",

    ()=>{


        currentPage = 1;


        loadProducts();


    }

);



// ==========================================================
// Reset Page When Filtering
// ==========================================================

searchInput?.addEventListener(

    "input",

    ()=>{


        currentPage = 1;


    }

);


statusFilter?.addEventListener(

    "change",

    ()=>{


        currentPage = 1;


    }

);


sortSelect?.addEventListener(

    "change",

    ()=>{


        currentPage = 1;


    }

);



// ==========================================================
// Cleanup
// ==========================================================

window.addEventListener(

    "beforeunload",

    ()=>{


        products = [];


        filteredProducts = [];


    }

);



// ==========================================================
// Final Dashboard Start
// ==========================================================

function startDashboard(){


    showLoader();


    loadProducts();


}


// ==========================================================
// Export
// ==========================================================

export {

    loadProducts,

    renderProducts

};