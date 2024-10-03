// cart1.js

const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ"; // Replace with your actual API key
const projectId = "shopping-7cc8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Fetch cart items for the current customer
async function getCartItems(customerId) {
    try {
        const response = await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`);
        const cartData = await response.json();
        return cartData.fields?.items?.arrayValue?.values || []; // Get cart items or return an empty array
    } catch (error) {
        console.error("Error fetching cart items: ", error);
        return [];
    }
}

// Fetch product inventory from Firestore
async function getProductInventory(productId) {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory/${productId}?key=${apiKey}`);
        const productData = await response.json();
        return productData.fields?.quantity?.integerValue || 0; // Return available quantity or 0 if not found
    } catch (error) {
        console.error("Error fetching product inventory: ", error);
        return 0;
    }
}

// Perform cart validation before proceeding to the payment page
export async function performCartValidation() {
    try {
        // Get customer ID from local storage
        const customerId = Number(localStorage.getItem('customerId'));
        if (!customerId) {
            alert("No customer ID found. Please log in again.");
            return false;
        }

        // Fetch cart items for the current customer
        const cartItems = await getCartItems(customerId);

        // Check if the cart is empty
        if (cartItems.length === 0) {
            document.getElementById('cart-message').textContent = 'Your cart is empty.';
            return false; // Prevent proceeding to payment
        }

        // Validate each product's quantity against available inventory
        for (const item of cartItems) {
            const product = item.mapValue.fields;
            const productId = Number(product.productId.integerValue);
            const orderedQuantity = Number(product.quantity.integerValue);

            // Fetch the available quantity for the product from Firestore
            const availableQuantity = await getProductInventory(productId);

            // If the ordered quantity is more than available quantity, show an error message
            if (orderedQuantity > availableQuantity) {
                document.getElementById('cart-message').textContent = 
                    `The available quantity for ${product.productName.stringValue} is ${availableQuantity}. Please order below that.`;
                return false; // Prevent proceeding to payment
            }
        }

        // If all validations pass, allow proceeding to the payment page
        return true;
    } catch (error) {
        console.error("Error during cart validation: ", error);
        alert('An error occurred while validating your cart.');
        return false;
    }
}
