const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ";
const projectId = "shopping-7cc8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

const productsContainer = document.getElementById('products');
const productModal = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductName = document.getElementById('modal-product-name');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const quantityInput = document.getElementById('quantity');
const addToCartButton = document.getElementById('add-to-cart');
const searchBar = document.getElementById('search-bar'); // Add search bar
const searchButton = document.getElementById('search-btn'); // Add search button

// Fetch products with optional search term
async function fetchProducts(searchTerm = '') {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        const products = productData.documents || [];

        // Filter products if search term is provided
        const filteredProducts = searchTerm
            ? products.filter(doc => doc.fields.productName.stringValue.toLowerCase().includes(searchTerm.toLowerCase()))
            : products;

        displayProducts(filteredProducts);
    } catch (error) {
        console.error("Error fetching products: ", error);
    }
}

// Display products in the product container
function displayProducts(products) {
    productsContainer.innerHTML = ''; // Clear the container

    if (products.length === 0) {
        productsContainer.textContent = "No products available.";
        return;
    }

    // Display each product
    products.forEach(doc => {
        const product = doc.fields;
        const productId = doc.name.split('/').pop(); // Extract product ID
        const productHtml = `
            <div class="product-card" onclick="openModal('${productId}')">
                <img src="${product.imageUrl.stringValue}" alt="${product.productName.stringValue}">
                <h3>${product.productName.stringValue}</h3>
            </div>
        `;
        productsContainer.innerHTML += productHtml;
    });
}

// Open the product modal with product details
function openModal(productId) {
    fetch(`${baseFirestoreUrl}/Inventory/${productId}?key=${apiKey}`)
        .then(response => response.json())
        .then(productData => {
            const product = productData.fields;
            modalProductImage.src = product.imageUrl.stringValue;
            modalProductName.textContent = product.productName.stringValue;
            modalProductDescription.textContent = product.description.stringValue;
            modalProductPrice.textContent = product.price.doubleValue;
            quantityInput.value = 1;

            addToCartButton.onclick = () => addToCart(productId, product, parseInt(quantityInput.value));
            productModal.style.display = 'block';
        })
        .catch(error => console.error("Error fetching product details: ", error));
}

// Close the modal
closeModal.onclick = function() {
    productModal.style.display = 'none';
};

window.onclick = function(event) {
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
};

// Handle quantity increase and decrease
document.getElementById('increase-quantity').onclick = function() {
    quantityInput.value = parseInt(quantityInput.value) + 1;
};

document.getElementById('decrease-quantity').onclick = function() {
    if (parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
    }
};

// Add product to the cart
async function addToCart(productId, product, quantity) {
    const customerId = Number(localStorage.getItem('customerId'));
    const price = product.price.doubleValue;
    const imageUrl = product.imageUrl.stringValue;
    const totalPrice = price * quantity;

    try {
        const response = await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`);
        const cartData = await response.json();
        let cartItems = cartData.fields?.items?.arrayValue?.values || [];

        const existingProductIndex = cartItems.findIndex(item => {
            const itemProductId = parseInt(item.mapValue.fields.productId.integerValue);
            return itemProductId === Number(productId);
        });

        if (existingProductIndex !== -1) {
            const existingProduct = cartItems[existingProductIndex];
            const existingQuantity = parseInt(existingProduct.mapValue.fields.quantity.integerValue);
            const updatedQuantity = existingQuantity + quantity;
            const updatedTotalPrice = updatedQuantity * price;

            cartItems[existingProductIndex] = {
                mapValue: {
                    fields: {
                        productId: { integerValue: Number(productId) },
                        quantity: { integerValue: updatedQuantity },
                        customerId: { integerValue: customerId },
                        productName: { stringValue: product.productName.stringValue },
                        price: { doubleValue: price },
                        imageUrl: { stringValue: imageUrl },
                        totalPrice: { doubleValue: updatedTotalPrice }
                    }
                }
            };
        } else {
            cartItems.push({
                mapValue: {
                    fields: {
                        productId: { integerValue: Number(productId) },
                        quantity: { integerValue: quantity },
                        customerId: { integerValue: customerId },
                        productName: { stringValue: product.productName.stringValue },
                        price: { doubleValue: price },
                        imageUrl: { stringValue: imageUrl },
                        totalPrice: { doubleValue: totalPrice }
                    }
                }
            });
        }

        const updateResponse = await fetch(`${baseFirestoreUrl}/cart/${customerId}?key=${apiKey}`, {
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

        if (updateResponse.ok) {
            alert('Product added to cart successfully!');
            productModal.style.display = 'none';
        } else {
            console.error("Error updating the cart: ", await updateResponse.json());
            alert('Failed to update cart.');
        }
    } catch (error) {
        console.error("Error adding to cart: ", error);
        alert('Failed to add product to cart.');
    }
}

// Search functionality: fetch products with the search term when search button is clicked
searchButton.addEventListener('click', () => {
    const searchTerm = searchBar.value.trim();
    fetchProducts(searchTerm);  // Call fetchProducts with the search term
});

// Fetch all products when the page loads
window.onload = () => fetchProducts();  // Load all products by default
