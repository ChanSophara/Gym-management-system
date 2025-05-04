document.addEventListener('DOMContentLoaded', function() {
    // Initialize date picker
    flatpickr(".date-input", {
        dateFormat: "d/m/Y",
        allowInput: true
    });

    // Load member data
    loadMemberData();
    
    // Modal functionality
    const editProfileModal = document.getElementById('edit-profile-modal');
    const changePasswordModal = document.getElementById('change-password-modal');
    
    // Open edit profile modal
    document.getElementById('edit-profile').addEventListener('click', function() {
        editProfileModal.style.display = 'block';
        populateEditForm();
    });
    
    // Open change password modal
    document.getElementById('change-password').addEventListener('click', function() {
        changePasswordModal.style.display = 'block';
    });
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            editProfileModal.style.display = 'none';
            changePasswordModal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === editProfileModal) {
            editProfileModal.style.display = 'none';
        }
        if (event.target === changePasswordModal) {
            changePasswordModal.style.display = 'none';
        }
    });
    
    // Form submissions
    document.getElementById('edit-profile-form').addEventListener('submit', updateProfile);
    document.getElementById('change-password-form').addEventListener('submit', changePassword);
    
    // Upgrade membership button
    document.getElementById('upgrade-membership').addEventListener('click', function() {
        window.location.href = 'member.html';
    });
    
    // Avatar upload button
    document.querySelector('.avatar-upload').addEventListener('click', function(e) {
        e.preventDefault();
        // In a real app, this would trigger a file upload dialog
        alert('Avatar upload functionality would go here');
    });
});

function loadMemberData() {
    // Get member ID from localStorage (set during login)
    const memberId = localStorage.getItem('member_id');
    
    if (!memberId) {
        alert('Please login to view your account');
        window.location.href = 'login.html';
        return;
    }
    
    // Try to get from backend first
    fetchMemberDataFromBackend(memberId)
        .then(member => {
            if (member) {
                displayMemberData(member);
            } else {
                // Fallback to local storage
                fetchMemberDataFromLocalStorage(memberId);
            }
        })
        .catch(error => {
            console.error('Error fetching from backend:', error);
            fetchMemberDataFromLocalStorage(memberId);
        });
    
    // Load activity data
    loadActivityData(memberId);
}

function fetchMemberDataFromBackend(memberId) {
    return fetch(`http://127.0.0.1:5002/getData/members/${memberId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Member not found in backend');
            }
            return response.json();
        });
}

function fetchMemberDataFromLocalStorage(memberId) {
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    const member = members.find(m => m.id == memberId);
    
    if (member) {
        displayMemberData(member);
    } else {
        alert('Member data not found');
        window.location.href = 'login.html';
    }
}

function displayMemberData(member) {
    // Basic info
    document.getElementById('profile-name').textContent = member.name;
    document.getElementById('account-fullname').textContent = member.name;
    document.getElementById('account-email').textContent = member.email;
    document.getElementById('account-phone').textContent = member.phone || 'Not provided';
    
    // Password (show as asterisks)
    document.getElementById('account-password').textContent = '••••••••';
    
    // Dates
    const dob = member.dob ? new Date(member.dob) : null;
    const joinDate = member.join_date ? new Date(member.join_date) : new Date();
    
    document.getElementById('account-dob').textContent = dob ? 
        `${dob.getDate()}/${dob.getMonth() + 1}/${dob.getFullYear()}` : 'Not provided';
    
    document.getElementById('account-joindate').textContent = 
        `${joinDate.getDate()}/${joinDate.getMonth() + 1}/${joinDate.getFullYear()}`;
    
    document.getElementById('member-since').textContent = 
        `Member since: ${joinDate.getFullYear()}`;
    
    // Membership info (simplified - in a real app this would come from payments)
    const membershipType = Math.random() > 0.5 ? 'Premium' : 'Standard';
    document.getElementById('membership-type').textContent = `${membershipType} Membership`;
    document.getElementById('membership-badge').textContent = membershipType;
    document.getElementById('membership-badge').className = `badge ${membershipType.toLowerCase()}`;
    
    // Set random expiry date (1 year from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.getElementById('membership-expiry').textContent = 
        `${expiryDate.getDate()}/${expiryDate.getMonth() + 1}/${expiryDate.getFullYear()}`;
    
    // Set price based on membership type
    document.getElementById('membership-price').textContent = 
        membershipType === 'Premium' ? '50' : '30';
}

function populateEditForm() {
    const memberId = localStorage.getItem('member_id');
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    const member = members.find(m => m.id == memberId);
    
    if (member) {
        document.getElementById('edit-fullname').value = member.name;
        document.getElementById('edit-email').value = member.email;
        document.getElementById('edit-phone').value = member.phone || '';
        
        if (member.dob) {
            const dob = new Date(member.dob);
            document.getElementById('edit-dob').value = 
                `${dob.getDate()}/${dob.getMonth() + 1}/${dob.getFullYear()}`;
        }
    }
}

function updateProfile(e) {
    e.preventDefault();
    
    const memberId = localStorage.getItem('member_id');
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    const memberIndex = members.findIndex(m => m.id == memberId);
    
    if (memberIndex === -1) {
        alert('Member not found');
        return;
    }
    
    // Get form values
    const name = document.getElementById('edit-fullname').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const dob = document.getElementById('edit-dob').value;
    
    if (!name || !email) {
        alert('Name and email are required');
        return;
    }
    
    // Update member data
    members[memberIndex] = {
        ...members[memberIndex],
        name,
        email,
        phone,
        dob: dob ? dob.split('/').reverse().join('-') : null
    };
    
    // Save to local storage
    localStorage.setItem('gymMembers', JSON.stringify(members));
    
    // Try to update backend
    updateMemberInBackend(members[memberIndex])
        .then(() => {
            alert('Profile updated successfully');
            document.getElementById('edit-profile-modal').style.display = 'none';
            loadMemberData(); // Refresh display
        })
        .catch(error => {
            console.error('Error updating backend:', error);
            alert('Profile updated locally. Will sync with backend when online.');
            document.getElementById('edit-profile-modal').style.display = 'none';
            loadMemberData(); // Refresh display
        });
}

function updateMemberInBackend(member) {
    return fetch(`http://127.0.0.1:5002/updateData/members/${member.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(member)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update member');
        }
        return response.json();
    });
}

function changePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('All fields are required');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    const memberId = localStorage.getItem('member_id');
    const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    const memberIndex = members.findIndex(m => m.id == memberId);
    
    if (memberIndex === -1) {
        alert('Member not found');
        return;
    }
    
    // In a real app, we would verify current password first
    // For demo purposes, we'll just update it
    
    // Update password
    members[memberIndex].password = newPassword;
    localStorage.setItem('gymMembers', JSON.stringify(members));
    
    // Try to update backend
    updatePasswordInBackend(memberId, newPassword)
        .then(() => {
            alert('Password updated successfully');
            document.getElementById('change-password-modal').style.display = 'none';
            document.getElementById('change-password-form').reset();
        })
        .catch(error => {
            console.error('Error updating password:', error);
            alert('Password updated locally. Will sync with backend when online.');
            document.getElementById('change-password-modal').style.display = 'none';
            document.getElementById('change-password-form').reset();
        });
}

function updatePasswordInBackend(memberId, newPassword) {
    return fetch(`http://127.0.0.1:5002/updatePassword`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            member_id: memberId,
            new_password: newPassword
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update password');
        }
        return response.json();
    });
}

function loadActivityData(memberId) {
    // Try to get from backend first
    fetch(`http://127.0.0.1:5002/getData/bookings?member_id=${memberId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch activities');
            return response.json();
        })
        .then(activities => {
            if (activities && activities.length > 0) {
                displayActivities(activities);
            } else {
                // Fallback to local storage
                const localActivities = JSON.parse(localStorage.getItem('gymBookings') || '[]');
                const memberActivities = localActivities.filter(a => a.member_id == memberId);
                displayActivities(memberActivities);
            }
        })
        .catch(error => {
            console.error('Error fetching activities:', error);
            // Fallback to local storage
            const localActivities = JSON.parse(localStorage.getItem('gymBookings') || '[]');
            const memberActivities = localActivities.filter(a => a.member_id == memberId);
            displayActivities(memberActivities);
        });
    
    // Set random stats (in a real app these would come from backend)
    document.getElementById('workouts-count').textContent = Math.floor(Math.random() * 50) + 10;
    document.getElementById('hours-trained').textContent = Math.floor(Math.random() * 100) + 20;
    document.getElementById('calories-burned').textContent = (Math.floor(Math.random() * 50000) + 10000).toLocaleString();
}

function displayActivities(activities) {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) return;
    
    // Clear existing activities
    activityFeed.innerHTML = '';
    
    // Sort by date (newest first)
    activities.sort((a, b) => {
        const dateA = new Date(a.booking_date || a.created_at);
        const dateB = new Date(b.booking_date || b.created_at);
        return dateB - dateA;
    });
    
    // Display up to 5 most recent activities
    const recentActivities = activities.slice(0, 5);
    
    if (recentActivities.length === 0) {
        activityFeed.innerHTML = '<p>No recent activities found</p>';
        return;
    }
    
    recentActivities.forEach(activity => {
        const activityDate = new Date(activity.booking_date || activity.created_at);
        const now = new Date();
        const timeDiff = now - activityDate;
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        let timeText;
        if (daysDiff === 0) {
            timeText = 'Today';
        } else if (daysDiff === 1) {
            timeText = 'Yesterday';
        } else if (daysDiff < 7) {
            timeText = `${daysDiff} days ago`;
        } else {
            timeText = activityDate.toLocaleDateString();
        }
        
        // Determine icon based on workout type
        let icon = '🏋️';
        const workoutName = activity.workout_name || '';
        if (workoutName.toLowerCase().includes('yoga')) icon = '🧘';
        if (workoutName.toLowerCase().includes('cardio')) icon = '🏃';
        if (workoutName.toLowerCase().includes('zumba')) icon = '💃';
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">${icon}</div>
            <div class="activity-content">
                <p>${workoutName ? `Attended <strong>${workoutName}</strong>` : 'Completed workout'}</p>
                <small class="activity-time">${timeText}</small>
            </div>
        `;
        
        activityFeed.appendChild(activityItem);
    });
}