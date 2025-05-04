document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Clear all user data
            localStorage.removeItem('member_id');
            localStorage.removeItem('member_name');
            localStorage.removeItem('member_email');
            
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }
});