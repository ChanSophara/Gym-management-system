document.addEventListener('DOMContentLoaded', function() {
    // Animated counters
    const counters = document.querySelectorAll('.counter');
    const speed = 200;
    
    counters.forEach(counter => {
        const updateCounter = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const increment = target / speed;
            
            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(updateCounter, 1);
            } else {
                counter.innerText = target;
            }
        };
        
        updateCounter();
    });
    
    // Promotion buttons
    document.querySelectorAll('.apply-promo').forEach(button => {
        button.addEventListener('click', function() {
            const promoType = this.getAttribute('data-promo');
            const discount = parseInt(this.getAttribute('data-discount'));
            const discountType = this.getAttribute('data-type');
            
            // Apply promotion to cart
            const cart = CartManager.getCart();
            const updatedCart = cart.map(item => {
                if ((discountType === 'membership' && item.type === 'membership') ||
                    (discountType === 'shop' && item.type === 'shop')) {
                    return {
                        ...item,
                        price: item.originalPrice * (1 - discount / 100),
                        discountApplied: true
                    };
                }
                return item;
            });
            
            CartManager.saveCart(updatedCart);
            CartManager.applyPromo({
                type: promoType,
                discount,
                discountType,
                applied: true
            });
            
            alert(`Promotion applied! You'll see the discount at checkout.`);
            window.location.href = 'payments.html';
        });
    });
});