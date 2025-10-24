// MIND FLOW AD SYSTEM
class AdSystem {
    constructor() {
        console.log('📢 Ad System Initialized');
        this.placeAds();
    }

    placeAds() {
        // Children ads - minimal
        const childSpots = document.querySelectorAll('.ad-children-spot');
        childSpots.forEach(spot => {
            spot.innerHTML = `
                <div style="text-align: center; padding: 10px; font-size: 0.8em;">
                    <div style="color: #00D4FF;">Sponsored Lesson</div>
                    <div>🌟 Powered by TechCorp Africa</div>
                </div>
            `;
        });

        // Parent/Teacher ads
        const parentSpots = document.querySelectorAll('.ad-parents-spot');
        parentSpots.forEach(spot => {
            spot.innerHTML = `
                <div class="tech-card">
                    <div style="color: #00D4FF; font-size: 0.8em;">EDUCATIONAL PARTNER</div>
                    <h4>🔬 STEM Learning Kit</h4>
                    <p>Hands-on science experiments for home learning</p>
                    <button class="tech-btn">Learn More</button>
                </div>
            `;
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.adSystem = new AdSystem();
});