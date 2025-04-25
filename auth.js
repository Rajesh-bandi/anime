// auth.js - Complete Authentication System
const API_URL = 'http://localhost:5000';

// Authentication functions
const Auth = {
    // Check if user is authenticated
    isAuthenticated: function() {
        return localStorage.getItem('authToken') !== null;
    },

    // Get current user
    getCurrentUser: function() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Set user session
    setSession: function(token, user) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
    },

    // Clear session
    clearSession: function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
    },

    // Verify token with server
    verifyToken: async function() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;
        
        try {
            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    },

    // Login function
    login: async function(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
    
            // First check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(text || 'Invalid response from server');
            }
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
    
            this.setSession(data.token, data.user);
            window.location.href = 'similar.html';
            return true;
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('error', error.message);
            return false;
        }
    },
    // Register function
    register: async function(username, email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
    
            // First check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(text || 'Invalid response from server');
            }
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
    
            this.showMessage('success', 'Registration successful! Please login.');
            document.querySelector('.login-section').classList.remove('active');
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('error', error.message);
            return false;
        }
    },
    // Logout function
    logout: function() {
        this.clearSession();
        window.location.href = 'login.html';
    },

    // Show message in forms
    showMessage: function(type, message) {
        const element = document.getElementById(`${type}Message`);
        if (element) {
            element.textContent = message;
            element.className = `form-message ${type}`;
            setTimeout(() => {
                element.textContent = '';
                element.className = 'form-message';
            }, 5000);
        }
    },

    // Update UI based on auth status
    updateUI: function() {
        const loginLinks = document.querySelectorAll('.login-link');
        const logoutLinks = document.querySelectorAll('.logout-link');
        const profileElements = document.querySelectorAll('.profile-element');
        const protectedElements = document.querySelectorAll('.protected');
        
        if (this.isAuthenticated()) {
            const user = this.getCurrentUser();
            loginLinks.forEach(link => link.style.display = 'none');
            logoutLinks.forEach(link => link.style.display = 'block');
            profileElements.forEach(el => {
                el.style.display = 'flex';
                if (el.querySelector('.username')) {
                    el.querySelector('.username').textContent = user?.username || 'Profile';
                }
            });
            protectedElements.forEach(el => el.style.display = 'block');
        } else {
            loginLinks.forEach(link => link.style.display = 'block');
            logoutLinks.forEach(link => link.style.display = 'none');
            profileElements.forEach(el => el.style.display = 'none');
            protectedElements.forEach(el => el.style.display = 'none');
        }
    },

    // Protect routes
    protectRoutes: async function() {
        const publicPages = ['login.html', 'similar.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!publicPages.includes(currentPage)) {
            const isValid = await this.verifyToken();
            if (!isValid && currentPage !== 'login.html') {
                window.location.href = 'login.html';
            }
        }
    },

    // Initialize auth system
    init: function() {
        // Check protected routes
        this.protectRoutes();
        
        // Update UI
        this.updateUI();
        
        // Add logout handlers
        document.querySelectorAll('.logout-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    
    // Login form handler
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await Auth.login(email, password);
        });
    }
    
    // Register form handler
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            
            if (!document.getElementById('agreeTerms').checked) {
                Auth.showMessage('error', 'You must agree to the terms');
                return;
            }
            
            await Auth.register(username, email, password);
        });
    }
});
// Add at the top of your login function:
console.log('Attempting login to:', `${API_URL}/auth/login`);
console.log('With data:', { email, password });

// Add at the top of your register function:
console.log('Attempting registration to:', `${API_URL}/auth/register`);
console.log('With data:', { username, email, password });


// Make Auth available globally
window.Auth = Auth;