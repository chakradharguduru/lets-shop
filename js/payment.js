const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ";
const projectId = "shopping-7cc8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;


const customerId = Number(localStorage.getItem('customerId')); // Assuming customerId is stored in local storage
const totalPriceElement = document.getElementById('total-price');
const creditScoreElement = document.getElementById('credit-score');
const creditScoreRequirement = document.getElementById('credit-score-requirement');

// Fetch cart items and calculate total price
let cartItems = [];
let totalPrice = 0;
let customerCreditScore = 0;

async function fetchCartAndCalculateTotal() {
    try {
        const response = await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`);
        const cartData = await response.json();

        cartItems = cartData.fields?.items?.arrayValue?.values || [];
        totalPrice = 0;

        cartItems.forEach(item => {
            const quantity = item.mapValue.fields.quantity?.integerValue;
            const price = item.mapValue.fields.price?.doubleValue;

            if (quantity === undefined || price === undefined) {
                console.warn("One of the item fields is undefined. Check Firestore data structure.");
                return; // Skip this item if any field is undefined
            }

            totalPrice += price * quantity; // Calculate total price
        });

        totalPriceElement.textContent = totalPrice.toFixed(2); // Display total price

    } catch (error) {
        console.error("Error fetching cart items: ", error);
    }
}

// Fetch customer credit score
async function fetchCustomerCreditScore() {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Customers/${customerId}?key=${apiKey}`);
        const customerData = await response.json();
        customerCreditScore = customerData.fields?.creditScore?.integerValue || 0;

        creditScoreElement.textContent = customerCreditScore; // Display credit score

        // Show/hide credit score payment option
        if (customerCreditScore >= 1000) {
            document.getElementById('pay-with-credit-button').style.display = 'inline-block'; // Show button
            creditScoreRequirement.style.display = 'none'; // Hide requirement
        } else {
            document.getElementById('pay-with-credit-button').style.display = 'none'; // Hide button
            creditScoreRequirement.style.display = 'block'; // Show requirement
        }
    } catch (error) {
        console.error("Error fetching customer credit score: ", error);
    }
}

import { performPaymentLogic } from './perform1.js';
// Function to create a new order with cash and credit fields
async function createOrder(isCreditPayment = false) { 
    try {
        // Fetch and increment the orderCounter
        const counterResponse = await fetch(`${baseFirestoreUrl}/Counters/orderCounter?key=${apiKey}`);
        const counterData = await counterResponse.json();
        let orderCounter = counterData.fields?.value?.integerValue || 0;

        // Increment the order counter
        orderCounter++;

        // Update the order counter in Firestore
        await fetch(`${baseFirestoreUrl}/Counters/orderCounter?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    value: { integerValue: orderCounter }
                }
            })
        });

        // Calculate cash and credit values
        let cashAmount = 0;
        let creditAmount = 0;

        if (isCreditPayment) {
            // If paying with credit
            if (customerCreditScore >= totalPrice) {
                creditAmount = totalPrice;
                cashAmount = 0;
            } else {
                creditAmount = customerCreditScore;
                cashAmount = totalPrice - customerCreditScore;
            }
        } else {
            // If paying with cash
            cashAmount = totalPrice;
            creditAmount = 0;
        }

        // Prepare the order data
        const orderData = {
            fields: {
                customerId: { integerValue: customerId },
                totalPrice: { doubleValue: totalPrice },
                dateTime: { timestampValue: new Date().toISOString() },
                cash: { doubleValue: cashAmount },
                credit: { doubleValue: creditAmount },
                products: {
                    arrayValue: {
                        values: cartItems.map(item => {
                            const productId = Number(item.mapValue.fields.productId?.integerValue);
                            const productName = item.mapValue.fields.productName?.stringValue;
                            const quantity = item.mapValue.fields.quantity?.integerValue;
                            const price = item.mapValue.fields.price?.doubleValue;
                            const imageUrl = item.mapValue.fields.imageUrl?.stringValue;
                            const totalProductPrice = price * quantity;

                            return {
                                mapValue: {
                                    fields: {
                                        productId: { integerValue: productId },
                                        productName: { stringValue: productName },
                                        quantity: { integerValue: quantity },
                                        price: { doubleValue: price },
                                        totalProductPrice: { doubleValue: totalProductPrice },
                                        imageUrl: { stringValue: imageUrl }
                                    }
                                }
                            };
                        })
                    }
                }
            }
        };

        // Save the new order document with the incremented orderCounter as the document ID
        await fetch(`${baseFirestoreUrl}/Orders/${orderCounter}?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        await performPaymentLogic(orderCounter, totalPrice, cartItems, isCreditPayment);


        // Show the order placed message
        displayOrderPlacedMessage();

        // Clear the cart after successful order
        await clearCart();

    } catch (error) {
        console.error("Error creating order: ", error);
        alert('Failed to place order. Please try again.');
    }
}

// Function to display the order placed message
function displayOrderPlacedMessage() {
    const messageElement = document.createElement('div');
    messageElement.textContent = 'Order placed successfully!';
    messageElement.style.color = 'green'; // Change this to your desired color
    messageElement.style.fontSize = '20px';
    messageElement.style.marginTop = '20px';
    
    // Append the message to the payment container
    document.querySelector('.payment-container').appendChild(messageElement);

    // Disable payment buttons
    document.getElementById('proceed-payment').disabled = true;
    document.getElementById('pay-with-credit-button').disabled = true;

    // Redirect to the home page after 3 seconds
    setTimeout(() => {
        window.location.href = 'home.html'; // Change to your home page URL
    }, 1000);
}

// Clear the cart after placing the order
async function clearCart() {
    try {
        await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`, {
            method: 'DELETE'
        });
        console.log("Cart cleared successfully.");
    } catch (error) {
        console.error("Error clearing cart: ", error);
    }
}

// Event listeners for payment buttons
document.getElementById('proceed-payment').onclick = () => createOrder(false); // Pay with cash
document.getElementById('pay-with-credit-button').onclick = () => createOrder(true); // Pay with credit

// Call the functions when the page loads
window.onload = () => {
    fetchCartAndCalculateTotal();
    fetchCustomerCreditScore();
};





