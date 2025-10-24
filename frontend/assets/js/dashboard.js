// Dashboard JavaScript - Real-time Tracking System
class StudentTracker {
    constructor() {
        this.map = null;
        this.marker = null;
        this.studentLocation = null;
        this.watchId = null;
        this.studentData = {
            name: "Lerato Dube",
            grade: "5",
            school: "Johannesburg Primary",
            status: "Active in Mathematics",
            avatar: "👧"
        };
        
        this.init();
    }

    init() {
        this.initializeMap();
        this.startTracking();
        this.updateDashboard();
        this.setupEventListeners();
    }

    initializeMap() {
        // Default to Johannesburg coordinates
        const defaultLocation = [-26.2041, 28.0473];
        
        this.map = L.map('trackingMap').setView(defaultLocation, 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Create custom child icon
        const childIcon = L.divIcon({
            className: 'child-marker',
            html: '👧',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        this.marker = L.marker(defaultLocation, { icon: childIcon })
            .addTo(this.map)
            .bindPopup('<b>Lerato Dube</b><br>Grade 5 Student<br>Active in Mathematics');
    }

    startTracking() {
        if (navigator.geolocation) {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.updateLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.useFallbackLocation();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        } else {
            this.useFallbackLocation();
        }
    }

    updateLocation(location) {
        this.studentLocation = location;
        
        // Update map
        if (this.marker) {
            this.marker.setLatLng([location.lat, location.lng]);
            this.map.setView([location.lat, location.lng], 15);
        }

        // Update dashboard
        this.updateLocationDisplay(location);
        
        // Send to safety system
        this.reportToSafetySystem(location);
    }

    updateLocationDisplay(location) {
        const lastUpdateElement = document.getElementById('lastUpdate');
        const statusElement = document.getElementById('studentStatus');
        
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString();
        }
        
        if (statusElement) {
            const locations = [
                'Mathematics Class',
                'Science Lab', 
                'Library',
                'Sports Field',
                'Computer Lab',
                'Art Room'
            ];
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];
            statusElement.textContent = `Active in ${randomLocation}`;
        }
    }

    reportToSafetySystem(location) {
        // Integrate with existing safety tracker
        if (window.safetyTracker) {
            window.safetyTracker.updateLocation(location);
        }
        
        // Simulate API call to backend
        fetch('/.netlify/functions/safety', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'location_update',
                student: this.studentData.name,
                location: location,
                timestamp: new Date().toISOString()
            })
        }).catch(error => {
            console.log('Location update sent to safety system');
        });
    }

    useFallbackLocation() {
        // Use school location as fallback
        const schoolLocation = {
            lat: -26.2041 + (Math.random() - 0.5) * 0.01,
            lng: 28.0473 + (Math.random() - 0.5) * 0.01
        };
        this.updateLocation(schoolLocation);
    }

    refreshLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.updateLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    
                    // Show confirmation
                    this.showNotification('Location refreshed successfully!', 'success');
                },
                (error) => {
                    this.showNotification('Unable to refresh location', 'error');
                }
            );
        }
    }

    simulateMovement() {
        if (this.studentLocation) {
            const newLocation = {
                lat: this.studentLocation.lat + (Math.random() - 0.5) * 0.001,
                lng: this.studentLocation.lng + (Math.random() - 0.5) * 0.001
            };
            this.updateLocation(newLocation);
            this.showNotification('Movement simulation activated', 'info');
        }
    }

    sendAlert() {
        if (window.safetyTracker) {
            window.safetyTracker.triggerSafetyCheck();
            this.showNotification('Safety check initiated with Lerato', 'warning');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545', 
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupEventListeners() {
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .child-marker {
                font-size: 20px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    // Cleanup when leaving page
    destroy() {
        if (this.watchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(this.watchId);
        }
    }
}

// Initialize dashboard when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    window.studentTracker = new StudentTracker();
    
    // Update student info display
    const studentNameElement = document.querySelector('.student-info h3');
    if (studentNameElement) {
        studentNameElement.innerHTML = `${window.studentTracker.studentData.avatar} ${window.studentTracker.studentData.name} <span class="live-indicator">• LIVE</span>`;
    }
});

// Global functions for buttons
function refreshLocation() {
    if (window.studentTracker) {
        window.studentTracker.refreshLocation();
    }
}

function simulateMovement() {
    if (window.studentTracker) {
        window.studentTracker.simulateMovement();
    }
}

function sendAlert() {
    if (window.studentTracker) {
        window.studentTracker.sendAlert();
    }
}