const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ";
const projectId = "shopping-7cc8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// DOM elements for read functionality
const readOptions = document.getElementById('read-options');
const readMethodSelect = document.getElementById('read-method');
const readResults = document.getElementById('read-results');
const readNameSection = document.getElementById('read-name');
const readCategorySection = document.getElementById('read-category');
const searchCategorySelect = document.getElementById('search-category');

// Pagination variables
let currentPage = 1;
let itemsPerPage = 10;
let allProducts = [];

// Show the read options when 'Read' is clicked
document.getElementById('read-btn').addEventListener('click', () => {
    readOptions.style.display = 'block';
    readResults.innerHTML = '';
});

// Fetch and populate categories in the dropdown
async function populateCategories() {
    try {
        const categoryResponse = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const categoryData = await categoryResponse.json();
        const categories = categoryData.documents || [];

        // Populate Read category dropdown
        searchCategorySelect.innerHTML = ''; // Clear previous options
        categories.forEach((doc) => {
            const categoryId = doc.name.split('/').pop();
            const categoryName = doc.fields.categoryName.stringValue;
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categoryName;
            searchCategorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching categories: ", error);
    }
}

// Handle the 'Read' operation based on the admin's selection
readMethodSelect.addEventListener('change', () => {
    const method = readMethodSelect.value;

    // Ensure both sections are hidden by default
    readNameSection.style.display = 'none';
    readCategorySection.style.display = 'none';

    // Display the correct section based on the selected method
    if (method === 'name') {
        readNameSection.style.display = 'block';
    } else if (method === 'category') {
        readCategorySection.style.display = 'block';
    } else if (method === 'all') {
        fetchAllProducts();
    }
});

// Fetch all products
async function fetchAllProducts() {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        allProducts = productData.documents || [];
        displayProducts(allProducts); // Initial display with current page
    } catch (error) {
        console.error("Error fetching all products: ", error);
    }
}

// Fetch products by name
document.getElementById('search-by-name').addEventListener('click', async () => {
    const productName = document.getElementById('search-name').value.trim();
    if (productName) {
        await fetchProductsByName(productName);
    }
});

// Fetch products by name
async function fetchProductsByName(name) {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        const products = (productData.documents || []).filter(doc => doc.fields.productName.stringValue.toLowerCase().includes(name.toLowerCase()));
        allProducts = products;
        displayProducts(products); // Display the filtered products
    } catch (error) {
        console.error("Error fetching products by name: ", error);
    }
}

// Fetch products by category
document.getElementById('search-by-category').addEventListener('click', async () => {
    const categoryId = document.getElementById('search-category').value;
    await fetchProductsByCategory(categoryId);
});

// Fetch products by category
async function fetchProductsByCategory(categoryId) {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Inventory?key=${apiKey}`);
        const productData = await response.json();
        const products = (productData.documents || []).filter(doc => doc.fields.categoryId.integerValue == categoryId);
        allProducts = products;
        displayProducts(products); // Display the filtered products
    } catch (error) {
        console.error("Error fetching products by category: ", error);
    }
}

// Display product data in the Read Results section with pagination
function displayProducts(products) {
    readResults.innerHTML = ''; // Clear previous results

    if (products.length === 0) {
        readResults.textContent = "No products found.";
        return;
    }

    // Pagination controls
    const totalPages = Math.ceil(products.length / itemsPerPage);
    updatePaginationControls(totalPages);

    // Determine the starting and ending indices for slicing the array
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Slice the products array for the current page
    const currentProducts = products.slice(startIndex, endIndex);

    currentProducts.forEach((doc) => {
        const product = doc.fields;
        const productHtml = `
            <div class="product-item">
                <h3>${product.productName.stringValue}</h3>
                <!-- Removed Product ID display -->
                <p><strong>Description:</strong> ${product.description.stringValue}</p>
                <!-- Removed Category ID display -->
                <p><strong>Price:</strong> $${product.price.doubleValue}</p>
                <p><strong>Quantity:</strong> ${product.quantity.integerValue}</p>
                <img src="${product.imageUrl.stringValue}" alt="Product Image" style="width: 100px;">
            </div>
        `;
        readResults.innerHTML += productHtml;
    });
}

// Update pagination controls based on the total pages
function updatePaginationControls(totalPages) {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    prevButton.style.display = currentPage > 1 ? 'inline' : 'none';
    nextButton.style.display = currentPage < totalPages ? 'inline' : 'none';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    // Event listeners for pagination buttons
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayProducts(allProducts);
        }
    };

    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayProducts(allProducts);
        }
    };
}

// Set the number of items per page
document.getElementById('set-items').addEventListener('click', () => {
    const inputItems = document.getElementById('items-per-page').value;
    itemsPerPage = inputItems ? parseInt(inputItems) : 10; // Default to 10 if input is empty
    currentPage = 1; // Reset to first page
    displayProducts(allProducts); // Redisplay products with new items per page
});

// Populate categories when the page loads
window.onload = populateCategories;
