class SafetyTracker {
    constructor() {
        this.isTracking = false;
        this.watchId = null;
        this.safeZones = [];
        this.currentLocation = null;
        this.locationHistory = [];
        this.emergencyContacts = [];
        this.safetySettings = {
            enableTracking: true,
            geofencing: true,
            arrivalAlerts: true,
            departureAlerts: true,
            emergencyAlerts: true,
            updateInterval: 30000, // 30 seconds
            maxHistory: 100
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
        this.loadSafeZones();
        this.loadEmergencyContacts();
        
        console.log('Safety Tracker Initialized');
    }

    bindEvents() {
        // Safety control buttons
        this.safeAddEventListener('startTracking', 'click', () => this.startTracking());
        this.safeAddEventListener('stopTracking', 'click', () => this.stopTracking());
        this.safeAddEventListener('addSafeZone', 'click', () => this.addSafeZone());
        this.safeAddEventListener('testEmergency', 'click', () => this.testEmergencyAlert());

        // Settings toggles
        document.querySelectorAll('.safety-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => this.updateSetting(e.target.name, e.target.checked));
        });

        // Online/offline detection
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));

        // Visibility change (tab switch)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // Battery status monitoring
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.monitorBattery(battery);
            });
        }
    }

    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    async startTracking() {
        if (this.isTracking) {
            this.showMessage('Location tracking is already active', 'info');
            return;
        }

        if (!this.safetySettings.enableTracking) {
            this.showMessage('Location tracking is disabled in settings', 'warning');
            return;
        }

        try {
            await this.requestLocationPermission();
            
            this.isTracking = true;
            this.watchId = navigator.geolocation.watchPosition(
                (position) => this.handlePositionUpdate(position),
                (error) => this.handleLocationError(error),
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000
                }
            );

            this.updateTrackingUI(true);
            this.showMessage('Safety tracking started', 'success');
            this.logSafetyEvent('tracking_started');

            // Send initial location to server
            if (this.currentLocation) {
                await this.reportLocationToServer(this.currentLocation);
            }

        } catch (error) {
            console.error('Failed to start tracking:', error);
            this.showMessage('Failed to start location tracking', 'error');
        }
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.isTracking = false;
        this.updateTrackingUI(false);
        this.showMessage('Safety tracking stopped', 'info');
        this.logSafetyEvent('tracking_stopped');
    }

    async requestLocationPermission() {
        if (!('geolocation' in navigator)) {
            throw new Error('Geolocation is not supported by this browser');
        }

        // Request permission through the Permissions API if available
        if ('permissions' in navigator) {
            try {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                if (permission.state === 'denied') {
                    throw new Error('Location permission denied');
                }
            } catch (error) {
                console.warn('Permissions API not fully supported:', error);
            }
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                () => resolve(),
                (error) => reject(new Error(this.getLocationErrorMessage(error))),
                { timeout: 5000 }
            );
        });
    }

    handlePositionUpdate(position) {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
            speed: position.coords.speed || 0,
            heading: position.coords.heading || null
        };

        this.currentLocation = location;
        this.locationHistory.push(location);

        // Keep only recent history
        if (this.locationHistory.length > this.safetySettings.maxHistory) {
            this.locationHistory = this.locationHistory.slice(-this.safetySettings.maxHistory);
        }

        this.updateLocationUI(location);
        this.checkSafeZones(location);
        this.reportLocationToServer(location);
        this.updateLocationMap(location);

        console.log('Location updated:', location);
    }

    handleLocationError(error) {
        const errorMessage = this.getLocationErrorMessage(error);
        console.error('Location error:', errorMessage);
        
        this.showMessage(\Location error: \\, 'warning');
        this.logSafetyEvent('location_error', { error: errorMessage });

        // If permission denied, stop tracking
        if (error.code === error.PERMISSION_DENIED) {
            this.stopTracking();
        }
    }

    getLocationErrorMessage(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                return 'Location access denied by user';
            case error.POSITION_UNAVAILABLE:
                return 'Location information unavailable';
            case error.TIMEOUT:
                return 'Location request timed out';
            default:
                return 'Unknown location error';
        }
    }

    updateTrackingUI(tracking) {
        const startBtn = document.getElementById('startTracking');
        const stopBtn = document.getElementById('stopTracking');
        const statusIndicator = document.getElementById('trackingStatus');

        if (startBtn) startBtn.disabled = tracking;
        if (stopBtn) stopBtn.disabled = !tracking;
        
        if (statusIndicator) {
            statusIndicator.textContent = tracking ? 'Active' : 'Inactive';
            statusIndicator.className = \status-\\;
        }
    }

    updateLocationUI(location) {
        const locationElement = document.getElementById('currentLocation');
        const accuracyElement = document.getElementById('locationAccuracy');
        const timestampElement = document.getElementById('locationTimestamp');

        if (locationElement) {
            locationElement.textContent = \\, \\;
        }

        if (accuracyElement) {
            accuracyElement.textContent = \±\ meters\;
        }

        if (timestampElement) {
            timestampElement.textContent = location.timestamp.toLocaleTimeString();
        }
    }

    updateLocationMap(location) {
        // This would integrate with Leaflet.js or Google Maps
        // For now, just log the update
        console.log('Map location update:', location);
    }

    async checkSafeZones(location) {
        if (!this.safetySettings.geofencing) return;

        let enteredZone = null;
        let exitedZone = null;

        // Check if entered any safe zone
        for (const zone of this.safeZones) {
            const distance = this.calculateDistance(
                location.latitude, location.longitude,
                zone.latitude, zone.longitude
            );

            const isInside = distance <= zone.radius;

            if (isInside && !zone.lastStatus) {
                enteredZone = zone;
                zone.lastStatus = true;
            } else if (!isInside && zone.lastStatus) {
                exitedZone = zone;
                zone.lastStatus = false;
            }
        }

        // Trigger alerts
        if (enteredZone && this.safetySettings.arrivalAlerts) {
            this.triggerArrivalAlert(enteredZone);
        }

        if (exitedZone && this.safetySettings.departureAlerts) {
            this.triggerDepartureAlert(exitedZone);
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI/180);
    }

    triggerArrivalAlert(zone) {
        const message = \Arrived at safe zone: \\;
        this.showMessage(message, 'success');
        this.sendSafetyAlert('arrival', { zone: zone.name, location: this.currentLocation });
        this.logSafetyEvent('safe_zone_entered', { zone: zone.name });
    }

    triggerDepartureAlert(zone) {
        const message = \Left safe zone: \\;
        this.showMessage(message, 'warning');
        this.sendSafetyAlert('departure', { zone: zone.name, location: this.currentLocation });
        this.logSafetyEvent('safe_zone_exited', { zone: zone.name });
    }

    async addSafeZone() {
        if (!this.currentLocation) {
            this.showMessage('Need current location to create safe zone', 'warning');
            return;
        }

        const zoneName = prompt('Enter safe zone name:');
        if (!zoneName) return;

        const zoneRadius = parseInt(prompt('Enter safe zone radius (meters):', '100')) || 100;

        const safeZone = {
            id: this.generateId(),
            name: zoneName,
            latitude: this.currentLocation.latitude,
            longitude: this.currentLocation.longitude,
            radius: zoneRadius,
            created: new Date(),
            lastStatus: true // Assume inside when creating
        };

        this.safeZones.push(safeZone);
        this.saveSafeZones();
        this.updateSafeZonesUI();

        this.showMessage(\Safe zone \"\\" added\, 'success');
        this.logSafetyEvent('safe_zone_added', { zone: zoneName });
    }

    updateSafeZonesUI() {
        const zonesList = document.getElementById('safeZonesList');
        if (!zonesList) return;

        zonesList.innerHTML = this.safeZones.map(zone => \
            <div class=\"safe-zone-item\">
                <div class=\"zone-info\">
                    <strong>\</strong>
                    <div class=\"zone-details\">
                        \, \
                    </div>
                    <div class=\"zone-radius\">Radius: \m</div>
                </div>
                <button class=\"btn-danger\" onclick=\"window.safetyTracker.removeSafeZone('\')\">
                    <i class=\"fas fa-trash\"></i>
                </button>
            </div>
        \).join('');
    }

    removeSafeZone(zoneId) {
        this.safeZones = this.safeZones.filter(zone => zone.id !== zoneId);
        this.saveSafeZones();
        this.updateSafeZonesUI();
        this.showMessage('Safe zone removed', 'info');
    }

    async testEmergencyAlert() {
        if (!confirm('Send test emergency alert?')) return;

        try {
            await this.triggerEmergencyAlert('test');
            this.showMessage('Test emergency alert sent', 'success');
        } catch (error) {
            this.showMessage('Failed to send test alert', 'error');
        }
    }

    async triggerEmergencyAlert(type = 'emergency', details = {}) {
        if (!this.safetySettings.emergencyAlerts) return;

        const alertData = {
            type: type,
            timestamp: new Date().toISOString(),
            location: this.currentLocation,
            deviceInfo: this.getDeviceInfo(),
            ...details
        };

        // Show local alert
        this.showEmergencyNotification(alertData);

        // Send to server
        await this.sendEmergencyAlertToServer(alertData);

        // Notify emergency contacts
        await this.notifyEmergencyContacts(alertData);

        this.logSafetyEvent('emergency_alert_triggered', alertData);
    }

    showEmergencyNotification(alertData) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification('Safety Alert', {
                body: \Emergency alert triggered: \\,
                icon: '/assets/images/emergency-icon.png',
                requireInteraction: true
            });
        }

        // Also show in-app notification
        this.showMessage(\EMERGENCY: \ ALERT\, 'error');
    }

    async sendEmergencyAlertToServer(alertData) {
        try {
            await window.API.request('/safety/emergency', {
                method: 'POST',
                body: JSON.stringify(alertData)
            });
        } catch (error) {
            console.error('Failed to send emergency alert to server:', error);
            // Store for retry
            this.queueEmergencyAlert(alertData);
        }
    }

    async notifyEmergencyContacts(alertData) {
        for (const contact of this.emergencyContacts) {
            try {
                await this.sendContactNotification(contact, alertData);
            } catch (error) {
                console.error(\Failed to notify contact \:\, error);
            }
        }
    }

    async sendContactNotification(contact, alertData) {
        // This would integrate with email/SMS services
        console.log('Notifying emergency contact:', contact, alertData);
        
        // For now, just log the notification
        this.logSafetyEvent('contact_notified', {
            contact: contact.name,
            method: contact.method,
            alert: alertData.type
        });
    }

    queueEmergencyAlert(alertData) {
        const pendingAlerts = JSON.parse(localStorage.getItem('mindflow_pending_alerts') || '[]');
        pendingAlerts.push(alertData);
        localStorage.setItem('mindflow_pending_alerts', JSON.stringify(pendingAlerts));
    }

    async retryPendingAlerts() {
        const pendingAlerts = JSON.parse(localStorage.getItem('mindflow_pending_alerts') || '[]');
        
        for (const alert of pendingAlerts) {
            try {
                await this.sendEmergencyAlertToServer(alert);
                // Remove successful alert
                pendingAlerts.splice(pendingAlerts.indexOf(alert), 1);
            } catch (error) {
                console.error('Failed to retry alert:', error);
            }
        }

        localStorage.setItem('mindflow_pending_alerts', JSON.stringify(pendingAlerts));
    }

    handleConnectionChange(online) {
        if (online) {
            this.showMessage('Connection restored', 'success');
            this.retryPendingAlerts();
        } else {
            this.showMessage('Connection lost - alerts queued', 'warning');
        }
    }

    handleVisibilityChange() {
        if (!document.hidden && this.isTracking) {
            // Tab became visible, refresh location
            this.refreshLocation();
        }
    }

    monitorBattery(battery) {
        battery.addEventListener('levelchange', () => {
            if (battery.level < 0.2) {
                this.showMessage('Low battery - safety features may be affected', 'warning');
            }
        });

        battery.addEventListener('chargingchange', () => {
            if (battery.charging) {
                this.logSafetyEvent('device_charging');
            }
        });
    }

    refreshLocation() {
        if (!this.isTracking) return;

        navigator.geolocation.getCurrentPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => this.handleLocationError(error),
            { timeout: 10000 }
        );
    }

    updateSetting(setting, value) {
        this.safetySettings[setting] = value;
        this.saveSettings();

        if (setting === 'enableTracking' && !value && this.isTracking) {
            this.stopTracking();
        }

        this.showMessage(\\ \\, 'success');
    }

    loadSettings() {
        const saved = localStorage.getItem('mindflow_safety_settings');
        if (saved) {
            this.safetySettings = { ...this.safetySettings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('mindflow_safety_settings', JSON.stringify(this.safetySettings));
    }

    loadSafeZones() {
        const saved = localStorage.getItem('mindflow_safe_zones');
        if (saved) {
            this.safeZones = JSON.parse(saved);
            this.updateSafeZonesUI();
        }
    }

    saveSafeZones() {
        localStorage.setItem('mindflow_safe_zones', JSON.stringify(this.safeZones));
    }

    loadEmergencyContacts() {
        const saved = localStorage.getItem('mindflow_emergency_contacts');
        if (saved) {
            this.emergencyContacts = JSON.parse(saved);
        }
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            online: navigator.onLine
        };
    }

    generateId() {
        return 'id-' + Math.random().toString(36).substr(2, 9);
    }

    logSafetyEvent(event, data = {}) {
        const logEntry = {
            event,
            timestamp: new Date().toISOString(),
            location: this.currentLocation,
            ...data
        };

        const safetyLog = JSON.parse(localStorage.getItem('mindflow_safety_log') || '[]');
        safetyLog.push(logEntry);
        localStorage.setItem('mindflow_safety_log', JSON.stringify(safetyLog.slice(-1000)));

        console.log('Safety Event:', logEntry);
    }

    showMessage(message, type = 'info') {
        if (window.mindFlowApp) {
            window.mindFlowApp.showNotification(message, type);
        } else {
            console.log(\[\] \\);
        }
    }

    // Public method to get current safety status
    getSafetyStatus() {
        return {
            isTracking: this.isTracking,
            currentLocation: this.currentLocation,
            safeZones: this.safeZones.length,
            emergencyContacts: this.emergencyContacts.length,
            settings: this.safetySettings
        };
    }

    // Cleanup method
    destroy() {
        this.stopTracking();
        console.log('Safety Tracker Destroyed');
    }
}

// Initialize safety tracker
document.addEventListener('DOMContentLoaded', () => {
    window.safetyTracker = new SafetyTracker();
});
