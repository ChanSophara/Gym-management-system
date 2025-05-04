document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout');
    const registrationForm = document.getElementById('registrationForm');
    
    // Initialize date pickers
    flatpickr(".date-input", {
        dateFormat: "d/m/Y",
        allowInput: true,
        defaultDate: new Date(),
        onReady: function(selectedDates, dateStr, instance) {
            if (instance.input.id === 'join_date') {
                instance.setDate(new Date(), true);
            }
        }
    });
    
    // Initialize cart display
    updateCartDisplay();
    
    // Add to cart functionality
    document.querySelectorAll('.select-plan').forEach(button => {
        button.addEventListener('click', function() {
            const planName = this.getAttribute('data-name');
            const planPrice = parseFloat(this.getAttribute('data-price'));
            
            CartManager.addItem({
                id: Date.now(),
                type: 'membership',
                name: planName,
                price: planPrice,
                originalPrice: planPrice
            });
            
            updateCartDisplay();
        });
    });
    
    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (CartManager.getCart().length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = 'payments.html';
        });
    }
    
    // Registration form
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const phone = document.getElementById('phone').value.trim();
            const dob = document.getElementById('dob').value;
            const join_date = document.getElementById('join_date').value || formatDate(new Date());
            
            if (!name || !email || !password || !phone || !dob) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Validate password length
            if (password.length < 5) {
                alert('Password must be at least 5 characters long');
                return;
            }

            // Validate email format
            if (!validateEmail(email)) {
                alert('Please enter a valid email address');
                return;
            }

            // Validate date format
            if (!isValidDate(dob) || !isValidDate(join_date)) {
                alert('Please enter dates in DD/MM/YYYY format');
                return;
            }
            
            // Prepare member data
            const memberData = {
                id: Date.now(),
                name,
                email,
                password,
                phone,
                dob: formatDateForStorage(dob),
                join_date: formatDateForStorage(join_date)
            };

            // Add this helper function
            function validateEmail(email) {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            }
            
            // 1. Save to local storage
            let members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
            members.push(memberData);
            localStorage.setItem('gymMembers', JSON.stringify(members));
            
            // 2. Try to send to backend
            try {
                const response = await fetch('http://127.0.0.1:5002/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        phone,
                        dob: formatDateForStorage(dob),
                        join_date: formatDateForStorage(join_date)
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to register with backend');
                }
                
                const data = await response.json();
                // Update local storage with backend ID if needed
                memberData.backend_id = data.id;
                localStorage.setItem('gymMembers', JSON.stringify(members));
                
            } catch (error) {
                console.error('Error registering with backend:', error);
                // Data remains in local storage
            }
            
            // Auto-login
            localStorage.setItem('member_id', memberData.id);
            localStorage.setItem('member_name', memberData.name);
            
            alert('Registration successful! You are now logged in.');
            window.location.href = 'home.html';
        });
    }
    
    function updateCartDisplay() {
        if (!cartItems || !totalPriceElement) return;
        
        const cart = CartManager.getCart();
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<li class="empty-cart">Your cart is empty</li>';
            totalPriceElement.textContent = '0.00';
            return;
        }
        
        cart.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                <button class="remove-item" data-index="${index}" title="Remove item">
                    ×
                </button>
            `;
            cartItems.appendChild(li);
        });
        
        // Add remove event listeners
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                CartManager.removeItem(index);
                updateCartDisplay();
            });
        });
        
        totalPriceElement.textContent = CartManager.calculateTotal().toFixed(2);
    }
    
    // Helper function to validate date format
    function isValidDate(dateString) {
        const pattern = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/(19|20)\d{2}$/;
        return pattern.test(dateString);
    }
    
    // Helper function to format date for storage (convert to ISO string)
    function formatDateForStorage(dateString) {
        if (!dateString) return '';
        const parts = dateString.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]).toISOString();
    }
    
    // Helper function to format date as DD/MM/YYYY
    function formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
});