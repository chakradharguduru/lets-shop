// perform1.js

const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ";
const projectId = "shopping-7cc8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

export async function performPaymentLogic(orderCounter, totalPrice, products, isCreditPayment) {
    try {
        const customerId = Number(localStorage.getItem('customerId')); 

        // Calculate the credits to add based on total price
        const creditsToAdd = Math.floor(totalPrice / 100) * 5;

        // Fetch the current customer data
        const customerResponse = await fetch(`${baseFirestoreUrl}/Customers/${customerId}?key=${apiKey}`);
        const customerData = await customerResponse.json();
        let currentCreditScore = customerData.fields?.creditScore?.integerValue || 0;

        // Ensure that `currentCreditScore` is an integer
        currentCreditScore = parseInt(currentCreditScore, 10);

        let updatedCreditScore = currentCreditScore + creditsToAdd;

        // If paying with credit, subtract the used credit amount
        if (isCreditPayment) {
            const creditAmountUsed = Math.min(totalPrice, currentCreditScore);
            updatedCreditScore = currentCreditScore - creditAmountUsed + creditsToAdd;
        }

        // Preserve existing customer fields and update only the credit score
        const updatedCustomerFields = { ...customerData.fields, creditScore: { integerValue: updatedCreditScore } };

        await fetch(`${baseFirestoreUrl}/Customers/${customerId}?key=${apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: updatedCustomerFields })
        });

        console.log(`Updated customer ${customerId} credit score from ${currentCreditScore} to ${updatedCreditScore}`);

        // Update product inventory
        for (const item of products) {
            const productId = item.mapValue.fields.productId.integerValue;
            const orderedQuantity = item.mapValue.fields.quantity.integerValue;

            // Fetch the current product data from Inventory
            const productResponse = await fetch(`${baseFirestoreUrl}/Inventory/${productId}?key=${apiKey}`);
            const productData = await productResponse.json();
            const currentInventory = productData.fields?.quantity?.integerValue || 0;

            // Calculate new inventory and preserve existing fields
            const newInventory = currentInventory - orderedQuantity;
            const updatedProductFields = { ...productData.fields, quantity: { integerValue: newInventory } };

            // Update the inventory in Firestore
            await fetch(`${baseFirestoreUrl}/Inventory/${productId}?key=${apiKey}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: updatedProductFields })
            });

            console.log(`Updated product ${productId} inventory from ${currentInventory} to ${newInventory}`);
        }
    } catch (error) {
        console.error("Error in payment logic: ", error);
        throw error; // Propagate the error for handling in payment.js
    }
}

