class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.bindAuthEvents();
        this.checkExistingAuth();
        this.initPasswordStrength();
    }

    bindAuthEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Password reset
        const resetForm = document.getElementById('resetForm');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
        }

        // Social login buttons
        document.querySelectorAll('.social-login-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSocialLogin(e));
        });

        // Show/hide password toggle
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const credentials = {
            email: formData.get('email').trim().toLowerCase(),
            password: formData.get('password'),
            rememberMe: formData.get('rememberMe') === 'on'
        };

        // Basic validation
        if (!this.validateEmail(credentials.email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!credentials.password) {
            this.showError('Please enter your password');
            return;
        }

        const submitBtn = e.target.querySelector('button[type=\"submit\"]');
        const originalText = submitBtn.innerHTML;
        
        this.setButtonLoading(submitBtn, 'Signing in...');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                this.setAuthToken(result.data.token);
                this.setUserData(result.data.user);
                this.showSuccess('Login successful! Redirecting...');
                
                // Track login event
                this.trackAuthEvent('login_success');
                
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
            } else {
                this.trackAuthEvent('login_failed', { reason: result.message });
                this.showError(result.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.trackAuthEvent('login_error', { error: error.message });
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setButtonNormal(submitBtn, originalText);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            email: formData.get('email').trim().toLowerCase(),
            password: formData.get('password'),
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            grade: parseInt(formData.get('grade')) || 4,
            role: formData.get('role') || 'student',
            language: formData.get('language') || 'en'
        };

        // Validation
        const validation = this.validateRegistration(userData, formData.get('confirmPassword'));
        if (!validation.isValid) {
            this.showError(validation.message);
            return;
        }

        const submitBtn = e.target.querySelector('button[type=\"submit\"]');
        const originalText = submitBtn.innerHTML;
        
        this.setButtonLoading(submitBtn, 'Creating account...');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                this.trackAuthEvent('registration_success');
                this.showSuccess('Account created successfully! Please check your email for verification.');
                
                // Auto-login if token is provided
                if (result.data && result.data.token) {
                    this.setAuthToken(result.data.token);
                    this.setUserData(result.data.user);
                    
                    setTimeout(() => {
                        window.location.href = '/onboarding.html';
                    }, 2000);
                } else {
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 3000);
                }
            } else {
                this.trackAuthEvent('registration_failed', { reason: result.message });
                this.showError(result.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.trackAuthEvent('registration_error', { error: error.message });
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setButtonNormal(submitBtn, originalText);
        }
    }

    validateRegistration(userData, confirmPassword) {
        if (!this.validateEmail(userData.email)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }

        if (!userData.firstName || !userData.lastName) {
            return { isValid: false, message: 'Please enter your first and last name' };
        }

        if (userData.password !== confirmPassword) {
            return { isValid: false, message: 'Passwords do not match' };
        }

        const passwordStrength = this.checkPasswordStrength(userData.password);
        if (passwordStrength.strength < 3) {
            return { isValid: false, message: 'Password is too weak. ' + passwordStrength.feedback };
        }

        if (!userData.grade || userData.grade < 1 || userData.grade > 12) {
            return { isValid: false, message: 'Please select a valid grade level' };
        }

        return { isValid: true, message: 'Validation passed' };
    }

    async handlePasswordReset(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email').trim().toLowerCase();

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        const submitBtn = e.target.querySelector('button[type=\"submit\"]');
        const originalText = submitBtn.innerHTML;
        
        this.setButtonLoading(submitBtn, 'Sending reset instructions...');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (result.success) {
                this.trackAuthEvent('password_reset_requested');
                this.showSuccess('Password reset instructions sent to your email. Please check your inbox.');
                
                // Clear form
                e.target.reset();
            } else {
                this.trackAuthEvent('password_reset_failed', { reason: result.message });
                this.showError(result.message || 'Failed to send reset instructions');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.trackAuthEvent('password_reset_error', { error: error.message });
            this.showError('Network error. Please try again.');
        } finally {
            this.setButtonNormal(submitBtn, originalText);
        }
    }

    handleSocialLogin(e) {
        const provider = e.target.dataset.provider;
        this.trackAuthEvent('social_login_attempt', { provider });
        
        // Redirect to social login endpoint
        window.location.href = \/api/auth/\\;
    }

    togglePasswordVisibility(e) {
        const button = e.target;
        const input = button.previousElementSibling;
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
            button.setAttribute('aria-label', 'Hide password');
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
            button.setAttribute('aria-label', 'Show password');
        }
    }

    setAuthToken(token) {
        localStorage.setItem('mindflow_token', token);
        this.authToken = token;
        this.isAuthenticated = true;
    }

    setUserData(user) {
        localStorage.setItem('mindflow_user', JSON.stringify(user));
        this.currentUser = user;
    }

    checkExistingAuth() {
        this.authToken = localStorage.getItem('mindflow_token');
        const userData = localStorage.getItem('mindflow_user');
        
        if (this.authToken && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isAuthenticated = true;
                
                // If on auth pages, redirect to dashboard
                if (this.isAuthPage()) {
                    window.location.href = '/dashboard.html';
                }
            } catch (error) {
                this.clearAuth();
            }
        } else {
            // If not authenticated and on protected page, redirect to login
            if (this.isProtectedPage()) {
                window.location.href = '/login.html';
            }
        }
    }

    isAuthPage() {
        const path = window.location.pathname;
        return path.includes('login') || 
               path.includes('register') ||
               path.includes('forgot-password') ||
               path.includes('reset-password');
    }

    isProtectedPage() {
        const path = window.location.pathname;
        return path.includes('dashboard') ||
               path.includes('profile') ||
               path.includes('curriculum') ||
               path.includes('chess') ||
               path.includes('robotics');
    }

    clearAuth() {
        localStorage.removeItem('mindflow_token');
        localStorage.removeItem('mindflow_user');
        this.currentUser = null;
        this.authToken = null;
        this.isAuthenticated = false;
    }

    validateEmail(email) {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        return emailRegex.test(email);
    }

    // Password strength checker
    checkPasswordStrength(password) {
        let strength = 0;
        const feedback = [];

        // Length check
        if (password.length >= 8) strength++;
        else feedback.push('at least 8 characters');

        // Lowercase check
        if (/[a-z]/.test(password)) strength++;
        else feedback.push('one lowercase letter');

        // Uppercase check
        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('one uppercase letter');

        // Number check
        if (/[0-9]/.test(password)) strength++;
        else feedback.push('one number');

        // Special character check
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        else feedback.push('one special character');

        const strengthLevels = {
            0: { text: 'Very Weak', color: '#ff6b6b', width: '20%' },
            1: { text: 'Weak', color: '#ff9e6b', width: '40%' },
            2: { text: 'Fair', color: '#ffd166', width: '60%' },
            3: { text: 'Good', color: '#06d6a0', width: '80%' },
            4: { text: 'Strong', color: '#118ab2', width: '90%' },
            5: { text: 'Very Strong', color: '#073b4c', width: '100%' }
        };

        return {
            strength,
            level: strengthLevels[strength] || strengthLevels[0],
            feedback: feedback.length > 0 ? \Needs: \\ : 'Strong password!'
        };
    }

    // Real-time password strength indicator
    initPasswordStrength() {
        const passwordInput = document.getElementById('password');
        const strengthIndicator = document.getElementById('passwordStrength');

        if (passwordInput && strengthIndicator) {
            passwordInput.addEventListener('input', (e) => {
                const strength = this.checkPasswordStrength(e.target.value);
                
                strengthIndicator.innerHTML = \
                    <div class=\"strength-bar\">
                        <div class=\"strength-fill\" style=\"width: \; background: \\"></div>
                    </div>
                    <div class=\"strength-text\" style=\"color: \\">
                        \
                    </div>
                    <div class=\"strength-feedback\">\</div>
                \;
            });
        }
    }

    setButtonLoading(button, text) {
        button.innerHTML = \<i class=\"fas fa-spinner fa-spin\"></i> \\;
        button.disabled = true;
    }

    setButtonNormal(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.auth-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = \uth-notification notification-\\;
        notification.innerHTML = \
            <div class=\"notification-content\">
                <i class=\"fas fa-\\"></i>
                <span>\</span>
            </div>
            <button class=\"notification-close\" onclick=\"this.parentElement.remove()\">&times;</button>
        \;

        // Insert at the top of the form
        const form = document.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(notification, form);
        } else {
            document.body.appendChild(notification);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    trackAuthEvent(event, data = {}) {
        // In production, this would send to analytics service
        console.log(\Auth Event: \\, data);
        
        const eventData = {
            event,
            timestamp: new Date().toISOString(),
            user: this.currentUser ? this.currentUser.id : 'anonymous',
            ...data
        };
        
        // Store in localStorage for debugging
        const authEvents = JSON.parse(localStorage.getItem('mindflow_auth_events') || '[]');
        authEvents.push(eventData);
        localStorage.setItem('mindflow_auth_events', JSON.stringify(authEvents.slice(-50))); // Keep last 50 events
    }

    // Utility method to check if user can access specific features
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const permissions = {
            'student': ['access_curriculum', 'play_games', 'view_progress'],
            'parent': ['view_child_progress', 'manage_safety_settings'],
            'teacher': ['manage_classroom', 'view_student_progress'],
            'company_admin': ['manage_ads', 'view_analytics'],
            'admin': ['manage_users', 'view_all_analytics']
        };
        
        return permissions[this.currentUser.role]?.includes(permission) || false;
    }

    // Get user role display name
    getRoleDisplayName() {
        const roleNames = {
            'student': 'Student',
            'parent': 'Parent', 
            'teacher': 'Teacher',
            'company_admin': 'Company Admin',
            'admin': 'Administrator'
        };
        
        return roleNames[this.currentUser?.role] || 'User';
    }
}

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Global auth helper functions
    window.requireAuth = (callback) => {
        if (window.authManager.isAuthenticated) {
            callback();
        } else {
            window.location.href = '/login.html';
        }
    };

    window.requireRole = (role, callback) => {
        if (window.authManager.isAuthenticated && window.authManager.currentUser?.role === role) {
            callback();
        } else {
            window.location.href = '/unauthorized.html';
        }
    };
});
