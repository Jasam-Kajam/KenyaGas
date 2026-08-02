// ==========================================================
// Kenya Gas Marketplace
// File: assets/js/orders.js
// Version: 1.0.0
//
// Orders Management System
// ==========================================================


import {

    auth,

    db

} from "./firebase.js";


import {

    onAuthStateChanged

}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {

    collection,

    doc,

    getDoc

}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================================
// Collections
// ==========================================================

const ordersRef =

    collection(

        db,

        "orders"

    );


// ==========================================================
// DOM Elements
// ==========================================================

const ordersContainer =

    document.getElementById(

        "ordersContainer"

    );


const ordersLoader =

    document.getElementById(

        "ordersLoader"

    );


const emptyOrders =

    document.getElementById(

        "emptyOrders"

    );


const orderCount =

    document.getElementById(

        "orderCount"

    );


// ==========================================================
// State
// ==========================================================

let currentUser = null;


let userProfile = null;


let userRole = null;


let orders = [];


let loading = false;


// ==========================================================
// UI Helpers
// ==========================================================

function showLoader(){

    ordersLoader?.classList.remove(

        "d-none"

    );

}


function hideLoader(){

    ordersLoader?.classList.add(

        "d-none"

    );

}


function showEmpty(){

    emptyOrders?.classList.remove(

        "d-none"

    );

}


function hideEmpty(){

    emptyOrders?.classList.add(

        "d-none"

    );

}


// ==========================================================
// Load User Profile
// ==========================================================

async function loadUserProfile(uid){


    // Check customer profile

    const customerSnapshot =

        await getDoc(

            doc(

                db,

                "users",

                uid

            )

        );


    if(customerSnapshot.exists()){


        userProfile =

            customerSnapshot.data();


        userRole =

            "customer";


        return;


    }



    // Check supplier profile

    const supplierSnapshot =

        await getDoc(

            doc(

                db,

                "suppliers",

                uid

            )

        );


    if(supplierSnapshot.exists()){


        userProfile =

            supplierSnapshot.data();


        userRole =

            "supplier";


        return;


    }



    throw new Error(

        "User profile not found."

    );


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


            await loadUserProfile(

                user.uid

            );


            initializeOrders();



        }


        catch(error){


            console.error(

                error

            );


            alert(

                error.message

            );


        }


    }

);



// ==========================================================
// Initialize Orders
// ==========================================================

function initializeOrders(){


    if(userRole === "customer"){


        loadCustomerOrders();


    }


    else if(userRole === "supplier"){


        loadSupplierOrders();


    }


}

// ==========================================================
// Kenya Gas Marketplace
// Orders Management
// Part 2 - Loading & Rendering Orders
// ==========================================================

import {

    query,

    where,

    orderBy,

    getDocs

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================================
// Load Customer Orders
// ==========================================================

async function loadCustomerOrders(){

    if(loading){

        return;

    }


    loading = true;

    showLoader();


    try{


        const ordersQuery = query(

            ordersRef,

            where(

                "customerId",

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

                ordersQuery

            );



        orders = [];



        snapshot.forEach(

            (item)=>{


                orders.push({

                    id:item.id,

                    ...item.data()

                });


            }

        );



        renderOrders();



    }


    catch(error){


        console.error(

            "Customer orders error:",

            error

        );


        showError(

            "Unable to load orders."

        );


    }


    finally{


        loading = false;

        hideLoader();


    }


}


// ==========================================================
// Load Supplier Orders
// ==========================================================

async function loadSupplierOrders(){


    if(loading){

        return;

    }



    loading = true;

    showLoader();



    try{


        const ordersQuery = query(

            ordersRef,

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

                ordersQuery

            );



        orders = [];



        snapshot.forEach(

            (item)=>{


                orders.push({

                    id:item.id,

                    ...item.data()

                });


            }

        );



        renderOrders();



    }


    catch(error){


        console.error(

            "Supplier orders error:",

            error

        );


        showError(

            "Unable to load supplier orders."

        );


    }


    finally{


        loading = false;

        hideLoader();


    }


}



// ==========================================================
// Render Orders
// ==========================================================

function renderOrders(){


    if(!ordersContainer){

        return;

    }



    ordersContainer.replaceChildren();



    if(!orders.length){


        showEmpty();


        return;


    }



    hideEmpty();



    if(orderCount){

        orderCount.textContent =

            orders.length;

    }



    orders.forEach(

        (order)=>{


            ordersContainer.appendChild(

                createOrderCard(

                    order

                )

            );


        }

    );


}



// ==========================================================
// Create Order Card
// ==========================================================

function createOrderCard(order){


    const card =

        document.createElement(

            "article"

        );


    card.className =

        "order-card";



    const items =

        order.items || [];



    const productsHTML =

        items.map(

            item => `

<div class="order-item">

<img

src="${item.image || '/assets/images/placeholder.png'}"

alt="${escapeHTML(item.productName)}">


<div>

<h4>

${escapeHTML(item.productName)}

</h4>


<p>

Qty:

${item.quantity}

</p>


<p>

KES

${Number(item.price).toLocaleString()}

</p>

</div>


</div>

`

        )

        .join("");



    card.innerHTML = `

<div class="order-header">


<h3>

Order #${order.id.slice(0,8)}

</h3>


<span class="status-badge">

${formatStatus(order.orderStatus)}

</span>


</div>



<div class="order-products">

${productsHTML}

</div>



<div class="order-total">

Total:

KES ${Number(order.totalAmount).toLocaleString()}

</div>

<div class="order-payment">

${paymentBadge(order.paymentStatus)}

</div>


<div class="order-date">

${formatDate(order.createdAt)}

</div>


`;

addActionsToOrderCard(
    card,
    order
);
  
    return card;


}


// ==========================================================
// Helpers
// ==========================================================

function formatStatus(status){


    return String(status || "pending")

        .replace(

            /-/g,

            " "

        )

        .replace(

            /\b\w/g,

            letter =>

                letter.toUpperCase()

        );


}



function formatDate(timestamp){


    if(!timestamp){

        return "";

    }


    return timestamp.toDate()

        .toLocaleDateString(

            "en-KE",

            {

                day:"numeric",

                month:"short",

                year:"numeric"

            }

        );


}



function escapeHTML(value){


    return String(value || "")

        .replace(

            /[&<>"']/g,

            char => ({

                "&":"&amp;",

                "<":"&lt;",

                ">":"&gt;",

                '"':"&quot;",

                "'":"&#039;"

            }[char])

        );


}



function showError(message){


    if(!ordersContainer){

        return;

    }


    ordersContainer.innerHTML = `

<div class="alert alert-danger">

${message}

</div>

`;

}

// ==========================================================
// Kenya Gas Marketplace
// Orders Management
// Part 3 - Status Workflow
// ==========================================================

import {

    updateDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================================
// Order Status Flow
// ==========================================================

const ORDER_STATUS = {

    PENDING: "pending",

    CONFIRMED: "confirmed",

    PREPARING: "preparing",

    OUT_FOR_DELIVERY: "out_for_delivery",

    DELIVERED: "delivered",

    CANCELLED: "cancelled"

};



// ==========================================================
// Allowed Status Changes
// ==========================================================

const STATUS_TRANSITIONS = {


    pending: [

        ORDER_STATUS.CONFIRMED,

        ORDER_STATUS.CANCELLED

    ],


    confirmed: [

        ORDER_STATUS.PREPARING,

        ORDER_STATUS.CANCELLED

    ],


    preparing: [

        ORDER_STATUS.OUT_FOR_DELIVERY

    ],


    out_for_delivery: [

        ORDER_STATUS.DELIVERED

    ],


    delivered: [],


    cancelled: []

};



// ==========================================================
// Add Action Buttons To Cards
// ==========================================================

function getOrderActions(order){


    const currentStatus =

        order.orderStatus ||

        ORDER_STATUS.PENDING;



    const allowed =

        STATUS_TRANSITIONS[

            currentStatus

        ];



    if(!allowed?.length){

        return "";

    }



    return allowed.map(

        status => `

<button

class="order-action"

data-order-id="${order.id}"

data-status="${status}">

${formatStatus(status)}

</button>

`

    ).join("");

}



// ==========================================================
// Update Order Card With Actions
// ==========================================================

function addActionsToOrderCard(card, order){


    const actions =

        getOrderActions(

            order

        );


    if(!actions){

        return;

    }


    const wrapper =

        document.createElement(

            "div"

        );


    wrapper.className =

        "order-actions";


    wrapper.innerHTML =

        actions;


    card.appendChild(

        wrapper

    );


}



// ==========================================================
// Secure Status Update
// ==========================================================

async function updateOrderStatus(

    orderId,

    newStatus

){


    const order =

        orders.find(

            item =>

                item.id === orderId

        );



    if(!order){

        return;

    }



    const currentStatus =

        order.orderStatus ||

        ORDER_STATUS.PENDING;



    const allowed =

        STATUS_TRANSITIONS[

            currentStatus

        ];



    if(

        !allowed.includes(

            newStatus

        )

    ){

        alert(

            "Invalid status change."

        );

        return;

    }



    // Supplier permission check

    if(

        userRole === "supplier"

        &&

        order.supplierId !==

        currentUser.uid

    ){

        alert(

            "You cannot update this order."

        );

        return;

    }



    const confirmed =

        confirm(

            `Change order status to ${formatStatus(newStatus)}?`

        );



    if(!confirmed){

        return;

    }



    try{


        await updateDoc(

            doc(

                db,

                "orders",

                orderId

            ),

            {

                orderStatus:newStatus,

                updatedAt:

                    serverTimestamp()

            }

        );



        order.orderStatus =

            newStatus;



        renderOrders();



    }


    catch(error){


        console.error(

            "Status update failed:",

            error

        );


        alert(

            "Unable to update order."

        );


    }


}



// ==========================================================
// Order Action Listener
// ==========================================================

ordersContainer?.addEventListener(

    "click",

    (event)=>{


        const button =

            event.target.closest(

                ".order-action"

            );



        if(!button){

            return;

        }



        updateOrderStatus(

            button.dataset.orderId,

            button.dataset.status

        );


    }

);

// ==========================================================
// Kenya Gas Marketplace
// Orders Management
// Part 4 - Payment, Delivery & Notifications
// ==========================================================


// ==========================================================
// Payment Status
// ==========================================================

const PAYMENT_STATUS = {

    PENDING: "pending",

    PAID: "paid",

    FAILED: "failed",

    REFUNDED: "refunded"

};


// ==========================================================
// Update Payment Status
// ==========================================================

async function updatePaymentStatus(

    orderId,

    paymentStatus

){

    const order =

        orders.find(

            item =>

                item.id === orderId

        );


    if(!order){

        return;

    }


    try{


        await updateDoc(

            doc(

                db,

                "orders",

                orderId

            ),

            {

                paymentStatus,

                updatedAt:

                    serverTimestamp()

            }

        );


        order.paymentStatus =

            paymentStatus;


        renderOrders();


        triggerNotification(

            order,

            "payment"

        );


    }


    catch(error){


        console.error(

            "Payment update failed:",

            error

        );


        alert(

            "Unable to update payment status."

        );


    }


}



// ==========================================================
// Delivery Information Update
// ==========================================================

async function updateDeliveryDetails(

    orderId,

    deliveryData

){

    const order =

        orders.find(

            item =>

                item.id === orderId

        );


    if(!order){

        return;

    }



    try{


        await updateDoc(

            doc(

                db,

                "orders",

                orderId

            ),

            {


                deliveryAddress:

                    deliveryData.address,


                county:

                    deliveryData.county,


                town:

                    deliveryData.town,


                deliveryNotes:

                    deliveryData.notes || "",


                updatedAt:

                    serverTimestamp()


            }

        );


        Object.assign(

            order,

            deliveryData

        );


        renderOrders();


    }


    catch(error){


        console.error(

            error

        );


        alert(

            "Unable to update delivery details."

        );


    }


}



// ==========================================================
// Customer Cancellation Rules
// ==========================================================

async function cancelOrder(orderId){


    const order =

        orders.find(

            item =>

                item.id === orderId

        );


    if(!order){

        return;

    }



    const status =

        order.orderStatus;



    if(

        ![

            "pending",

            "confirmed"

        ].includes(status)

    ){

        alert(

            "This order can no longer be cancelled."

        );

        return;

    }



    const confirmed =

        confirm(

            "Cancel this order?"

        );



    if(!confirmed){

        return;

    }



    await updateOrderStatus(

        orderId,

        "cancelled"

    );


}



// ==========================================================
// Notification Hook
// ==========================================================

function triggerNotification(

    order,

    type

){


    /*
        Future integrations:

        - Firebase Cloud Messaging
        - Africa's Talking SMS
        - Email service
        - WhatsApp API

    */


    console.log(

        "Notification event:",

        {

            orderId:

                order.id,

            type

        }

    );


}



// ==========================================================
// Display Payment Badge
// ==========================================================

function paymentBadge(status){


    const value =

        status ||

        PAYMENT_STATUS.PENDING;



    return `

<span class="payment-status ${value}">

${value.toUpperCase()}

</span>

`;

}

// ==========================================================
// Kenya Gas Marketplace
// Orders Management
// Part 5 - Real-time Updates & Optimization
// ==========================================================

import {

    onSnapshot,

    limit,

    startAfter

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==========================================================
// Pagination
// ==========================================================

const PAGE_SIZE = 15;

let lastDocument = null;

let hasMoreOrders = true;

let unsubscribeOrders = null;


// ==========================================================
// Build Orders Query
// ==========================================================

function buildOrdersQuery(lastDoc = null) {

    const constraints = [

        where(

            userRole === "supplier"

                ? "supplierId"

                : "customerId",

            "==",

            currentUser.uid

        ),

        orderBy(

            "createdAt",

            "desc"

        ),

        limit(

            PAGE_SIZE

        )

    ];


    if (lastDoc) {

        constraints.push(

            startAfter(

                lastDoc

            )

        );

    }


    return query(

        ordersRef,

        ...constraints

    );

}



// ==========================================================
// Listen For Real-Time Orders
// ==========================================================

function startOrdersListener() {

    stopOrdersListener();


    unsubscribeOrders =

        onSnapshot(

            buildOrdersQuery(),

            (snapshot) => {

                orders = [];


                snapshot.forEach(

                    (document) => {

                        orders.push({

                            id: document.id,

                            ...document.data()

                        });

                    }

                );


                lastDocument =

                    snapshot.docs.at(-1) || null;


                hasMoreOrders =

                    snapshot.size === PAGE_SIZE;


                renderOrders();

            },

            (error) => {

                console.error(

                    "Orders listener:",

                    error

                );

            }

        );

}



// ==========================================================
// Stop Listener
// ==========================================================

function stopOrdersListener() {

    if (

        typeof unsubscribeOrders ===

        "function"

    ) {

        unsubscribeOrders();

        unsubscribeOrders = null;

    }

}



// ==========================================================
// Load More Orders
// ==========================================================

async function loadMoreOrders() {

    if (

        !hasMoreOrders ||

        !lastDocument

    ) {

        return;

    }


    try {

        const snapshot =

            await getDocs(

                buildOrdersQuery(

                    lastDocument

                )

            );


        snapshot.forEach(

            (document) => {

                orders.push({

                    id: document.id,

                    ...document.data()

                });

            }

        );


        lastDocument =

            snapshot.docs.at(-1) || lastDocument;


        hasMoreOrders =

            snapshot.size === PAGE_SIZE;


        renderOrders();

    }

    catch (error) {

        console.error(

            "Pagination error:",

            error

        );

    }

}



// ==========================================================
// Refresh Orders
// ==========================================================

const refreshOrdersButton =

    document.getElementById(

        "refreshOrders"

    );


refreshOrdersButton?.addEventListener(

    "click",

    () => {

        startOrdersListener();

    }

);



// ==========================================================
// Load More Button
// ==========================================================

const loadMoreButton =

    document.getElementById(

        "loadMoreOrders"

    );


loadMoreButton?.addEventListener(

    "click",

    loadMoreOrders

);



// ==========================================================
// Improve Initialization
// ==========================================================

function initializeOrders() {

    startOrdersListener();

}



// ==========================================================
// Cleanup
// ==========================================================

window.addEventListener(

    "beforeunload",

    () => {

        stopOrdersListener();

    }

);



// ==========================================================
// Optional Exports
// ==========================================================

export {

    initializeOrders,

    startOrdersListener,

    stopOrdersListener,

    loadMoreOrders

};
