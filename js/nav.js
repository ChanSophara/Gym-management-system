// nav.js - Shared navigation logic
document.addEventListener('DOMContentLoaded', function() {
    // Function to check if user is logged in
    function isLoggedIn() {
        return localStorage.getItem('member_id') !== null;
    }

    // Function to update navigation based on login status
    function updateNavigation() {
        const navItems = document.querySelectorAll('.navbar ul li a');
        const protectedRoutes = ['trainer.html', 'workouts.html', 'shops.html', 'contact.html', ];
        
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            
            // Check if this is a protected route
            if (protectedRoutes.includes(href)) {
                if (isLoggedIn()) {
                    item.parentElement.style.display = 'block'; // Show if logged in
                } else {
                    item.parentElement.style.display = 'none'; // Hide if logged out
                }
            }
            
            // Update login/logout button text
            if (href === 'login.html' && isLoggedIn()) {
                item.textContent = 'Logout';
                item.href = 'logout.html';
            } else if (href === 'logout.html' && !isLoggedIn()) {
                item.textContent = 'Login';
                item.href = 'login.html';
            }
        });
    }

    // Call the function when page loads
    updateNavigation();
});