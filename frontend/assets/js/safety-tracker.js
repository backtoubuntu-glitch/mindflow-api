// Enhanced Safety Tracker with Student Integration
class SafetyTracker {
    constructor() {
        this.isActive = false;
        this.currentLocation = null;
        this.students = [];
        this.emergencyContacts = [];
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupUI();
        this.startTracking();
        console.log('🛡️ Safety Tracker Initialized');
    }

    setupUI() {
        // Create safety status indicator if it doesn't exist
        if (!document.getElementById('safetyStatus')) {
            const statusElement = document.createElement('div');
            statusElement.id = 'safetyStatus';
            statusElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #28a745;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            statusElement.textContent = '🛡️ SAFE';
            document.body.appendChild(statusElement);
        }
        this.updateSafetyStatus();
    }

    startTracking() {
        if (navigator.geolocation) {
            this.isActive = true;
            
            navigator.geolocation.watchPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    this.saveToStorage();
                    this.updateSafetyStatus();
                    this.reportToBackend();
                },
                (error) => {
                    console.error('Safety tracking error:', error);
                    this.handleLocationError(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000
                }
            );
        }
    }

    updateLocation(location) {
        this.currentLocation = {
            ...location,
            timestamp: new Date().toISOString()
        };
        this.saveToStorage();
        this.updateSafetyStatus();
    }

    updateSafetyStatus() {
        const statusElement = document.getElementById('safetyStatus');
        if (statusElement) {
            if (this.isActive && this.currentLocation) {
                statusElement.textContent = '🛡️ SAFE';
                statusElement.style.background = '#28a745';
            } else {
                statusElement.textContent = '🛡️ OFFLINE';
                statusElement.style.background = '#6c757d';
            }
        }
    }

    triggerSafetyCheck() {
        this.showEmergencyModal();
        this.notifyEmergencyContacts();
        this.logEmergencyEvent('safety_check_triggered');
    }

    showEmergencyModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 400px;">
                <h2 style="color: #dc3545;">🚨 Safety Check</h2>
                <p>Are you safe and sound, Lerato?</p>
                <div style="margin-top: 20px;">
                    <button onclick="this.closest('div').parentElement.remove(); window.safetyTracker.handleSafetyResponse(true)" 
                            style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; margin: 5px;">
                        👍 I'm Safe
                    </button>
                    <button onclick="this.closest('div').parentElement.remove(); window.safetyTracker.handleEmergency()" 
                            style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 6px; margin: 5px;">
                        🆘 Need Help
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    handleSafetyResponse(isSafe) {
        if (isSafe) {
            this.showNotification('Thank you for confirming your safety!', 'success');
            this.logEmergencyEvent('safety_confirmed');
        }
    }

    handleEmergency() {
        this.triggerFullEmergency();
    }

    triggerFullEmergency() {
        // Show emergency modal
        const emergencyModal = document.createElement('div');
        emergencyModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(220, 53, 69, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;
        
        emergencyModal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 400px;">
                <h2 style="color: #dc3545;">🚨 EMERGENCY ACTIVATED</h2>
                <p><strong>Lerato Dube</strong> has triggered an emergency alert!</p>
                <p>Location: ${this.currentLocation ? 'Tracked' : 'Unknown'}</p>
                <div style="margin: 20px 0;">
                    <button onclick="this.closest('div').parentElement.remove(); window.safetyTracker.notifyAuthorities()" 
                            style="background: #dc3545; color: white; border: none; padding: 15px 25px; border-radius: 6px; font-size: 16px; margin: 5px;">
                        🚨 Notify Authorities
                    </button>
                    <button onclick="this.closest('div').parentElement.remove()" 
                            style="background: #6c757d; color: white; border: none; padding: 15px 25px; border-radius: 6px; font-size: 16px; margin: 5px;">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(emergencyModal);
        
        // Send emergency data to backend
        this.sendEmergencyData();
    }

    notifyAuthorities() {
        this.showNotification('Authorities have been notified with location data', 'warning');
        this.logEmergencyEvent('authorities_notified');
        
        // Simulate API call
        fetch('/.netlify/functions/safety', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'emergency_alert',
                student: 'Lerato Dube',
                location: this.currentLocation,
                timestamp: new Date().toISOString(),
                severity: 'high'
            })
        });
    }

    sendEmergencyData() {
        const emergencyData = {
            type: 'emergency_triggered',
            student: 'Lerato Dube',
            location: this.currentLocation,
            timestamp: new Date().toISOString(),
            contacts: this.emergencyContacts
        };
        
        // Send to backend
        fetch('/.netlify/functions/safety', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emergencyData)
        }).catch(error => {
            console.log('Emergency data logged locally');
        });
        
        this.logEmergencyEvent('emergency_triggered');
    }

    notifyEmergencyContacts() {
        // Simulate notifying emergency contacts
        console.log('Notifying emergency contacts...');
        this.showNotification('Safety check sent to emergency contacts', 'info');
    }

    showNotification(message, type = 'info') {
        // Reuse the notification system from dashboard
        if (window.studentTracker && window.studentTracker.showNotification) {
            window.studentTracker.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }

    logEmergencyEvent(eventType) {
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            location: this.currentLocation,
            student: 'Lerato Dube'
        };
        
        // Save to local storage
        const logs = JSON.parse(localStorage.getItem('safetyLogs') || '[]');
        logs.push(event);
        localStorage.setItem('safetyLogs', JSON.stringify(logs.slice(-50))); // Keep last 50 logs
    }

    handleLocationError(error) {
        console.error('Location error:', error);
        this.isActive = false;
        this.updateSafetyStatus();
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                this.showNotification('Location access denied. Safety features limited.', 'error');
                break;
            case error.POSITION_UNAVAILABLE:
                this.showNotification('Location unavailable. Using last known position.', 'warning');
                break;
            case error.TIMEOUT:
                this.showNotification('Location request timeout. Retrying...', 'warning');
                break;
        }
    }

    saveToStorage() {
        const data = {
            location: this.currentLocation,
            students: this.students,
            contacts: this.emergencyContacts,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('mindflowSafetyData', JSON.stringify(data));
    }

    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('mindflowSafetyData') || '{}');
            this.currentLocation = data.location || null;
            this.students = data.students || [];
            this.emergencyContacts = data.contacts || [];
        } catch (error) {
            console.error('Error loading safety data:', error);
        }
    }

    // Add student to tracking
    addStudent(student) {
        this.students.push(student);
        this.saveToStorage();
    }

    // Add emergency contact
    addEmergencyContact(contact) {
        this.emergencyContacts.push(contact);
        this.saveToStorage();
    }
}

// Initialize safety tracker
document.addEventListener('DOMContentLoaded', function() {
    window.safetyTracker = new SafetyTracker();
});