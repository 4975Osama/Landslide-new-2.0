// Map 2 - Optimized 3D Mapbox Map
class Map2Controller {
    constructor() {
        this.map = null;
        this.currentMarker = null;
        this.selectedLocation = null;
        this.mapContainer = 'map2';
        this.eventListeners = [];
        this.debounceTimeout = null;
        
        // Mapbox access token
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2FyaW0yNDAiLCJhIjoiY2xxbnZhbGNtMWNtZzJrcDl2amk5bndjbiJ9.K-VQe8qVvIij9URoQR0WaA';
    }

    initialize() {
        try {
            // Check if container exists
            if (!document.getElementById(this.mapContainer)) {
                throw new Error(`Map container #${this.mapContainer} not found`);
            }

            // Create map with optimized settings
            this.map = new mapboxgl.Map({
                container: this.mapContainer,
                style: 'mapbox://styles/mapbox/satellite-v9',
                center: [74.3441, 35.9078],
                zoom: 12,
                pitch: 60,
                bearing: 0,
                antialias: true,
                maxZoom: 18,
                minZoom: 3,
                renderWorldCopies: false // Performance optimization
            });

            // Create marker once and reuse
            this.currentMarker = new mapboxgl.Marker({
                color: '#ff6b6b',
                scale: 1.2
            });

            // Add controls with better positioning
            this.map.addControl(new mapboxgl.FullscreenControl(), "top-right");
            this.map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-left");

            // Setup event listeners
            this.setupEventListeners();

            console.log('Map2 initialized successfully');
        } catch (error) {
            console.error('Error initializing Map2:', error);
            this.showError(error.message);
        }
    }

    setupEventListeners() {
        // Load 3D terrain after style is loaded
        const styleLoadListener = () => this.add3DTerrain();
        this.map.on('style.load', styleLoadListener);
        this.eventListeners.push({ event: 'style.load', handler: styleLoadListener });

        // Handle map clicks with debounce
        const clickListener = (e) => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                const { lng, lat } = e.lngLat;
                this.updateLocation(lat, lng);
                
                // Sync with map1 if available
                if (window.map1Controller && typeof window.map1Controller.updateLocation === 'function') {
                    window.map1Controller.updateLocation(lat, lng);
                }
            }, 100); // 100ms debounce
        };
        
        this.map.on('click', clickListener);
        this.eventListeners.push({ event: 'click', handler: clickListener });
    }

    add3DTerrain() {
        // Check if source already exists to avoid duplicates
        if (!this.map.getSource('mapbox-dem')) {
            this.map.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
            
            this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

            // Add sky layer if it doesn't exist
            if (!this.map.getLayer('sky')) {
                this.map.addLayer({
                    'id': 'sky',
                    'type': 'sky',
                    'paint': {
                        'sky-type': 'atmosphere',
                        'sky-atmosphere-sun': [0.0, 0.0],
                        'sky-atmosphere-sun-intensity': 15
                    }
                });
            }
        }
    }

    syncLocation(lat, lng) {
        if (!this.map) return;
        
        this.updateLocation(lat, lng);
        
        // Use optimized flyTo with essential flag for performance
        this.map.flyTo({
            center: [lng, lat],
            zoom: 15,
            pitch: 70,
            bearing: 0,
            essential: true,
            duration: 1500 // Smoother transition
        });
    }

    updateLocation(lat, lng) {
        if (!this.map || !this.currentMarker) return;

        // Update existing marker instead of creating a new one
        this.currentMarker
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
                <div style="font-weight: 600; margin-bottom: 8px;">3D Location View</div>
                <div>Latitude: ${lat.toFixed(6)}</div>
                <div>Longitude: ${lng.toFixed(6)}</div>
                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    Synchronized view
                </div>
            `))
            .addTo(this.map);

        this.selectedLocation = { lat, lng };
    }

    showError(message = 'An error occurred with the 3D map') {
        const container = document.getElementById(this.mapContainer);
        if (container) {
            container.innerHTML = `
                <div style="color: #ff4444; padding: 20px; text-align: center;">
                    <h3>Map Error</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        // Clear timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        // Remove event listeners
        this.eventListeners.forEach(({ event, handler }) => {
            if (this.map) this.map.off(event, handler);
        });
        
        // Remove marker
        if (this.currentMarker) {
            this.currentMarker.remove();
        }
        
        // Remove map
        if (this.map) {
            this.map.remove();
        }
        
        this.map = null;
        this.currentMarker = null;
        this.selectedLocation = null;
    }
}

// Initialize Map2 when DOM is loaded with error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.map2Controller = new Map2Controller();
        window.map2Controller.initialize();
        
        // Cleanup on page unload to prevent memory leaks
        window.addEventListener('beforeunload', function() {
            if (window.map2Controller) {
                window.map2Controller.destroy();
            }
        });
    } catch (error) {
        console.error('Failed to initialize Map2Controller:', error);
    }
});