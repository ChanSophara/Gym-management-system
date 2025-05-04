document.addEventListener('DOMContentLoaded', function() {
    // Category filtering
    const categoryItems = document.querySelectorAll('.workout-categories li');
    const workoutCards = document.querySelectorAll('.workout-card');
    
    function filterWorkouts(category) {
        // Update active state
        categoryItems.forEach(item => item.classList.remove('active'));
        const activeItem = Array.from(categoryItems).find(item => 
            item.getAttribute('data-category') === category
        );
        if (activeItem) activeItem.classList.add('active');
        
        // Filter workouts
        workoutCards.forEach(card => {
            if (category === 'all') {
                card.style.display = 'block';
            } else {
                const categories = card.getAttribute('data-categories');
                if (categories && categories.includes(category)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }
    
    // Category click handler
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterWorkouts(category);
        });
    });
    
    
    
    // Book session buttons - updated selector to be more specific
    document.querySelectorAll('.workout-card .btn').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault(); // Prevent default form submission behavior
            
            const memberId = localStorage.getItem('member_id');
            
            if (!memberId) {
                alert('Please login to book a session');
                window.location.href = 'login.html';
                return;
            }
            
            const workoutCard = this.closest('.workout-card');
            if (!workoutCard) return;
            
            const workoutName = workoutCard.querySelector('h4')?.textContent || 'Unknown Workout';
            
            try {
                const response = await fetch('http://127.0.0.1:5002/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        member_id: memberId,
                        workout_name: workoutName
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to book session');
                }
                
                const data = await response.json();
                console.log('Booking successful:', data);
                
                // Store in local storage as fallback
                let bookings = JSON.parse(localStorage.getItem('gymBookings') || '[]');
                bookings.push({
                    id: Date.now(),
                    member_id: memberId,
                    workout_name: workoutName,
                    booking_date: new Date().toISOString(),
                    backend_id: data.booking_id
                });
                localStorage.setItem('gymBookings', JSON.stringify(bookings));
                
                // Show success message on the button itself
                this.textContent = '✓ Booked!';
                this.style.backgroundColor = '#4CAF50';
                this.disabled = true;
                
                // Optionally show a more prominent alert
                alert(`Successfully booked ${workoutName}!`);
                
            } catch (error) {
                console.error('Error booking session:', error);
                
                // Show error on the button
                this.textContent = 'Booking Failed!';
                this.style.backgroundColor = '#f44336';
                
                setTimeout(() => {
                    this.textContent = 'Book Session';
                    this.style.backgroundColor = '';
                }, 2000);
                
                alert('Error booking session. Please try again later.');
            }
        });
    });
});