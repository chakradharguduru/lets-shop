const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ";
const projectId = "shopping-7cc8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// DOM element for cart
const cartContainer = document.getElementById('cart');
const totalPriceElement = document.getElementById('total-price'); // Total price element

// Fetch and display cart items
async function fetchCartItems() {
    const customerId = Number(localStorage.getItem('customerId')); // Get customer ID as a number

    try {
        const response = await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`);
        const cartData = await response.json();
        const cartItems = cartData.fields?.items?.arrayValue?.values || []; // Get cart items

        displayCartItems(cartItems);
    } catch (error) {
        console.error("Error fetching cart items: ", error);
    }
}

function displayCartItems(cartItems) {
    cartContainer.innerHTML = ''; // Clear previous cart items
    let totalPrice = 0; // Initialize total price

    if (cartItems.length === 0) {
        cartContainer.textContent = "Your cart is empty.";
        totalPriceElement.textContent = `Total Price: $0.00`; // Update total price display
        return;
    }

    cartItems.forEach(item => {
        const product = item.mapValue.fields;
        const productId = Number(product.productId.integerValue); // Convert to number
        const quantity = product.quantity.integerValue;
        const productImage = product.imageUrl.stringValue; // Assume you have this field in Firestore
        const price = product.price.doubleValue;

        // Calculate total price for this item
        const itemTotalPrice = price * quantity;
        totalPrice += itemTotalPrice; // Add to total price

        const cartItemHtml = `
            <div class="cart-item" data-product-id="${productId}">
                <img src="${productImage}" alt="${product.productName.stringValue}" class="cart-product-image">
                <div>
                    <h4>${product.productName.stringValue}</h4>
                    <p>Price: $${price.toFixed(2)}</p>
                    <p class="item-total">Total: $${itemTotalPrice.toFixed(2)}</p> <!-- Item total price -->
                </div>
                <div class="quantity-container">
                    <button class="decrease-quantity">-</button>
                    <input type="number" value="${quantity}" min="1" class="quantity-input">
                    <button class="increase-quantity">+</button>
                </div>
                <div class="button-container">
                    <button class="ok-button">OK</button>
                    <button class="remove-button">Remove</button>
                </div>
            </div>
        `;

        // Append the cart item HTML to the cart container
        cartContainer.innerHTML += cartItemHtml; // Make sure to select your cart container properly
    });

    // Update the total price display
    totalPriceElement.textContent = `Total Price: $${totalPrice.toFixed(2)}`; // Show total price

    // Add event listeners for buttons
    addEventListeners();
}

// Add event listeners for cart item buttons
function addEventListeners() {
    const decreaseButtons = document.querySelectorAll('.decrease-quantity');
    const increaseButtons = document.querySelectorAll('.increase-quantity');
    const okButtons = document.querySelectorAll('.ok-button');
    const removeButtons = document.querySelectorAll('.remove-button');

    decreaseButtons.forEach(button => {
        button.onclick = function () {
            const quantityInput = this.parentElement.querySelector('.quantity-input');
            if (parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
            }
        };
    });

    increaseButtons.forEach(button => {
        button.onclick = function () {
            const quantityInput = this.parentElement.querySelector('.quantity-input');
            quantityInput.value = parseInt(quantityInput.value) + 1;
        };
    });

    okButtons.forEach(button => {
        button.onclick = function () {
            const cartItem = this.closest('.cart-item');
            const productId = Number(cartItem.dataset.productId); // Convert to number
            const quantityInput = cartItem.querySelector('.quantity-input');
            const newQuantity = parseInt(quantityInput.value);
            updateCartItem(productId, newQuantity);
        };
    });

    removeButtons.forEach(button => {
        button.onclick = function () {
            const cartItem = this.closest('.cart-item');
            const productId = Number(cartItem.dataset.productId); // Convert to number
            removeCartItem(productId);
        };
    });
}

// Update cart item in Firestore
async function updateCartItem(productId, quantity) {
    const customerId = Number(localStorage.getItem('customerId')); // Get customer ID as a number

    try {
        // Fetch current cart first
        const response = await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`);
        const cartData = await response.json();
        let cartItems = cartData.fields?.items?.arrayValue?.values || [];

        // Find the cart item to update
        const itemToUpdate = cartItems.find(item => 
            Number(item.mapValue.fields.productId.integerValue) === productId // Convert to number for comparison
        );

        if (itemToUpdate) {
            // Update quantity and total price
            itemToUpdate.mapValue.fields.quantity = { integerValue: quantity };
            const price = itemToUpdate.mapValue.fields.price.doubleValue;
            itemToUpdate.mapValue.fields.totalPrice = { doubleValue: price * quantity }; // Update total price

            // Send the updated item back to Firestore
            await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        items: {
                            arrayValue: {
                                values: cartItems
                            }
                        }
                    }
                })
            });

            alert('Cart updated successfully!');
            fetchCartItems(); // Refresh cart items after update
        } else {
            alert('Item not found in cart.');
        }
    } catch (error) {
        console.error("Error updating cart item: ", error);
        alert('Failed to update cart item.');
    }
}

// Remove cart item from Firestore
async function removeCartItem(productId) {
    const customerId = Number(localStorage.getItem('customerId')); // Get customer ID as a number

    try {
        // Fetch current cart first
        const response = await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`);
        const cartData = await response.json();
        let cartItems = cartData.fields?.items?.arrayValue?.values || [];

        // Remove the item from cartItems
        cartItems = cartItems.filter(item => Number(item.mapValue.fields.productId.integerValue) !== productId); // Convert to number

        // Update the cart in Firestore
        await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    items: {
                        arrayValue: {
                            values: cartItems
                        }
                    }
                }
            })
        });

        alert('Product removed from cart successfully!');
        fetchCartItems(); // Refresh cart items after removal
    } catch (error) {
        console.error("Error removing cart item: ", error);
        alert('Failed to remove cart item.');
    }
}

// Logout function
document.getElementById('logout-button').onclick = function () {
    localStorage.removeItem('customerId'); // Clear customer ID on logout
    window.location.href = 'index.html'; // Redirect to login page
};

import { performCartValidation } from './cart1.js';

const proceedPaymentButton = document.getElementById('proceed-payment-button');

// Add event listener to the "Proceed to Payment" button
proceedPaymentButton.addEventListener('click', async () => {
    try {
        // Perform validation before proceeding to payment
        const isValid = await performCartValidation();

        if (isValid) {
            // Redirect to the payment page if cart validation is successful
            window.location.href = 'payment.html';
        } else {
            // Handle validation failure
            alert('Cart validation failed. Please check your cart and try again.');
        }
    } catch (error) {
        console.error("Error during cart validation: ", error);
        alert('An error occurred while validating your cart.');
    }
});


// Load cart items when the page loads
window.onload = fetchCartItems;
