const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ";
const projectId = "shopping-7cc8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Fetch and display existing categories
async function loadCategories() {
    try {
        // Fetch the Category collection from Firestore
        const categoriesResponse = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const categoriesData = await categoriesResponse.json();
        
        // Clear the current list
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';

        // Check if categories exist
        if (categoriesData.documents) {
            categoriesData.documents.forEach((doc) => {
                const categoryName = doc.fields.categoryName.stringValue;
                const listItem = document.createElement('li');
                listItem.textContent = categoryName;
                categoryList.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = 'No categories found.';
            categoryList.appendChild(listItem);
        }
    } catch (error) {
        console.error("Error fetching categories: ", error);
        alert("Could not load categories.");
    }
}

// Check if a category already exists
async function categoryExists(categoryName) {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Category?key=${apiKey}`);
        const data = await response.json();

        if (data.documents) {
            return data.documents.some(doc => doc.fields.categoryName.stringValue === categoryName);
        }
        return false;
    } catch (error) {
        console.error("Error checking category existence: ", error);
        return false;
    }
}

// Add new category
document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const categoryName = document.getElementById('category-name').value;

    // Check if the category already exists
    const exists = await categoryExists(categoryName);
    if (exists) {
        alert('Category already exists!');
        return;
    }

    try {
        // Get the next category ID from Firestore
        const counterDoc = await fetch(`${baseFirestoreUrl}/Counters/categorycounter?key=${apiKey}`);
        const counterData = await counterDoc.json();
        const currentCounter = parseInt(counterData.fields.categoryCounter.integerValue, 10);
        const categoryCounter = currentCounter + 1;

        // Add the new category to Firestore
        await fetch(`${baseFirestoreUrl}/Category/${categoryCounter}?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    categoryId: { integerValue: categoryCounter },
                    categoryName: { stringValue: categoryName }
                }
            })
        });

        // Update the category counter in Firestore
        await fetch(`${baseFirestoreUrl}/Counters/categorycounter?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    categoryCounter: { integerValue: categoryCounter }
                }
            })
        });

        alert('Category added successfully!');
        document.getElementById('category-form').reset();
        
        // Reload the list of categories after adding a new one
        loadCategories();
    } catch (error) {
        console.error("Error adding category: ", error);
        alert(error.message);
    }
});

// Load categories when the page is loaded
window.addEventListener('load', loadCategories);
