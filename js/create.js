const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ";
const projectId = "shopping-7cc8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const baseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o`;

// DOM elements for create functionality
const formSection = document.getElementById('form-section');
const createForm = document.getElementById('product-form');
const categorySelect = document.getElementById('category');

// Show the create form when 'Create' is clicked
document.getElementById('create-btn').addEventListener('click', () => {
    formSection.style.display = 'block';
    createForm.style.display = 'block';
});

// Fetch and populate categories in the dropdown
async function populateCategories() {
    try {
        const categoryResponse = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const categoryData = await categoryResponse.json();
        const categories = categoryData.documents || [];

        // Populate Create category dropdown
        categorySelect.innerHTML = ''; // Clear previous options
        categories.forEach((doc) => {
            const categoryId = doc.name.split('/').pop();
            const categoryName = doc.fields.categoryName.stringValue;
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching categories: ", error);
    }
}

// Add Product (Create)
createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productName = document.getElementById('product-name').value;
    const categoryId = document.getElementById('category').value;
    const price = parseFloat(document.getElementById('price').value);
    const quantity = parseInt(document.getElementById('quantity').value, 10);
    const description = document.getElementById('description').value;
    const imageFile = document.getElementById('image').files[0];

    try {
        // Upload image to Firebase Storage
        const formData = new FormData();
        formData.append('file', imageFile);

        const storageResponse = await fetch(`${baseStorageUrl}?uploadType=media&name=${imageFile.name}`, {
            method: 'POST',
            headers: { 'Content-Type': imageFile.type },
            body: imageFile
        });

        const storageData = await storageResponse.json();
        const imageUrl = `${baseStorageUrl}/${imageFile.name}?alt=media&token=${storageData.downloadTokens}`;

        // Get the next product ID
        const counterDoc = await fetch(`${baseFirestoreUrl}/Counters/productcounter?key=${apiKey}`);
        const counterData = await counterDoc.json();
        const currentCounter = parseInt(counterData.fields.productCounter.integerValue, 10);
        const productCounter = currentCounter + 1;

        // Add product to Inventory
        await fetch(`${baseFirestoreUrl}/Inventory/${productCounter}?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    productId: { integerValue: productCounter },
                    productName: { stringValue: productName },
                    categoryId: { integerValue: parseInt(categoryId, 10) },
                    price: { doubleValue: price },
                    quantity: { integerValue: quantity },
                    description: { stringValue: description },
                    imageUrl: { stringValue: imageUrl }
                }
            })
        });

        // Update product counter
        await fetch(`${baseFirestoreUrl}/Counters/productcounter?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: { productCounter: { integerValue: productCounter } }
            })
        });

        alert('Product added successfully!');
        createForm.reset();
    } catch (error) {
        console.error("Error adding product: ", error);
        alert(error.message);
    }
});

// Populate categories when the page loads
window.onload = populateCategories;
