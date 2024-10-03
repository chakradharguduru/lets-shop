// admin.js

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', () => {
    // Optionally, clear any stored user data
    localStorage.removeItem('userEmail');
    alert('Logout Successful!');

    // Redirect to the login page
    window.location.href = 'index.html'; // Change to your login page file name
});
