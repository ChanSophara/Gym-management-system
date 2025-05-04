// Base URL for API endpoints
const API_BASE_URL = 'http://localhost:5002';

// Helper function for making API requests
async function makeRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error making request:', error);
        throw error;
    }
}

// Member registration
async function registerMember(memberData) {
    return makeRequest(`${API_BASE_URL}/register`, 'POST', memberData);
}

// Member login
async function loginMember(credentials) {
    return makeRequest(`${API_BASE_URL}/login`, 'POST', credentials);
}

// Submit contact form
async function submitContactForm(contactData) {
    return makeRequest(`${API_BASE_URL}/contact`, 'POST', contactData);
}

// Process payment
async function processPayment(paymentData) {
    return makeRequest(`${API_BASE_URL}/payment`, 'POST', paymentData);
}

// Submit feedback
async function submitFeedback(feedbackData) {
    return makeRequest(`${API_BASE_URL}/feedback`, 'POST', feedbackData);
}

// Get all data from a table
async function getAllData(tableName) {
    return makeRequest(`${API_BASE_URL}/getData/${tableName}`);
}

// Get specific record by ID
async function getDataById(tableName, id) {
    return makeRequest(`${API_BASE_URL}/getData/${tableName}/${id}`);
}

// Example usage:
// getAllData('members').then(data => console.log(data));
// getDataById('members', 1).then(data => console.log(data));

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerMember,
        loginMember,
        submitContactForm,
        processPayment,
        submitFeedback,
        getAllData,
        getDataById
    };
}