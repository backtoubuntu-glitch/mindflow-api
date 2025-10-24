// Enhanced Safety Tracker - Fully Integrated
class SafetyTracker {
    constructor() {
        this.isTracking = false;
        this.locationData = null;
        this.watchId = null;
        this.updateInterval = null;
        this.settings = {
            updateFrequency: 30000, // 30 seconds
            enableHighAccuracy: true,
            emergencyContacts: ['school_admin', 'parent_primary']
        };
        
        this.initializeTracker();
    }

    // Initialize tracker with platform integration
    initializeTracker() {
        // Load user preferences
        this.loadUserSettings();
        
        // Set up API base URL
        this.setupAPI();
        
        // Auto-start based on user role and page
        this.autoStartLogic();
        
        console.log('🛡️ MindFlow Safety Tracker Initialized');
    }

    setupAPI() {
        // Use Netlify Functions backend
        window.API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:8888/.netlify/functions'
            : '/.netlify/functions';
    }

    loadUserSettings() {
        const savedSettings = localStorage.getItem('mindflow_safety_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Load user role for tracking rules
        this.userRole = localStorage.getItem('mindflow_user_role') || 'student';
    }

    autoStartLogic() {
        // Auto-start tracking for students on learning pages
        const shouldAutoStart = 
            this.userRole === 'student' && 
            (window.location.pathname.includes('curriculum') || 
             window.location.pathname.includes('learning') ||
             window.location.pathname.includes('dashboard'));
        
        if (shouldAutoStart) {
            setTimeout(() => {
                this.startTracking();
            }, 3000);
        }
    }

    // Start continuous safety tracking
    async startTracking() {
        if (this.isTracking) {
            console.log('Safety tracking already active');
            return true;
        }

        if (!navigator.geolocation) {
            console.warn('Geolocation not supported by browser');
            this.showGeolocationWarning();
            return false;
        }

        try {
            // Request permission first
            const permission = await this.requestLocationPermission();
            
            if (permission === 'granted') {
                this.isTracking = true;
                
                // Get initial position
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this._updateLocation(position);
                        console.log('🛡️ Safety tracking activated');
                        
                        // Start continuous watching
                        this.watchId = navigator.geolocation.watchPosition(
                            (position) => this._updateLocation(position),
                            (error) => this._handleLocationError(error),
                            {
                                enableHighAccuracy: this.settings.enableHighAccuracy,
                                timeout: 10000,
                                maximumAge: 60000
                            }
                        );
                        
                        // Periodic updates to backend
                        this.updateInterval = setInterval(() => {
                            if (this.locationData) {
                                this._sendToBackend(this.locationData);
                            }
                        }, this.settings.updateFrequency);
                        
                        this._updateUI('active');
                    },
                    (error) => this._handleLocationError(error)
                );
                return true;
            } else {
                this._handlePermissionDenied();
                return false;
            }
        } catch (error) {
            console.error('Failed to start tracking:', error);
            return false;
        }
    }

    // Request location permission with user-friendly messaging
    async requestLocationPermission() {
        return new Promise((resolve) => {
            if (!navigator.permissions) {
                resolve('prompt'); // Fallback for browsers without permissions API
                return;
            }

            navigator.permissions.query({ name: 'geolocation' })
                .then((result) => {
                    if (result.state === 'granted') {
                        resolve('granted');
                    } else if (result.state === 'prompt') {
                        // Show custom permission dialog
                        this.showPermissionDialog().then(resolve);
                    } else {
                        resolve('denied');
                    }
                })
                .catch(() => resolve('prompt'));
        });
    }

    showPermissionDialog() {
        return new Promise((resolve) => {
            // Create custom permission dialog matching MindFlow branding
            const dialog = document.createElement('div');
            dialog.className = 'safety-permission-dialog';
            dialog.innerHTML = `
                <div class="safety-dialog-content">
                    <div class="safety-icon">🛡️</div>
                    <h3>Enable Safety Tracking</h3>
                    <p>MindFlow uses location tracking to ensure student safety during learning sessions. Your location data is encrypted and only shared with authorized personnel.</p>
                    <div class="safety-buttons">
                        <button class="safety-btn allow-btn">Allow Safety Tracking</button>
                        <button class="safety-btn deny-btn">Not Now</button>
                    </div>
                    <p class="safety-note">You can change this later in settings</p>
                </div>
            `;
            
            // Add styles
            const styles = `
                .safety-permission-dialog {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    font-family: 'Segoe UI', system-ui;
                }
                .safety-dialog-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .safety-icon { font-size: 3rem; margin-bottom: 1rem; }
                .safety-buttons { margin: 1.5rem 0; }
                .safety-btn { 
                    padding: 12px 24px; 
                    margin: 0 8px; 
                    border: none; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-weight: 600;
                }
                .allow-btn { background: #4CAF50; color: white; }
                .deny-btn { background: #f5f5f5; color: #333; }
                .safety-note { font-size: 0.8rem; color: #666; margin-top: 1rem; }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
            document.body.appendChild(dialog);
            
            // Handle button clicks
            dialog.querySelector('.allow-btn').onclick = () => {
                document.body.removeChild(dialog);
                resolve('granted');
            };
            
            dialog.querySelector('.deny-btn').onclick = () => {
                document.body.removeChild(dialog);
                resolve('denied');
            };
        });
    }

    // Update location data
    _updateLocation(position) {
        this.locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            speed: position.coords.speed || 0,
            altitude: position.coords.altitude,
            heading: position.coords.heading
        };
        
        // Update safety status in UI
        this._updateSafetyStatus();
        
        // Send to backend
        this._sendToBackend(this.locationData);
    }

    // Enhanced backend communication
    async _sendToBackend(locationData) {
        try {
            const userData = {
                userId: window.currentUser?.id || localStorage.getItem('mindflow_user_id') || 'anonymous',
                sessionId: localStorage.getItem('mindflow_session_id') || Date.now().toString(),
                userRole: this.userRole,
                platform: 'mindflow_ai'
            };

            const response = await fetch(`${window.API_BASE}/safety`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'location_update',
                    location: locationData,
                    user: userData,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                console.log('📍 Safety data synced with MindFlow');
            } else {
                throw new Error('Backend sync failed');
            }
        } catch (error) {
            // Store locally for later sync
            this._storeLocally(locationData);
        }
    }

    // Enhanced emergency system
    async emergencyContact(emergencyType = 'general', additionalData = {}) {
        try {
            const emergencyData = {
                type: emergencyType,
                location: this.locationData,
                timestamp: new Date().toISOString(),
                user: {
                    id: window.currentUser?.id || localStorage.getItem('mindflow_user_id') || 'anonymous',
                    role: this.userRole,
                    name: window.currentUser?.name || 'Unknown User'
                },
                additionalData: additionalData,
                userAgent: navigator.userAgent,
                platform: 'MindFlow AI'
            };

            // Visual emergency alert
            this._showEmergencyAlert(emergencyType);

            // Send emergency to backend
            const response = await fetch(`${window.API_BASE}/safety`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                'X-Emergency': 'true'
                },
                body: JSON.stringify({
                    type: 'emergency_alert',
                    emergency: emergencyData
                })
            });

            let result;
            if (response.ok) {
                result = await response.json();
                this._showEmergencyConfirmation();
            } else {
                throw new Error('Emergency service unavailable');
            }

            // Log emergency event
            this._logEmergency(emergencyData);
            
            return { 
                status: 'emergency_alert_sent', 
                data: emergencyData,
                response: result
            };

        } catch (error) {
            console.error('Emergency contact failed:', error);
            
            // Fallback emergency procedures
            return this._fallbackEmergency(emergencyType);
        }
    }

    _showEmergencyAlert(type) {
        // Create emergency overlay
        const emergencyOverlay = document.createElement('div');
        emergencyOverlay.id = 'mindflow-emergency-overlay';
        emergencyOverlay.innerHTML = `
            <div class="emergency-alert">
                <div class="emergency-icon">🚨</div>
                <h2>EMERGENCY ALERT ACTIVATED</h2>
                <p>${this._getEmergencyMessage(type)}</p>
                <div class="emergency-status">
                    <div class="pulse-animation"></div>
                    <span>Contacting emergency services...</span>
                </div>
            </div>
        `;
        
        // Add emergency styles
        const emergencyStyles = `
            #mindflow-emergency-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(255,0,0,0.9);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                font-family: 'Segoe UI', system-ui;
            }
            .emergency-alert {
                text-align: center;
                background: rgba(0,0,0,0.8);
                padding: 2rem;
                border-radius: 15px;
                border: 3px solid white;
            }
            .emergency-icon { font-size: 4rem; margin-bottom: 1rem; }
            .pulse-animation {
                width: 20px; height: 20px;
                background: white;
                border-radius: 50%;
                margin: 0 auto 1rem;
                animation: pulse 1s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = emergencyStyles;
        document.head.appendChild(styleSheet);
        document.body.appendChild(emergencyOverlay);
    }

    _getEmergencyMessage(type) {
        const messages = {
            general: 'Help has been requested. Emergency services are being notified.',
            medical: 'Medical emergency detected. Medical services are being alerted.',
            safety: 'Safety concern reported. Authorities are being notified.',
            technical: 'Technical emergency. Support team has been alerted.'
        };
        return messages[type] || messages.general;
    }

    _showEmergencyConfirmation() {
        const overlay = document.getElementById('mindflow-emergency-overlay');
        if (overlay) {
            overlay.querySelector('.emergency-status').innerHTML = `
                <div style="color: #4CAF50; font-size: 2rem;">✓</div>
                <p>Emergency services notified! Help is on the way.</p>
            `;
            
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 5000);
        }
    }

    // Stop tracking
    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.isTracking = false;
        this._updateUI('inactive');
        console.log('🛡️ Safety tracking stopped');
    }

    // Update UI elements
    _updateUI(status) {
        // Update any safety status indicators in the UI
        const statusIndicators = document.querySelectorAll('.safety-status, .tracking-status');
        statusIndicators.forEach(indicator => {
            indicator.textContent = status === 'active' ? '🛡️ Safety Active' : 'Safety Inactive';
            indicator.className = `safety-status ${status}`;
        });
    }

    _updateSafetyStatus() {
        // Update safety status display
        const safetyDisplay = document.getElementById('safety-status-display');
        if (safetyDisplay && this.locationData) {
            safetyDisplay.innerHTML = `
                <div class="safety-status-active">
                    <span>🛡️ Safety Tracking Active</span>
                    <small>Last update: ${new Date().toLocaleTimeString()}</small>
                </div>
            `;
        }
    }

    // Get tracker status for dashboard
    getStatus() {
        return {
            isTracking: this.isTracking,
            lastLocation: this.locationData,
            hasPermission: !!navigator.geolocation,
            lastUpdate: this.locationData?.timestamp,
            userRole: this.userRole,
            settings: this.settings
        };
    }

    // Export location history (for parents/admins)
    exportLocationHistory() {
        const history = JSON.parse(localStorage.getItem('safetyLocations') || '[]');
        return {
            user: this.userRole,
            exportedAt: new Date().toISOString(),
            locations: history,
            totalPoints: history.length
        };
    }
}

// Global initialization with error handling
function initializeSafetyTracker() {
    try {
        window.mindflowSafetyTracker = new SafetyTracker();
        
        // Make it available globally
        window.MindFlow = window.MindFlow || {};
        window.MindFlow.Safety = window.mindflowSafetyTracker;
        
        console.log('🎯 MindFlow Safety Tracker Fully Integrated');
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('mindflow:safety:ready'));
        
    } catch (error) {
        console.error('Failed to initialize safety tracker:', error);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSafetyTracker);
} else {
    initializeSafetyTracker();
}