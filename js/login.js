// login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Basic client-side validation
            if (!email || !password) {
                document.getElementById('login-message').textContent = 'Please fill in all fields';
                document.getElementById('login-message').style.color = 'red';
                return;
            }
            
            try {
                const response = await fetch('http://127.0.0.1:5002/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Login failed');
                }
                
                const data = await response.json();
                
                // Store user data in localStorage
                localStorage.setItem('member_id', data.member.id);
                localStorage.setItem('member_name', data.member.name);
                localStorage.setItem('member_email', data.member.email);
                
                // Redirect to home page
                window.location.href = 'home.html';
                
            } catch (error) {
                console.error('Login error:', error);
                document.getElementById('login-message').textContent = error.message || 'Login failed. Please try again.';
                document.getElementById('login-message').style.color = 'red';
            }
        });
    }
});