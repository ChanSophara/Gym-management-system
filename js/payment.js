document.addEventListener('DOMContentLoaded', function() {
    const paymentCartItems = document.getElementById('payment-cart-items');
    const paymentTotalPrice = document.getElementById('payment-total-price');
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    const promoSection = document.getElementById('promo-section');
    const subtotalElement = document.getElementById('subtotal');
    const discountElement = document.getElementById('discount');
    
    // Load cart and initialize values
    let cart = CartManager.getCart();
    let activePromo = CartManager.getPromo();
    let subtotal = CartManager.calculateTotal();
    let discount = 0;
    let total = subtotal;

    // Promotion options
    const promotions = [
        { id: 'normal', name: 'Normal', discount: 0 },
        { id: 'newyear', name: 'New Year Special', discount: 10 },
        { id: 'friend', name: 'Bring a Friend', discount: 20 },
        { id: 'training', name: 'Personal Training', discount: 30 }
    ];

    // Function to update all displayed values
    function updateDisplay() {
        // Update cart items display
        paymentCartItems.innerHTML = cart.length === 0 
            ? '<li class="empty-cart">No items in cart</li>'
            : cart.map(item => `
                <li>
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                    <button class="remove-item" data-id="${item.id}">×</button>
                </li>
            `).join('');

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.getAttribute('data-id'));
                cart = cart.filter(item => item.id !== itemId);
                CartManager.saveCart(cart);
                updateValues();
            });
        });

        // Update promotion section
        if (promoSection) {
            promoSection.innerHTML = `
                <h3>Apply Promotion</h3>
                <div class="promo-options">
                    ${promotions.map(promo => `
                        <button class="promo-btn ${activePromo?.id === promo.id ? 'active' : ''}" 
                                data-id="${promo.id}" 
                                data-discount="${promo.discount}">
                            ${promo.name} (${promo.discount}% Off)
                        </button>
                    `).join('')}
                </div>
            `;

            // Add event listeners to promo buttons
            document.querySelectorAll('.promo-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const promoId = e.target.getAttribute('data-id');
                    const promoDiscount = parseInt(e.target.getAttribute('data-discount'));
                    
                    if (promoId === 'normal') {
                        activePromo = null;
                        CartManager.clearPromo();
                    } else {
                        activePromo = {
                            id: promoId,
                            name: promotions.find(p => p.id === promoId).name,
                            discount: promoDiscount
                        };
                        CartManager.applyPromo(activePromo);
                    }
                    
                    updateValues();
                });
            });
        }

        // Update price displays
        if (subtotalElement) subtotalElement.textContent = subtotal.toFixed(2);
        if (discountElement) discountElement.textContent = discount.toFixed(2);
        if (paymentTotalPrice) paymentTotalPrice.textContent = total.toFixed(2);
    }

    // Function to recalculate all values
    function updateValues() {
        subtotal = CartManager.calculateTotal();
        discount = activePromo ? subtotal * (activePromo.discount / 100) : 0;
        total = subtotal - discount;
        updateDisplay();
    }

    // Initial display
    updateValues();

    // Confirm payment
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', async function() {
            const paymentMethod = document.getElementById('payment-method')?.value || 'cash';
            const memberId = parseInt(localStorage.getItem('member_id'));
            
            if (!memberId || isNaN(memberId)) {
                alert('Please login to complete payment');
                window.location.href = 'login.html';
                return;
            }
            
            if (cart.length === 0) {
                alert('No items in cart to pay for');
                return;
            }
            
            // Prepare payment data
            const paymentData = {
                member_id: memberId,
                items: cart.map(item => ({
                    name: item.name,
                    price: item.price,
                    type: item.type
                })),
                total_amount: total,
                payment_method: paymentMethod,
                promo_used: activePromo ? activePromo.name : 'None'
            };
            
            // 1. Save to local storage
            let payments = JSON.parse(localStorage.getItem('gymPayments') || '[]');
            const localPayment = {
                ...paymentData,
                id: Date.now(),
                payment_date: new Date().toISOString()
            };
            payments.push(localPayment);
            localStorage.setItem('gymPayments', JSON.stringify(payments));

            // 2. Try to send to backend
            try {

                //me add te
                const paymentData = {
                    member_id: localStorage.getItem('member_id') || null,
                    items: cart.map(item => ({
                        name: item.name,
                        price: item.price,
                        type: item.type
                    })),
                    total_amount: total,
                    payment_method: document.getElementById('payment-method')?.value || 'cash',
                    promo_used: activePromo ? activePromo.name : 'None'
                };


                const response = await fetch('http://127.0.0.1:5002/payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(paymentData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Payment failed');
                }
                
                const data = await response.json();
                console.log('Payment successful:', data);
                
                // Update local storage with backend ID if needed
                localPayment.backend_id = data.payment_id;
                localStorage.setItem('gymPayments', JSON.stringify(payments));
                
                // Clear cart and promo
                CartManager.clearCart();
                CartManager.clearPromo();
                
                alert(`Payment successful! Thank you for your purchase.`);
                window.location.href = 'home.html';
                
            } catch (error) {
                console.error('Error processing payment:', error);
                alert('Payment saved locally. Will sync when online.');
            }
        });
    }
});