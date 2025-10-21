class APIService {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' ? 
            'http://localhost:3000/api' : '/api';
        this.authToken = localStorage.getItem('mindflow_token');
        this.pendingRequests = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    async request(endpoint, options = {}) {
        const requestId = this.generateRequestId();
        const url = \\\\;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.authToken && { 'Authorization': \Bearer \\ })
            },
            signal: this.createAbortSignal(requestId)
        };

        const config = { ...defaultOptions, ...options };

        try {
            this.pendingRequests.set(requestId, { url, config });
            
            const response = await fetch(url, config);
            const result = await this.handleResponse(response, requestId);
            
            return result;
        } catch (error) {
            throw this.handleError(error, requestId);
        } finally {
            this.pendingRequests.delete(requestId);
        }
    }

    createAbortSignal(requestId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        // Store cleanup function
        this.pendingRequests.set(requestId + '_cleanup', () => clearTimeout(timeoutId));
        
        return controller.signal;
    }

    async handleResponse(response, requestId) {
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            const error = new Error(data.message || \HTTP \\);
            error.status = response.status;
            error.data = data;
            error.requestId = requestId;
            throw error;
        }

        // Log successful request for debugging
        this.logRequest('success', requestId, response.status);
        
        return data;
    }

    handleError(error, requestId) {
        this.logRequest('error', requestId, error.status, error.message);
        
        if (error.name === 'AbortError') {
            error.message = 'Request timeout. Please check your connection.';
        }
        
        if (error.status === 401) {
            this.handleUnauthorized();
        }
        
        if (error.status === 429) {
            error.message = 'Too many requests. Please wait a moment.';
        }
        
        if (error.status >= 500) {
            error.message = 'Server error. Please try again later.';
        }
        
        return error;
    }

    handleUnauthorized() {
        localStorage.removeItem('mindflow_token');
        localStorage.removeItem('mindflow_user');
        
        // Show notification if we have the app instance
        if (window.mindFlowApp) {
            window.mindFlowApp.showNotification('Session expired. Please login again.', 'error');
        }
        
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    }

    logRequest(status, requestId, statusCode, errorMessage = '') {
        const logEntry = {
            requestId,
            status,
            statusCode,
            timestamp: new Date().toISOString(),
            errorMessage
        };
        
        // Store last 100 requests for debugging
        const requestLog = JSON.parse(localStorage.getItem('mindflow_request_log') || '[]');
        requestLog.push(logEntry);
        localStorage.setItem('mindflow_request_log', JSON.stringify(requestLog.slice(-100)));
    }

    generateRequestId() {
        return 'req_' + Math.random().toString(36).substr(2, 9);
    }

    // Auth endpoints
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        const result = await this.request('/auth/logout', {
            method: 'POST'
        });
        
        // Clear local storage regardless of API response
        this.clearAuth();
        
        return result;
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async refreshToken() {
        return this.request('/auth/refresh-token', {
            method: 'POST'
        });
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async resetPassword(token, newPassword) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword })
        });
    }

    // User endpoints
    async getUserProfile() {
        return this.request('/users/profile');
    }

    async updateUserProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async updateAvatar(formData) {
        return this.request('/users/avatar', {
            method: 'PUT',
            headers: {
                'Authorization': \Bearer \\
            },
            body: formData
        });
    }

    async changePassword(passwordData) {
        return this.request('/users/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    }

    // Progress endpoints
    async getLearningProgress() {
        return this.request('/users/progress');
    }

    async updateProgress(progressData) {
        return this.request('/users/progress', {
            method: 'POST',
            body: JSON.stringify(progressData)
        });
    }

    async getAchievements() {
        return this.request('/users/achievements');
    }

    // Company endpoints
    async registerCompany(companyData) {
        return this.request('/companies/register', {
            method: 'POST',
            body: JSON.stringify(companyData)
        });
    }

    async getCompanyProfile() {
        return this.request('/companies/profile');
    }

    async updateCompanyProfile(profileData) {
        return this.request('/companies/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async getCompanyDashboard() {
        return this.request('/companies/dashboard');
    }

    // Ad endpoints
    async uploadAd(formData) {
        return this.request('/ads/upload', {
            method: 'POST',
            headers: {
                'Authorization': \Bearer \\
            },
            body: formData
        });
    }

    async getCompanyAds(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(\/ads/company?\\);
    }

    async updateAd(adId, adData) {
        return this.request(\/ads/\\, {
            method: 'PUT',
            body: JSON.stringify(adData)
        });
    }

    async deleteAd(adId) {
        return this.request(\/ads/\\, {
            method: 'DELETE'
        });
    }

    // Wallet endpoints
    async addFunds(amount, paymentMethod, transactionId) {
        return this.request('/wallet/add-funds', {
            method: 'POST',
            body: JSON.stringify({ amount, paymentMethod, transactionId })
        });
    }

    async getWalletInfo() {
        return this.request('/wallet/info');
    }

    // AI endpoints
    async getChessMove(moveData) {
        return this.request('/ai/chess/move', {
            method: 'POST',
            body: JSON.stringify(moveData)
        });
    }

    async getChessHint(hintData) {
        return this.request('/ai/chess/hint', {
            method: 'POST',
            body: JSON.stringify(hintData)
        });
    }

    async analyzeChessGame(gameData) {
        return this.request('/ai/chess/analyze', {
            method: 'POST',
            body: JSON.stringify(gameData)
        });
    }

    async getKhensaniResponse(message, context = {}) {
        return this.request('/ai/khensani/chat', {
            method: 'POST',
            body: JSON.stringify({ message, context })
        });
    }

    async generateSpeech(text, language = 'en-ZA') {
        return this.request('/ai/khensani/speech', {
            method: 'POST',
            body: JSON.stringify({ text, language })
        });
    }

    // Curriculum endpoints
    async getCurriculum(grade, subject) {
        return this.request(\/curriculum/\/\\);
    }

    async getLesson(lessonId) {
        return this.request(\/curriculum/lessons/\\);
    }

    async completeLesson(lessonId, results) {
        return this.request(\/curriculum/lessons/\/complete\, {
            method: 'POST',
            body: JSON.stringify(results)
        });
    }

    // Safety endpoints
    async updateLocation(locationData) {
        return this.request('/users/location', {
            method: 'POST',
            body: JSON.stringify(locationData)
        });
    }

    async getSafetyLocations() {
        return this.request('/users/safety-locations');
    }

    async addSafetyLocation(locationData) {
        return this.request('/users/safety-locations', {
            method: 'POST',
            body: JSON.stringify(locationData)
        });
    }

    // Analytics endpoints
    async getLearningAnalytics(timeframe = '7d') {
        return this.request(\/analytics/learning?timeframe=\\);
    }

    async getPlatformAnalytics() {
        return this.request('/analytics/platform');
    }

    // Utility methods
    clearAuth() {
        localStorage.removeItem('mindflow_token');
        localStorage.removeItem('mindflow_user');
        this.authToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
        localStorage.setItem('mindflow_token', token);
    }

    // Request queue for offline support
    async queueRequest(endpoint, options) {
        const request = { endpoint, options, timestamp: Date.now() };
        this.requestQueue.push(request);
        
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
        
        return request;
    }

    async processQueue() {
        if (this.requestQueue.length === 0 || this.isProcessingQueue) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue[0];
            
            try {
                await this.request(request.endpoint, request.options);
                this.requestQueue.shift(); // Remove successful request
            } catch (error) {
                if (error.status === 401 || error.status >= 500) {
                    break; // Stop processing on auth or server errors
                }
                this.requestQueue.shift(); // Remove failed request (will retry later)
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.isProcessingQueue = false;
    }

    // Batch requests for efficiency
    async batchRequests(requests) {
        const batchId = this.generateRequestId();
        const results = [];

        for (const request of requests) {
            try {
                const result = await this.request(request.endpoint, request.options);
                results.push({ success: true, data: result });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }

        return results;
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(\\/health\, { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Get request logs for debugging
    getRequestLogs(limit = 50) {
        const logs = JSON.parse(localStorage.getItem('mindflow_request_log') || '[]');
        return logs.slice(-limit);
    }

    // Clear request logs
    clearRequestLogs() {
        localStorage.removeItem('mindflow_request_log');
    }
}

// Create global API instance
window.API = new APIService();

// Utility function for easy API access
window.apiCall = (endpoint, options) => window.API.request(endpoint, options);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}
