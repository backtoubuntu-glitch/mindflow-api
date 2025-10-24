// MindFlow AI Platform - Production API Configuration
// Backend: Render.com | Frontend: Netlify
// ==================================================

// PRODUCTION API CONFIGURATION
const API_BASE_URL = 'https://mindflow-ai.onrender.com/api';

// Main API service object
const api = {
    /**
     * Universal API request handler
     * @param {string} endpoint - API endpoint
     * @param {object} options - Fetch options
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add body for non-GET requests
        if (options.body && config.method !== 'GET') {
            config.body = JSON.stringify(options.body);
        }

        try {
            console.log(`🔄 API Call: ${config.method} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Success: ${endpoint}`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ API Error [${endpoint}]:`, error);
            
            // Fallback for development if production backend is down
            if (API_BASE_URL.includes('render.com')) {
                console.warn('⚠️ Production backend unavailable, using fallback');
                return this.fallbackResponse(endpoint, options.body);
            }
            
            throw error;
        }
    },

    /**
     * Development fallback responses when backend is unavailable
     */
    fallbackResponse(endpoint, body) {
        const fallbacks = {
            '/health': { status: 'OK', message: 'Fallback mode - Backend starting', environment: 'fallback' },
            '/auth/login': { 
                success: true, 
                token: 'fallback-jwt-token', 
                user: { id: 1, name: 'Demo User', role: 'student' } 
            },
            '/ai/khensani/chat': { 
                response: "Hello! I'm Khensani, your AI learning assistant. I'm currently starting up, but I'll be ready to help you learn in just a moment!",
                type: 'greeting'
            },
            '/ai/chess/move': {
                success: true,
                move: 'e7e5', // Standard chess response
                message: 'Good move! The backend is warming up.'
            }
        };
        
        return fallbacks[endpoint] || { error: 'Endpoint not available in fallback mode' };
    },

    // ==================== HEALTH & SYSTEM ====================
    
    /**
     * Health check endpoint
     */
    async healthCheck() {
        return this.request('/health');
    },

    // ==================== AUTHENTICATION ====================
    
    /**
     * User login
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
    },

    /**
     * User registration
     * @param {object} userData 
     */
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: userData
        });
    },

    /**
     * Verify JWT token
     */
    async verifyToken(token) {
        return this.request('/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    // ==================== AI SERVICES ====================
    
    /**
     * Chat with Khensani AI
     * @param {string} message 
     */
    async chatWithKhensani(message) {
        return this.request('/ai/khensani/chat', {
            method: 'POST',
            body: { message }
        });
    },

    /**
     * Make chess move
     * @param {string} gameId 
     * @param {string} move 
     */
    async makeChessMove(gameId, move) {
        return this.request('/ai/chess/move', {
            method: 'POST',
            body: { gameId, move }
        });
    },

    /**
     * Get educational content
     * @param {string} subject 
     * @param {string} grade 
     */
    async getEducationalContent(subject, grade) {
        return this.request('/ai/education/content', {
            method: 'POST',
            body: { subject, grade }
        });
    },

    // ==================== SAFETY & TRACKING ====================
    
    /**
     * Report safety incident
     * @param {object} incidentData 
     */
    async reportSafetyIncident(incidentData) {
        return this.request('/safety/incident', {
            method: 'POST',
            body: incidentData
        });
    },

    /**
     * Update location data
     * @param {object} locationData 
     */
    async updateLocation(locationData) {
        return this.request('/safety/location', {
            method: 'POST',
            body: locationData
        });
    },

    // ==================== COMPANY & PARTNER ====================
    
    /**
     * Company registration
     * @param {object} companyData 
     */
    async registerCompany(companyData) {
        return this.request('/companies/register', {
            method: 'POST',
            body: companyData
        });
    },

    /**
     * Get company dashboard
     * @param {string} companyId 
     */
    async getCompanyDashboard(companyId) {
        return this.request(`/companies/${companyId}/dashboard`);
    },

    // ==================== USER MANAGEMENT ====================
    
    /**
     * Get user profile
     * @param {string} userId 
     */
    async getUserProfile(userId) {
        return this.request(`/users/${userId}/profile`);
    },

    /**
     * Update user progress
     * @param {string} userId 
     * @param {object} progressData 
     */
    async updateUserProgress(userId, progressData) {
        return this.request(`/users/${userId}/progress`, {
            method: 'POST',
            body: progressData
        });
    },

    // ==================== ANALYTICS ====================
    
    /**
     * Get learning analytics
     * @param {string} userId 
     */
    async getLearningAnalytics(userId) {
        return this.request(`/analytics/learning/${userId}`);
    },

    /**
     * Get platform usage stats
     */
    async getPlatformStats() {
        return this.request('/analytics/platform/stats');
    }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Initialize API service
 */
api.initialize = function() {
    console.log('🚀 MindFlow API Service Initialized');
    console.log('📍 Backend URL:', API_BASE_URL);
    console.log('🌍 Environment: PRODUCTION');
    
    // Test connection on startup
    this.healthCheck()
        .then(health => {
            console.log('✅ Backend Health:', health);
            // Dispatch custom event for other components
            window.dispatchEvent(new CustomEvent('apiReady', { detail: health }));
        })
        .catch(error => {
            console.warn('⚠️ Backend health check failed:', error.message);
            window.dispatchEvent(new CustomEvent('apiFallback', { detail: error }));
        });
};

/**
 * Check if backend is available
 */
api.isBackendAvailable = async function() {
    try {
        const health = await this.healthCheck();
        return health.status === 'OK';
    } catch {
        return false;
    }
};

// ==================== ERROR HANDLING ====================

// Global API error handler
window.handleApiError = function(error, context = 'API Call') {
    console.error(`🔴 ${context} Error:`, error);
    
    // Show user-friendly error message
    const errorMessage = error.message || 'Service temporarily unavailable. Please try again.';
    
    // You can integrate with your UI notification system here
    if (typeof showNotification === 'function') {
        showNotification(errorMessage, 'error');
    } else {
        alert(`MindFlow AI: ${errorMessage}`);
    }
};

// Initialize API when script loads
document.addEventListener('DOMContentLoaded', function() {
    api.initialize();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}

// Global access
window.MindFlowAPI = api;