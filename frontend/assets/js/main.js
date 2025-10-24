// MindFlow AI - Complete Main Application Controller
// ==================================================

class MindFlowApp {
    constructor() {
        this.API_BASE = 'https://mindflow-ai.onrender.com/api';
        this.currentPage = this.getCurrentPage();
        this.userPreferences = {};
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        console.log('🚀 MindFlow AI Platform Initialized');
        console.log('📄 Current Page:', this.currentPage);
        
        this.setupGlobalErrorHandling();
        this.setupNetworkMonitoring();
        this.loadUserPreferences();
        this.initializePageSpecificFeatures();
        this.setupServiceWorker();
        this.checkBackendConnectivity();
        this.setupGlobalEventListeners();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '');
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('🔴 Global Error:', event.error);
            this.showGlobalError('A system error occurred. Please refresh the page.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('🔴 Unhandled Promise Rejection:', event.reason);
            this.showGlobalError('A system error occurred.');
        });
    }

    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNetworkStatus('connected', 'Back online - All features available');
            this.checkBackendConnectivity();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNetworkStatus('disconnected', 'Connection lost - Limited functionality');
        });
    }

    setupGlobalEventListeners() {
        // Escape key to close modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Click outside to close modals
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
        });
    }

    async checkBackendConnectivity() {
        if (!this.isOnline) return;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.API_BASE}/health`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend connectivity confirmed:', data);
                this.showNetworkStatus('connected', 'All systems operational');
                return true;
            } else {
                throw new Error(`Backend responded with ${response.status}`);
            }

        } catch (error) {
            console.warn('⚠️ Backend connectivity issue:', error.message);
            this.showNetworkStatus('degraded', 'Some features may be limited');
            return false;
        }
    }

    showNetworkStatus(status, message) {
        // Remove existing status
        const existingStatus = document.getElementById('networkStatusIndicator');
        if (existingStatus) {
            existingStatus.remove();
        }

        const statusElement = document.createElement('div');
        statusElement.id = 'networkStatusIndicator';
        
        const statusConfig = {
            connected: { class: 'network-connected', icon: '🟢', text: 'Online' },
            disconnected: { class: 'network-disconnected', icon: '🔴', text: 'Offline' },
            degraded: { class: 'network-degraded', icon: '🟡', text: 'Limited' }
        };
        
        const config = statusConfig[status] || statusConfig.degraded;
        
        statusElement.className = `network-status ${config.class}`;
        statusElement.innerHTML = `
            <span class="status-icon">${config.icon}</span>
            <span class="status-text">${config.text}: ${message}</span>
            <button class="status-close" onclick="this.parentElement.remove()">×</button>
        `;

        statusElement.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            font-size: 12px;
            border-left: 4px solid ${status === 'connected' ? '#10b981' : status === 'disconnected' ? '#ef4444' : '#f59e0b'};
            display: flex;
            align-items: center;
            gap: 6px;
            max-width: 300px;
        `;

        document.body.appendChild(statusElement);

        // Auto-hide connected status
        if (status === 'connected') {
            setTimeout(() => {
                if (statusElement.parentElement) {
                    statusElement.style.opacity = '0';
                    statusElement.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => statusElement.remove(), 500);
                }
            }, 3000);
        }
    }

    showGlobalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error-overlay';
        errorDiv.innerHTML = `
            <div class="error-content" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 10000;
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <div class="error-icon" style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h3 style="margin: 0 0 12px 0; color: #374151;">System Notice</h3>
                <p style="margin: 0 0 20px 0; color: #6b7280; line-height: 1.5;">${message}</p>
                <button onclick="this.closest('.global-error-overlay').remove()" style="
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Dismiss</button>
            </div>
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            "></div>
        `;
        document.body.appendChild(errorDiv);
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('❌ Service Worker registration failed:', error);
                });
        }
    }

    loadUserPreferences() {
        try {
            const prefs = localStorage.getItem('mindflow_preferences');
            if (prefs) {
                this.userPreferences = JSON.parse(prefs);
                console.log('✅ User preferences loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load preferences:', error);
        }
    }

    saveUserPreferences() {
        try {
            localStorage.setItem('mindflow_preferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.error('❌ Failed to save preferences:', error);
        }
    }

    initializePageSpecificFeatures() {
        console.log('🔄 Initializing page features for:', this.currentPage);
        
        switch(this.currentPage) {
            case 'index':
                this.initLandingPage();
                break;
            case 'login':
            case 'register':
                this.initAuthPage();
                break;
            case 'dashboard':
                this.initDashboard();
                break;
            case 'khensani-platform':
                this.initKhensaniAI();
                break;
            case 'chess':
                this.initChessPage();
                break;
            case 'safety':
                this.initSafetyPage();
                break;
            default:
                this.initGenericPage();
        }
    }

    initLandingPage() {
        console.log('🏠 Initializing landing page features');
        this.setupRoleSelection();
        this.setupSmoothScrolling();
        this.setupHeroAnimations();
    }

    initAuthPage() {
        console.log('🔐 Auth page - handled by auth system');
    }

    initDashboard() {
        console.log('📊 Initializing dashboard');
        this.loadDashboardData();
    }

    initKhensaniAI() {
        console.log('🤖 Khensani AI page - handled by AI system');
    }

    initChessPage() {
        console.log('♟️ Chess page - handled by chess system');
    }

    initSafetyPage() {
        console.log('🛡️ Safety page - handled by safety system');
    }

    initGenericPage() {
        console.log('📄 Initializing generic page features');
        this.setupSmoothScrolling();
    }

    setupRoleSelection() {
        const roleButtons = document.querySelectorAll('.role-card, [data-role]');
        roleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const role = e.currentTarget.dataset.role || 'student';
                this.handleRoleSelection(role);
            });
        });
    }

    handleRoleSelection(role) {
        console.log(`🎯 Role selected: ${role}`);
        
        this.userPreferences.role = role;
        this.saveUserPreferences();
        
        this.showRoleWelcome(role);
        
        // Store for auth redirect
        sessionStorage.setItem('selected_role', role);
    }

    showRoleWelcome(role) {
        const welcomeMessages = {
            student: "Welcome, Learner! Ready to explore with Khensani AI?",
            parent: "Welcome, Parent! Let's track learning progress together.",
            teacher: "Welcome, Educator! Empower your classroom with AI."
        };
        
        const message = welcomeMessages[role] || "Welcome to MindFlow AI!";
        this.showNotification(message, 'success');
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupHeroAnimations() {
        // Simple fade-in animation for hero elements
        const heroElements = document.querySelectorAll('.hero-content, .role-card');
        heroElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }

    async loadDashboardData() {
        if (!this.isOnline) {
            this.showNotification('Working offline - data may be limited', 'info');
            return;
        }

        try {
            const userId = this.getCurrentUserId();
            if (!userId) return;

            // Simulate dashboard data loading
            await this.simulateDataLoad();
            
            this.showNotification('Dashboard updated successfully', 'success');

        } catch (error) {
            console.error('❌ Dashboard data load failed:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async simulateDataLoad() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    showNotification(message, type = 'info') {
        // Use existing notification system or create simple one
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            this.createSimpleNotification(message, type);
        }
    }

    createSimpleNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `simple-notification notification-${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                max-width: 300px;
                word-wrap: break-word;
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                    <span>${message}</span>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay, .global-error-overlay');
        modals.forEach(modal => modal.remove());
    }

    getCurrentUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('mindflow_user') || '{}');
            return user.id || null;
        } catch {
            return null;
        }
    }

    // Utility method to check authentication
    isUserAuthenticated() {
        return !!this.getCurrentUserId();
    }

    // Method to get user role
    getUserRole() {
        try {
            const user = JSON.parse(localStorage.getItem('mindflow_user') || '{}');
            return user.role || this.userPreferences.role || 'student';
        } catch {
            return 'student';
        }
    }
}

// Global application instance
document.addEventListener('DOMContentLoaded', function() {
    window.mindflowApp = new MindFlowApp();
});

// Global utility functions
window.showAppNotification = function(message, type) {
    if (window.mindflowApp) {
        window.mindflowApp.showNotification(message, type);
    }
};

window.getUserPreferences = function() {
    return window.mindflowApp?.userPreferences || {};
};

window.checkConnectivity = function() {
    return window.mindflowApp?.checkBackendConnectivity() || Promise.resolve(false);
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MindFlowApp;
}