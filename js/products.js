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
const categoryDropdown = document.getElementById('category-dropdown');

async function fetchCategories() {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const categoryData = await response.json();
        const categories = categoryData.documents || [];

        // Populate the category dropdown
        categoryDropdown.innerHTML = '<option value="">Select a category</option>'; // Default option
        categories.forEach(doc => {
            const categoryId = doc.name.split('/').pop(); // Get category ID from document name
            const categoryName = doc.fields.categoryName.stringValue;
            const option = document.createElement('option');
            option.value = categoryId; // Set value to category ID
            option.textContent = categoryName;
            categoryDropdown.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching categories: ", error);
    }
}


async function fetchProducts(categoryId = null) {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        const products = productData.documents || [];

        // If a specific category is selected, filter the products
        const filteredProducts = categoryId === null ? products : products.filter(doc => {
            const productCategoryId = parseInt(doc.fields.categoryId.integerValue); // Assuming categoryId is stored in Inventory
            return productCategoryId === categoryId;
        });

        displayProducts(filteredProducts);
    } catch (error) {
        console.error("Error fetching products: ", error);
    }
}


function displayProducts(products) {
    productsContainer.innerHTML = '';

    if (products.length === 0) {
        productsContainer.textContent = "No products available.";
        return;
    }

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

closeModal.onclick = function() {
    productModal.style.display = 'none';
};

window.onclick = function(event) {
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
};

document.getElementById('increase-quantity').onclick = function() {
    quantityInput.value = parseInt(quantityInput.value) + 1;
};

document.getElementById('decrease-quantity').onclick = function() {
    if (parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
    }
};

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

// Event listener for category selection
categoryDropdown.addEventListener('change', () => {
    const selectedCategoryId = categoryDropdown.value; // This is now the category ID
    fetchProducts(selectedCategoryId ? parseInt(selectedCategoryId) : null);  // Call fetchProducts with the selected category ID
});


// Fetch categories and products when the page loads
window.onload = () => {
    fetchCategories();
    fetchProducts();
};
