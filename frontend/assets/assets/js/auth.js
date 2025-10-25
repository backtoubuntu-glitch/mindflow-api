// MindFlow AI - Enterprise Authentication System 2025
// ====================================================

class EnterpriseAuthSystem {
    constructor() {
        this.API_BASE = 'https://mindflow-ai.onrender.com/api';
        this.currentUser = null;
        this.token = localStorage.getItem('mindflow_enterprise_token');
        this.OAUTH_CONFIG = {
            google: {
                clientId: 'YOUR_GOOGLE_OAUTH_CLIENT_ID',
                redirectUri: `${window.location.origin}/oauth-callback.html`
            },
            facebook: {
                clientId: 'YOUR_FACEBOOK_APP_ID', 
                redirectUri: `${window.location.origin}/oauth-callback.html`
            }
        };
        this.init();
    }

    init() {
        console.log('🔐 Enterprise Auth System 2025 Initialized');
        this.checkExistingAuth();
        this.setupEventListeners();
        this.loadOAuthButtons();
    }

    // ==================== OAUTH INTEGRATION ====================

    async initGoogleOAuth() {
        return new Promise((resolve) => {
            if (typeof google !== 'undefined') {
                google.accounts.id.initialize({
                    client_id: this.OAUTH_CONFIG.google.clientId,
                    callback: this.handleGoogleOAuth.bind(this),
                    auto_select: false,
                    cancel_on_tap_outside: true
                });
                resolve();
            } else {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.onload = resolve;
                document.head.appendChild(script);
            }
        });
    }

    handleGoogleOAuth(response) {
        console.log('🔐 Google OAuth Response received');
        this.handleOAuthSuccess('google', response.credential);
    }

    async handleFacebookOAuth() {
        const authUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${this.OAUTH_CONFIG.facebook.clientId}&redirect_uri=${this.OAUTH_CONFIG.facebook.redirectUri}&scope=email,public_profile&response_type=code`;
        window.location.href = authUrl;
    }

    async handleOAuthSuccess(provider, token) {
        try {
            this.showAuthLoading(`Verifying ${provider} account...`);
            
            const response = await fetch(`${this.API_BASE}/auth/oauth/${provider}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, provider })
            });

            if (response.ok) {
                const data = await response.json();
                this.handleLoginSuccess(data);
            } else {
                throw new Error(`${provider} authentication failed`);
            }
        } catch (error) {
            console.error(`❌ ${provider} OAuth error:`, error);
            this.showAuthError(`${provider} sign-in failed. Please try email login.`);
        } finally {
            this.hideAuthLoading();
        }
    }

    loadOAuthButtons() {
        const oauthContainer = document.getElementById('oauthButtons');
        if (oauthContainer) {
            oauthContainer.innerHTML = `
                <div class="oauth-section">
                    <div class="oauth-divider">
                        <span>Or continue with</span>
                    </div>
                    <div class="oauth-buttons">
                        <button class="oauth-btn google-oauth" onclick="window.mindflowAuth.initGoogleOAuth().then(() => google.accounts.id.prompt())">
                            <span>Google</span>
                        </button>
                        <button class="oauth-btn facebook-oauth" onclick="window.mindflowAuth.handleFacebookOAuth()">
                            <span>Facebook</span>
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // ==================== ENHANCED AUTH METHODS ====================

    async enterpriseLogin(email, password, twoFactorCode = null) {
        try {
            this.showAuthLoading('Signing in...');
            
            const payload = { email, password };
            if (twoFactorCode) payload.twoFactorCode = twoFactorCode;

            const response = await fetch(`${this.API_BASE}/auth/enterprise-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                'X-Device-ID': this.getDeviceId(),
                    'X-Session-ID': this.getSessionId()
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 402) {
                this.hideAuthLoading();
                return this.handleTwoFactorRequirement(email, password);
            }

            if (response.ok) {
                const data = await response.json();
                this.handleLoginSuccess(data);
                return { success: true, user: data.user };
            } else {
                throw new Error('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('❌ Enterprise login error:', error);
            this.showAuthError(error.message);
            return { success: false, error: error.message };
        } finally {
            this.hideAuthLoading();
        }
    }

    handleTwoFactorRequirement(email, password) {
        this.lastLoginEmail = email;
        this.lastLoginPassword = password;
        this.showTwoFactorModal();
        return { success: false, requires2FA: true };
    }

    // ==================== PARENT-TEACHER INTEGRATION ====================

    async setupParentTeacherLink(parentEmail, teacherCode) {
        try {
            this.showAuthLoading('Establishing connection...');
            
            const response = await fetch(`${this.API_BASE}/users/link-parent-teacher`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    parentEmail,
                    teacherCode,
                    studentId: this.currentUser?.id
                })
            });

            if (response.ok) {
                this.showAuthSuccess('Parent-teacher connection established!');
                return true;
            } else {
                throw new Error('Failed to establish connection');
            }
        } catch (error) {
            console.error('❌ Parent-teacher link error:', error);
            this.showAuthError('Connection failed. Please check codes and try again.');
            return false;
        } finally {
            this.hideAuthLoading();
        }
    }

    async getLinkedAccounts() {
        try {
            const response = await fetch(`${this.API_BASE}/users/linked-accounts`, {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                return await response.json();
            }
            return { parents: [], teachers: [], students: [] };
        } catch (error) {
            console.error('❌ Linked accounts error:', error);
            return { parents: [], teachers: [], students: [] };
        }
    }

    // ==================== SECURITY ENHANCEMENTS ====================

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
            headers['X-Device-ID'] = this.getDeviceId();
            headers['X-Session-ID'] = this.getSessionId();
        }
        
        return headers;
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('mindflow_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('mindflow_device_id', deviceId);
        }
        return deviceId;
    }

    getSessionId() {
        let sessionId = localStorage.getItem('mindflow_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now();
            localStorage.setItem('mindflow_session_id', sessionId);
        }
        return sessionId;
    }

    // ==================== CORE AUTH FUNCTIONALITY ====================

    async login(email, password) {
        return this.enterpriseLogin(email, password);
    }

    async register(userData) {
        try {
            this.showAuthLoading('Creating account...');
            
            const response = await fetch(`${this.API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showAuthSuccess('Registration successful! Please login.');
                return { success: true };
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            this.showAuthError(error.message);
            return { success: false, error: error.message };
        } finally {
            this.hideAuthLoading();
        }
    }

    handleLoginSuccess(authData) {
        this.token = authData.token;
        this.currentUser = authData.user;
        
        localStorage.setItem('mindflow_enterprise_token', this.token);
        localStorage.setItem('mindflow_user', JSON.stringify(this.currentUser));
        
        console.log('✅ Login successful:', this.currentUser.name);
        this.showAuthSuccess(`Welcome back, ${this.currentUser.name}!`);
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('mindflow_enterprise_token');
        localStorage.removeItem('mindflow_user');
        localStorage.removeItem('mindflow_device_id');
        localStorage.removeItem('mindflow_session_id');
        
        console.log('👋 User logged out');
        window.location.href = 'index.html';
    }

    checkExistingAuth() {
        if (this.token) {
            const userData = localStorage.getItem('mindflow_user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('✅ Existing session found:', this.currentUser.name);
                this.updateUIForAuthState();
            }
        }
    }

    // ==================== UI MANAGEMENT ====================

    updateUIForAuthState() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userWelcome = document.getElementById('userWelcome');

        if (this.currentUser) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
                logoutBtn.onclick = () => this.logout();
            }
            if (userWelcome) {
                userWelcome.textContent = `Welcome, ${this.currentUser.name}`;
                userWelcome.style.display = 'block';
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userWelcome) userWelcome.style.display = 'none';
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('email');
                const password = formData.get('password');
                await this.login(email, password);
            });
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const userData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    role: formData.get('role') || 'student'
                };
                await this.register(userData);
            });
        }

        document.addEventListener('click', (e) => {
            if (e.target.id === 'logoutBtn') {
                this.logout();
            }
        });
    }

    showTwoFactorModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%;">
                <h3 style="margin-bottom: 1rem;">Two-Factor Authentication</h3>
                <p style="color: #6b7280; margin-bottom: 1rem;">Enter the code from your authenticator app:</p>
                <input type="text" id="twoFactorCode" placeholder="000000" maxlength="6" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 1rem; text-align: center; font-size: 1.25rem;">
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="window.mindflowAuth.submitTwoFactorCode()" style="flex: 1;">Verify</button>
                    <button class="btn btn-secondary" onclick="this.closest('div').parentElement.remove()" style="flex: 1;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async submitTwoFactorCode() {
        const code = document.getElementById('twoFactorCode').value;
        if (code.length === 6) {
            await this.enterpriseLogin(this.lastLoginEmail, this.lastLoginPassword, code);
            document.querySelector('div[style*="position: fixed"]').remove();
        } else {
            this.showAuthError('Please enter a valid 6-digit code');
        }
    }

    showAuthLoading(message = 'Processing...') {
        let loader = document.getElementById('authLoader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'authLoader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: white;
                font-size: 1.125rem;
            `;
            loader.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; color: #374151;">
                    <div style="width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <div>${message}</div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loader);
        }
    }

    hideAuthLoading() {
        const loader = document.getElementById('authLoader');
        if (loader) loader.remove();
    }

    showAuthError(message) {
        this.showAuthMessage(message, 'error');
    }

    showAuthSuccess(message) {
        this.showAuthMessage(message, 'success');
    }

    showAuthMessage(message, type = 'info') {
        const existingMsg = document.getElementById('authMessage');
        if (existingMsg) existingMsg.remove();

        const messageDiv = document.createElement('div');
        messageDiv.id = 'authMessage';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: system-ui, sans-serif;
            max-width: 300px;
        `;
        messageDiv.innerHTML = `
            <span style="margin-right: 8px;">${type === 'error' ? '❌' : '✅'}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; margin-left: 8px; cursor: pointer;">×</button>
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    getUserRole() {
        return this.currentUser?.role || 'guest';
    }
}

// Global auth instance
document.addEventListener('DOMContentLoaded', function() {
    window.mindflowAuth = new EnterpriseAuthSystem();
});

// Global helper functions
window.loginUser = async function(email, password) {
    return await window.mindflowAuth?.login(email, password);
};

window.logoutUser = function() {
    window.mindflowAuth?.logout();
};

window.getCurrentUser = function() {
    return window.mindflowAuth?.currentUser;
};

window.isUserLoggedIn = function() {
    return window.mindflowAuth?.isAuthenticated() || false;
};