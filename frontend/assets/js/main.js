class MindFlowApp {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.userPreferences = {};
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.bindGlobalEvents();
        this.loadUserPreferences();
        this.initializeModules();
        
        console.log('MindFlow App Initialized');
    }

    checkAuthStatus() {
        this.authToken = localStorage.getItem('mindflow_token');
        const userData = localStorage.getItem('mindflow_user');
        
        if (this.authToken && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUIForAuthState(true);
                this.validateToken();
            } catch (error) {
                this.clearAuth();
            }
        } else {
            this.updateUIForAuthState(false);
        }
    }

    async validateToken() {
        if (!this.authToken) return false;

        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': \Bearer \\
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.setUserData(userData.data);
                return true;
            } else {
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    bindGlobalEvents() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-nav]')) {
                e.preventDefault();
                this.navigateTo(e.target.getAttribute('data-nav'));
            }
        });

        // Logout
        document.addEventListener('click', (e) => {
            if (e.target.matches('#logoutBtn')) {
                this.logout();
            }
        });

        // Theme toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('#themeToggle')) {
                this.toggleTheme();
            }
        });

        // Search functionality
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }

        // Global error handler
        window.addEventListener('error', this.handleGlobalError.bind(this));
    }

    navigateTo(page) {
        // Simple SPA navigation
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => p.classList.remove('active'));
        
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.classList.add('active');
            this.updateActiveNav(page);
            this.updatePageTitle(page);
        } else {
            window.location.href = \\.html\;
        }
    }

    updateActiveNav(activePage) {
        document.querySelectorAll('[data-nav]').forEach(nav => {
            nav.classList.toggle('active', nav.getAttribute('data-nav') === activePage);
        });
    }

    updatePageTitle(page) {
        const titles = {
            'dashboard': 'Dashboard - MindFlow',
            'curriculum': 'Curriculum - MindFlow', 
            'profile': 'Profile - MindFlow',
            'chess': 'Chess - MindFlow',
            'robotics': 'Robotics - MindFlow'
        };
        
        document.title = titles[page] || 'MindFlow AI Platform';
    }

    updateUIForAuthState(isAuthenticated) {
        const authElements = document.querySelectorAll('.auth-only');
        const unauthElements = document.querySelectorAll('.unauth-only');
        
        if (isAuthenticated) {
            authElements.forEach(el => el.style.display = 'block');
            unauthElements.forEach(el => el.style.display = 'none');
            
            // Update user info
            this.updateUserInfo();
        } else {
            authElements.forEach(el => el.style.display = 'none');
            unauthElements.forEach(el => el.style.display = 'block');
        }
    }

    updateUserInfo() {
        const userElements = document.querySelectorAll('.user-name, .user-avatar, .user-grade');
        userElements.forEach(el => {
            if (el.classList.contains('user-name')) {
                el.textContent = this.currentUser?.firstName || 'User';
            }
            if (el.classList.contains('user-grade') && this.currentUser?.grade) {
                el.textContent = \Grade \\;
            }
        });
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': \Bearer \\
                }
            });
        } catch (error) {
            console.log('Logout API call failed');
        } finally {
            this.clearAuth();
            window.location.href = '/login.html';
        }
    }

    clearAuth() {
        localStorage.removeItem('mindflow_token');
        localStorage.removeItem('mindflow_user');
        this.currentUser = null;
        this.authToken = null;
        this.updateUIForAuthState(false);
    }

    setUserData(user) {
        localStorage.setItem('mindflow_user', JSON.stringify(user));
        this.currentUser = user;
        this.updateUserInfo();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('mindflow_theme', newTheme);
        
        // Update theme icon
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.showNotification(\Theme changed to \ mode\, 'success');
    }

    loadUserPreferences() {
        // Load theme
        const savedTheme = localStorage.getItem('mindflow_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Load other preferences
        this.userPreferences = JSON.parse(localStorage.getItem('mindflow_preferences') || '{}');
        this.applyPreferences(this.userPreferences);
    }

    applyPreferences(preferences) {
        // Apply font size
        if (preferences.fontSize) {
            document.documentElement.style.fontSize = preferences.fontSize;
        }
        
        // Apply reduced motion
        if (preferences.reducedMotion) {
            document.documentElement.classList.add('reduce-motion');
        }
    }

    initializeModules() {
        const page = document.body.dataset.page;
        
        switch(page) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'curriculum':
                this.initializeCurriculum();
                break;
            case 'profile':
                this.initializeProfile();
                break;
            case 'chess':
                this.initializeChess();
                break;
            case 'robotics':
                this.initializeRobotics();
                break;
        }
    }

    initializeDashboard() {
        this.loadDashboardData();
        this.initializeProgressCharts();
    }

    async loadDashboardData() {
        if (!this.authToken) return;
        
        try {
            const [progressResponse, achievementsResponse] = await Promise.all([
                fetch('/api/users/progress', {
                    headers: { 'Authorization': \Bearer \\ }
                }),
                fetch('/api/users/achievements', {
                    headers: { 'Authorization': \Bearer \\ }
                })
            ]);

            if (progressResponse.ok && achievementsResponse.ok) {
                const progressData = await progressResponse.json();
                const achievementsData = await achievementsResponse.json();
                this.updateDashboard(progressData, achievementsData);
            }
        } catch (error) {
            console.error('Dashboard data loading failed:', error);
        }
    }

    updateDashboard(progressData, achievementsData) {
        // Update progress bars
        const progressElements = document.querySelectorAll('.progress-bar');
        progressElements.forEach(bar => {
            const subject = bar.dataset.subject;
            const progress = progressData.progress?.[subject] || 0;
            bar.style.width = \\%\;
            bar.setAttribute('aria-valuenow', progress);
        });

        // Update stats
        const stats = {
            totalLessons: progressData.totalLessons || 0,
            completedLessons: progressData.completedLessons || 0,
            currentStreak: progressData.currentStreak || 0,
            totalPoints: progressData.totalPoints || 0
        };

        Object.keys(stats).forEach(stat => {
            const element = document.querySelector(\[data-stat="\"]\);
            if (element) {
                this.animateValue(element, 0, stats[stat], 1000);
            }
        });

        // Update achievements
        this.updateAchievements(achievementsData);
    }

    updateAchievements(achievementsData) {
        const achievementsContainer = document.getElementById('achievementsList');
        if (!achievementsContainer) return;

        const achievements = achievementsData.achievements || [];
        achievementsContainer.innerHTML = achievements.map(achievement => \
            <div class="achievement-item \">
                <i class="fas \"></i>
                <div class="achievement-info">
                    <div class="achievement-name">\</div>
                    <div class="achievement-desc">\</div>
                </div>
            </div>
        \).join('');
    }

    initializeProgressCharts() {
        // Chart initialization would go here
        // In production, integrate with Chart.js or similar
        console.log('Progress charts initialized');
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    handleSearch(query) {
        console.log('Searching for:', query.target.value);
        // Implement search logic
    }

    handleGlobalError(error) {
        console.error('Global error:', error);
        this.showNotification('An unexpected error occurred', 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = \
otification notification-\\;
        notification.innerHTML = \
            <div class="notification-content">
                <i class="fas fa-\"></i>
                <span>\</span>
            </div>
            <button class="notification-close">&times;</button>
        \;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }

    animateValue(element, start, end, duration) {
        const range = end - start;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const value = start + (range * progress);
            element.textContent = Math.round(value);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    // Utility method for API calls
    async apiCall(endpoint, options = {}) {
        if (!this.authToken) {
            throw new Error('Not authenticated');
        }

        const defaultOptions = {
            headers: {
                'Authorization': \Bearer \\,
                'Content-Type': 'application/json',
            },
        };

        const response = await fetch(endpoint, { ...defaultOptions, ...options });
        
        if (response.status === 401) {
            this.logout();
            throw new Error('Authentication required');
        }

        return response;
    }
}

// Utility functions
const Utils = {
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-ZA');
    },

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return \\h \m\;
    },

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    generateId() {
        return 'id-' + Math.random().toString(36).substr(2, 9);
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.mindFlowApp = new MindFlowApp();
    console.log('MindFlow AI Platform Ready!');
});
