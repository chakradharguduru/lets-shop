const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ";
const projectId = "shopping-7cc8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

const customerId = localStorage.getItem('customerId'); // Get the stored customer ID
const customerDetailsContainer = document.getElementById('customer-details');
const ordersContainer = document.getElementById('orders');

async function fetchCustomerDetails() {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Customers/${customerId}?key=${apiKey}`);
        const customerData = await response.json();

        if (customerData.fields) {
            const customer = customerData.fields;
            displayCustomerDetails(customer);
        } else {
            console.error("Customer not found.");
            customerDetailsContainer.textContent = "Customer not found.";
        }
    } catch (error) {
        console.error("Error fetching customer details: ", error);
    }
}

function displayCustomerDetails(customer) {
    customerDetailsContainer.innerHTML = `
        <h2>Customer Details</h2>
        <p>Name: ${customer.name.stringValue}</p>
        <p>Mobile: ${customer.mobile.integerValue}</p>
        <p>Email: ${customer.email.stringValue}</p>
        <p>Customer ID: ${customer.customerId.integerValue}</p>
        <p>Credit Score: ${customer.creditScore.integerValue}</p>
    `;
}

async function fetchOrders() {
    try {
        const response = await fetch(`${baseFirestoreUrl}/Orders?key=${apiKey}`);
        const ordersData = await response.json();
        const orders = ordersData.documents || [];

        const userOrders = orders.filter(order => order.fields.customerId.integerValue === Number(customerId));
        displayOrders(userOrders);
    } catch (error) {
        console.error("Error fetching orders: ", error);
    }
}

function displayOrders(orders) {
    ordersContainer.innerHTML = '<h2>Your Orders</h2>';

    if (orders.length === 0) {
        ordersContainer.innerHTML += "<p>No orders found.</p>";
        return;
    }

    orders.forEach(order => {
        const orderProducts = order.fields.order.arrayValue.values || [];
        const orderId = order.name.split('/').pop(); // Extract order ID

        ordersContainer.innerHTML += `<h3>Order ID: ${orderId}</h3>`;
        orderProducts.forEach(product => {
            const productName = product.mapValue.fields.productName.stringValue;
            const productQuantity = product.mapValue.fields.quantity.integerValue;

            ordersContainer.innerHTML += `
                <p>Product: ${productName}, Quantity: ${productQuantity}</p>
            `;
        });
    });
}

// Fetch customer details and orders when the page loads
window.onload = () => {
    if (customerId) {
        fetchCustomerDetails();
        fetchOrders();
    } else {
        customerDetailsContainer.textContent = "No customer ID found.";
    }
};
