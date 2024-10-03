const apiKey = "AIzaSyAK7cQRkjyMqrAKKPbXgdJ5qZb_Z5h6FwQ";
const projectId = "shopping-7cc8f";
const baseAuthUrl = `https://identitytoolkit.googleapis.com/v1/accounts`;
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Function to show the signup form
function showSignupForm() {
    document.getElementById('signup-section').style.display = 'block';
    document.getElementById('login-section').style.display = 'none';
}

// Function to show the login form
function showLoginForm() {
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

// Show the signup form when the "Sign up" link is clicked
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    showSignupForm();
});

// Show the login form when the "Login" link is clicked
document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

// Sign Up
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mobile = parseInt(document.getElementById('mobile').value, 10); // Ensure mobile is treated as a number

    try {
        // Create user with Google Auth
        const signupResponse = await fetch(`${baseAuthUrl}:signUp?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                returnSecureToken: true
            })
        });

        const signupData = await signupResponse.json();
        if (signupResponse.ok) {
            // Get the next customer ID
            const counterDoc = await fetch(`${baseFirestoreUrl}/Counters/customercounter?key=${apiKey}`);
            const counterData = await counterDoc.json();
            const currentCounter = parseInt(counterData.fields.customerCounter.integerValue, 10);
            const customerCounter = currentCounter + 1;

            // Add the customer to the Customers collection using customerCounter as document ID
            await fetch(`${baseFirestoreUrl}/Customers/${customerCounter}?key=${apiKey}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        customerId: { integerValue: customerCounter },
                        name: { stringValue: name },
                        email: { stringValue: email },
                        mobile: { integerValue: mobile }, // Store mobile as a number
                        creditScore: { integerValue: 0 } // Automatically assign credit score as 0
                    }
                })
            });

            // Update the customer counter in Firestore
            await fetch(`${baseFirestoreUrl}/Counters/customercounter?key=${apiKey}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        customerCounter: { integerValue: customerCounter }
                    }
                })
            });

            alert('Sign Up Successful!');
            document.getElementById('signup-form').reset();
            showLoginForm(); // Optionally show login form after signup
        } else {
            throw new Error(signupData.error.message);
        }
    } catch (error) {
        console.error("Error signing up: ", error);
        alert(error.message);
    }
});

// Login
// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const loginResponse = await fetch(`${baseAuthUrl}:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                returnSecureToken: true
            })
        });

        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
            // Save the user's email in local storage
            localStorage.setItem('userEmail', email);

            // Check if the logged-in email is the admin email
            if (email === 'boomboy151202@gmail.com') {
                window.location.href = 'admin.html'; // Redirect to the admin page
            } else {
                // Fetch customer ID from Firestore
                const customerResponse = await fetch(`${baseFirestoreUrl}/Customers?key=${apiKey}`);
                const customerData = await customerResponse.json();
                const customers = customerData.documents || [];
                let customerId = null;

                customers.forEach(doc => {
                    const customer = doc.fields;
                    if (customer.email.stringValue === email) {
                        customerId = customer.customerId.integerValue;
                    }
                });

                // Store customer ID in localStorage
                if (customerId) {
                    localStorage.setItem('customerId', customerId); // Store customer ID
                }

                alert('Login Successful!');
                window.location.href = 'home.html'; // Redirect to home page
            }
        } else {
            throw new Error(loginData.error.message);
        }
    } catch (error) {
        console.error("Error logging in: ", error);
        alert(error.message);
    }
});


// Initially show the login form
showLoginForm();
