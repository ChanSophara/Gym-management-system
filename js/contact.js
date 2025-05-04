document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('#contact-form form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate form
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            if (!name || !email || !subject || !message) {
                alert('Please fill in all fields');
                return;
            }
            
            const formData = {
                name,
                email,
                subject,
                message,
                timestamp: new Date().toISOString()
            };
            
            // 1. Save to local storage first
            let contacts = JSON.parse(localStorage.getItem('gymContacts') || '[]');
            contacts.push(formData);
            localStorage.setItem('gymContacts', JSON.stringify(contacts));
            
            // 2. Try to send to backend
            try {
                const response = await fetch('http://127.0.0.1:5002/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error('Failed to submit to backend');
                }
                
                // Optional: Mark as synced in local storage if you want
                formData.synced = true;
                localStorage.setItem('gymContacts', JSON.stringify(contacts));
                
            } catch (error) {
                console.error('Error sending to backend:', error);
                // Data remains in local storage for later sync
            }
            
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }
});