// You need to add your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FyaW0yNDAiLCJhIjoiY2xxbnZhbGNtMWNtZzJrcDl2amk5bndjbiJ9.K-VQe8qVvIij9URoQR0WaA';

const map1 = new mapboxgl.Map({
    container: 'map1',
    style: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite view
    center: [69.3451, 30.3753],
    zoom: 4.5,
    pitch: 0,
    bearing: 0
});

// Add navigation controls
map1.addControl(new mapboxgl.NavigationControl());

// Modify the click event to only sync with map2
map1.on('click', (e) => {
    const { lng, lat } = e.lngLat;

    // Only sync with map2, no flying or zooming on map1
    if (window.map2Controller) {
        window.map2Controller.syncLocation(lat, lng);
    }
});

// Add basemap styles configuration
const basemapStyles = {
    'navigation-night': 'mapbox://styles/mapbox/navigation-night-v1',
    'light': 'mapbox://styles/mapbox/light-v11',
    'monochrome': 'mapbox://styles/daudi97/ckcouhqzd0l1f1io3zw42a9s7',
    'pencil': 'mapbox://styles/daudi97/ckdudgjow12jd19prca4m3p1a',
    'dark': 'mapbox://styles/mapbox/dark-v11',
    'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
    'satellite': 'mapbox://styles/mapbox/satellite-streets-v12',
    'streets': 'mapbox://styles/mapbox/streets-v12'
};

// Store layer states
const layerStates = {
    national: false,
    province: false,
    district: false,
    major: false,
    highways: false,
    risk: false, // Separate risk layer
    zonationGroup1: false, // For preci, BALO, GB, AJK (removed risk)
    zonationGroup2: false, // For veryhigh_kkh, HIGH, low, verylow, jaglot
    glofass50mm: false,
    jsrRds: false,
    rds: false,
    inventory: false,
    landslideHotspot: false,
    tourism: false,
    projectionLayers: false,
    currentPoints: false,
    historicalPoints: false
};

// Function to add terrain
function addTerrain() {
    if (!map1.getSource('mapbox-dem')) {
        map1.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
        });
    }
    map1.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
}

//function for 10yearinventory 
// Load inventory GeoJSON before map load
let inventory = null;

fetch('geojson/pointa_inventories.geojson')
    .then(response => response.json())
    .then(data => {
        inventory = data;
        // Now add the layer if map is already loaded
        if (map1.isStyleLoaded()) {
            addLandslidePoints(map1);
        } else {
            map1.once('load', () => addLandslidePoints(map1));
        }
    })
    .catch(error => {
        console.error('Failed to load inventory GeoJSON:', error);
    });

function addLandslidePoints(map) {
    // Check if inventory is loaded
    if (!inventory) {
        console.error('Inventory data not loaded yet');
        return;
    }

    // Add source
    if (!map.getSource('landslide_inventory')) {
        map.addSource('landslide_inventory', {
            type: 'geojson',
            data: inventory
        });
    }

    // Add layer
    if (!map.getLayer('landslide_points')) {
        map.addLayer({
            id: 'landslide_points',
            type: 'circle',
            source: 'landslide_inventory',
            layout: {
                visibility: layerStates.inventory ? 'visible' : 'none'
            },
            paint: {
                'circle-radius': [
                    'match',
                    ['get', 'landslid_2'],
                    'very_high', 38,
                    'large', 16,
                    'medium', 10,
                    'small', 7,
                    4
                ],
                'circle-color': [
                    'match',
                    ['get', 'landslid_2'],
                    'very_high', '#e75d0a',
                    'large', '#950505',
                    'medium', '#e75d0a',
                    'small', '#fbfafb',
                    '#808080'
                ],
                'circle-opacity': 1,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#000000'
            }
        });

        // Click interaction
        map1.on('click', 'landslide_points', (e) => {
            const properties = e.features[0].properties;
            const popupContent = createPopupContent(properties);

            new mapboxgl.Popup()
                .setLngLat([parseFloat(properties.longitude), parseFloat(properties.latitude)])
                .setHTML(popupContent)
                .addTo(map1);
        });

        // Hover effects
        map1.on('mouseenter', 'landslide_points', () => {
            map1.getCanvas().style.cursor = 'pointer';
        });
        map1.on('mouseleave', 'landslide_points', () => {
            map1.getCanvas().style.cursor = '';
        });
    }
}

function createPopupContent(properties) {
    const formatField = (label, value) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #BBDDFF;">
            <span style="font-weight: 600; opacity: 0.8;">${label}</span>
            <span>${value || 'N/A'}</span>
        </div>
    `;

    return `
        <div class="futuristic-popup" style="
            font-family: sans-serif;
            max-width: 320px;
            background: rgba(0, 5, 15, 0.9);
            color: white;
            border: 1px solid #00f3ff;
            box-shadow: 0 0 15px rgba(6, 8, 8, 0.5);
            position: relative;
            overflow: hidden;
            border-radius: 4px;
        ">
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #0A0A6A, #0A0A8A, #0A0A6A);
                animation: popupGlow 2s ease-in-out infinite alternate;
            "></div>
            
            <div style="
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                background: linear-gradient(90deg, rgba(0, 20, 40, 0.7) 0%, rgba(0, 50, 80, 0.5) 100%);
                padding: 10px;
                border-radius: 4px;
            ">
                <div style="
                    width: 12px;
                    height: 12px;
                    background: #4285F4;
                    border-radius: 50%;
                    margin-right: 10px;
                    box-shadow: 0 0 10px #4285F4;
                    animation: pulseDot 1.5s infinite;
                "></div>
                <h3 style="
                    margin: 0;
                    font-size: 18px;
                    color: #E5E5E5;
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
                    font-family: 'Orbitron', monospace;
                    letter-spacing: 1px;
                ">📍 Landslide Event</h3>
            </div>

            <div style="
                background: rgba(10, 10, 106, 0.3);
                border: 1px solid #0A0A6A;
                border-radius: 8px;
                padding: 15px;
            ">
                ${formatField("Event Time:", properties.event_time)}
                ${formatField("Title:", properties.event_titl)}
                ${formatField("Description: ", properties.event_desc)}
                ${formatField("Reason:", properties.landslid_1)}
                ${formatField("Intensity:", properties.landslid_2)}
                ${formatField("Area:", properties.landslid_3)}
                ${formatField("Fatalities:", properties.fatality_c)}
                ${formatField("Injuries:", properties.injury_cou)}
            </div>

            <div class="scanline" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    to bottom,
                    transparent 0%,
                    rgba(0, 243, 255, 0.05) 50%,
                    transparent 100%
                );
                animation: scan 4s linear infinite;
                pointer-events: none;
                opacity: 0.5;
            "></div>

            <style>
                @keyframes popupGlow {
                    0% { opacity: 0.4; }
                    100% { opacity: 0.8; }
                }
                
                @keyframes pulseDot {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                }
                
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
            </style>
        </div>
    `;
}


// Define layer groups
const projectionLayers = [
    // { id: "apr_2025", name: "April 2025" },
    // { id: "may_2025", name: "May 2025" },
    // { id: "june_2025", name: "June 2025" },
    // { id: "july_july_precipitation", name: "July Precipitation" },
    // { id: "bnbnbnbbbn", name: "August Projection" },
    { id: "sep_sep_precipaptiuon", name: "September Precipitation" },
    { id: "Oct_25", name: "Oct_25" },
    { id: "Nov_25", name: "Nov_25" },
    { id: "Dec_25", name: "Dec_25" },
];

const pointsLayers = [
    // { id: "Aprl", name: "April Points" },
    // { id: "May", name: "May Points" },
    // { id: "Jun", name: "June Points" },
    // { id: "JULY2025", name: "July 2025" },
    // { id: "AUGUST2025", name: "August 2025" },
    { id: "september2025", name: "September 2025" },
    { id: "Oct_points", name: "Oct_points" },
    { id: "Nov_points", name: "Nov_points" },
    { id: "Dec_points", name: "Dec_points" }
];

const pointsLayers2 = [
    { id: "LP_twentyfourteen", name: "2014" },
    { id: "LP_twentyfitteen", name: "2015" },
    { id: "LP_twentysixteen", name: "2016" },
    { id: "LP_twentyseventeen", name: "2017" },
    { id: "LP_twentyeighteen", name: "2018" },
    { id: "LP_twentynineteen", name: "2019" },
    { id: "LP_twentytwenty", name: "2020" },
    { id: "LP_twentytwentytwo", name: "2022" },
    { id: "LP_twentytwentythree", name: "2023" },
    { id: "LP_twentytwentyfour", name: "2024" },
    { id: "LP_Marchtwentytwentyfive", name: "March 2025" },
    { id: "April2025pointdataset", name: "April 2025" }
];

// Get DOM elements
const sliderContainer = document.getElementById("slider-container");
const projectionSlider = document.getElementById("projection-slider");
const projectionSliderLabel = document.getElementById("projection-slider-label");
const currentPointsSlider = document.getElementById("current-points-slider");
const currentPointsSliderLabel = document.getElementById("current-points-slider-label");
const historicalPointsSlider = document.getElementById("historical-points-slider");
const historicalPointsSliderLabel = document.getElementById("historical-points-slider-label");

const toggleProjectionsBtn = document.getElementById("toggle-projections");
const toggleCurrentPointsBtn = document.getElementById("toggle-current-points");
const toggleHistoricalPointsBtn = document.getElementById("toggle-historical-points");

const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");

const projectionSliderGroup = document.getElementById("projection-slider-group");
const currentPointsSliderGroup = document.getElementById("current-points-slider-group");
const historicalPointsSliderGroup = document.getElementById("historical-points-slider-group");

let animationInterval = null;
let isAnimating = false;

// Wait for map to load
function addSliderLayers() {
    // Projection layers
    projectionLayers.forEach(layer => {
        if (!map1.getSource(layer.id)) {
            map1.addSource(layer.id, {
                type: 'raster',
                tiles: [
                    `http://172.18.1.47:8080/geoserver/landslise_projections/wms?` +
                    `service=WMS&version=1.1.0&request=GetMap&layers=landslise_projections:${layer.id}` +
                    `&bbox={bbox-epsg-3857}&width=768&height=558&srs=EPSG:3857&format=image/png&transparent=true`
                ],
                tileSize: 256
            });

            map1.addLayer({
                id: layer.id,
                type: 'raster',
                source: layer.id,
                paint: { 'raster-opacity': 0.6

                 },
                layout: { visibility: layerStates.projectionLayers ? 'visible' : 'none' }
            });
        }
    });

    // Current Point Layers
    pointsLayers.forEach(layer => {
        if (!map1.getSource(layer.id)) {
            map1.addSource(layer.id, {
                type: 'raster',
                tiles: [
                    `http://172.18.1.47:8080/geoserver/landslise_projections/wms?` +
                    `service=WMS&version=1.1.0&request=GetMap&layers=landslise_projections:${layer.id}` +
                    `&bbox={bbox-epsg-3857}&width=768&height=558&srs=EPSG:3857&format=image/png&transparent=true`
                ],
                tileSize: 256
            });

            map1.addLayer({
                id: layer.id,
                type: 'raster',
                source: layer.id,
                paint: { 'raster-opacity': 1 },
                layout: { visibility: layerStates.currentPoints ? 'visible' : 'none' }
            });
        }
    });

    // Historical Point Layers
    pointsLayers2.forEach(layer => {
        if (!map1.getSource(layer.id)) {
            map1.addSource(layer.id, {
                type: 'raster',
                tiles: [
                    `http://172.18.1.47:8080/geoserver/landslise_projections/wms?` +
                    `service=WMS&version=1.1.0&request=GetMap&layers=landslise_projections:${layer.id}` +
                    `&bbox={bbox-epsg-3857}&width=768&height=558&srs=EPSG:3857&format=image/png&transparent=true`
                ],
                tileSize: 256
            });

            map1.addLayer({
                id: layer.id,
                type: 'raster',
                source: layer.id,
                paint: { 'raster-opacity': 0.7 },
                layout: { visibility: layerStates.historicalPoints ? 'visible' : 'none' }
            });
        }
    });
}

// Set initial slider labels
projectionSliderLabel.textContent = projectionLayers[0].name;
currentPointsSliderLabel.textContent = pointsLayers[0].name;
historicalPointsSliderLabel.textContent = pointsLayers2[0].name;

// Show the first layer of each group by default if toggled on
if (toggleProjectionsBtn.checked) updateProjectionLayer(0);
if (toggleCurrentPointsBtn.checked) updateCurrentPointsLayer(0);
if (toggleHistoricalPointsBtn.checked) updateHistoricalPointsLayer(0);


// Update projection layer visibility
function updateProjectionLayer(idx) {
    // Hide all projection layers
    projectionLayers.forEach(layer => {
        if (map1.getLayer(layer.id)) {
            map1.setLayoutProperty(layer.id, "visibility", "none");
        }
    });

    // Show selected layer
    const selectedId = projectionLayers[idx].id;
    if (map1.getLayer(selectedId)) {
        map1.setLayoutProperty(selectedId, "visibility", "visible");
    }

    projectionSliderLabel.textContent = projectionLayers[idx].name;
}

// Update current points layer visibility
function updateCurrentPointsLayer(idx) {
    // Hide all current points layers
    pointsLayers.forEach(layer => {
        if (map1.getLayer(layer.id)) {
            map1.setLayoutProperty(layer.id, "visibility", "none");
        }
    });

    // Show selected layer
    const selectedId = pointsLayers[idx].id;
    if (map1.getLayer(selectedId)) {
        map1.setLayoutProperty(selectedId, "visibility", "visible");
    }

    currentPointsSliderLabel.textContent = pointsLayers[idx].name;
}

// Update historical points layer visibility
function updateHistoricalPointsLayer(idx) {
    // Hide all historical points layers
    pointsLayers2.forEach(layer => {
        if (map1.getLayer(layer.id)) {
            map1.setLayoutProperty(layer.id, "visibility", "none");
        }
    });

    // Show selected layer
    const selectedId = pointsLayers2[idx].id;
    if (map1.getLayer(selectedId)) {
        map1.setLayoutProperty(selectedId, "visibility", "visible");
    }

    historicalPointsSliderLabel.textContent = pointsLayers2[idx].name;
}

// Slider event listeners
projectionSlider.addEventListener("input", function () {
    updateProjectionLayer(Number(projectionSlider.value));
});

currentPointsSlider.addEventListener("input", function () {
    updateCurrentPointsLayer(Number(currentPointsSlider.value));
});

historicalPointsSlider.addEventListener("input", function () {
    updateHistoricalPointsLayer(Number(historicalPointsSlider.value));
});

// Toggle button event listeners
toggleProjectionsBtn.addEventListener("change", function () {
    if (toggleProjectionsBtn.checked) {
        projectionSliderGroup.style.display = 'block';
        updateProjectionLayer(Number(projectionSlider.value));
    } else {
        projectionSliderGroup.style.display = 'none';
        // Hide all projection layers
        projectionLayers.forEach(layer => {
            if (map1.getLayer(layer.id)) {
                map1.setLayoutProperty(layer.id, "visibility", "none");
            }
        });
    }
    sliderContainer.style.display = 'block';
});

toggleCurrentPointsBtn.addEventListener("change", function () {
    if (toggleCurrentPointsBtn.checked) {
        currentPointsSliderGroup.style.display = 'block';
        updateCurrentPointsLayer(Number(currentPointsSlider.value));
    } else {
        currentPointsSliderGroup.style.display = 'none';
        // Hide all current points layers
        pointsLayers.forEach(layer => {
            if (map1.getLayer(layer.id)) {
                map1.setLayoutProperty(layer.id, "visibility", "none");
            }
        });
    }
    sliderContainer.style.display = 'block';
});

toggleHistoricalPointsBtn.addEventListener("change", function () {
    if (toggleHistoricalPointsBtn.checked) {
        historicalPointsSliderGroup.style.display = 'block';
        updateHistoricalPointsLayer(Number(historicalPointsSlider.value));
    } else {
        historicalPointsSliderGroup.style.display = 'none';
        // Hide all historical points layers
        pointsLayers2.forEach(layer => {
            if (map1.getLayer(layer.id)) {
                map1.setLayoutProperty(layer.id, "visibility", "none");
            }
        });
    }
    sliderContainer.style.display = 'block';
});

// Play button event
playBtn.addEventListener("click", startAnimation);

// Pause button event
pauseBtn.addEventListener("click", stopAnimation);

// Start animation function
function startAnimation() {
    if (isAnimating) return;

    isAnimating = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;

    projectionSlider.setAttribute("disabled", "disabled");
    currentPointsSlider.setAttribute("disabled", "disabled");
    historicalPointsSlider.setAttribute("disabled", "disabled");

    let projIdx = Number(projectionSlider.value);
    let currentIdx = Number(currentPointsSlider.value);
    let historicalIdx = Number(historicalPointsSlider.value);

    animationInterval = setInterval(() => {
        // Update projection slider if enabled
        if (toggleProjectionsBtn.checked) {
            projIdx = (projIdx + 1) % projectionLayers.length;
            projectionSlider.value = projIdx;
            updateProjectionLayer(projIdx);
        }

        // Update current points slider if enabled
        if (toggleCurrentPointsBtn.checked) {
            currentIdx = (currentIdx + 1) % pointsLayers.length;
            currentPointsSlider.value = currentIdx;
            updateCurrentPointsLayer(currentIdx);
        }

        // Update historical points slider if enabled
        if (toggleHistoricalPointsBtn.checked) {
            historicalIdx = (historicalIdx + 1) % pointsLayers2.length;
            historicalPointsSlider.value = historicalIdx;
            updateHistoricalPointsLayer(historicalIdx);
        }
    }, 1500);
}

// Stop animation function
function stopAnimation() {
    if (!isAnimating) return;

    clearInterval(animationInterval);
    animationInterval = null;
    isAnimating = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;

    projectionSlider.removeAttribute("disabled");
    currentPointsSlider.removeAttribute("disabled");
    historicalPointsSlider.removeAttribute("disabled");
}

// Define zonation layers
const zonationLayers = {
    'risk': 'landslise_projections:Hazard_Ranking_Shapefile',
    'preci': 'landslide_areej:LS_AHP_KP',
    'BALO': 'landslide_areej:LS_AHP_Balu_rec',
    'GB': 'landslide_areej:GB_LS_Zonation',
    'AJK': 'landslide_areej:AJK_LS_zonation',
    'glofass50mm': 'glofas:EGE_probRgt50',
    'veryhigh_kkh': 'landslide_areej:VERY_HIGH',
    'HIGH': 'landslide_areej:HIGH',
    'low': 'landslide_areej:VERY_LOW',
    'verylow': 'landslide_areej:LOW',
    'jaglot': 'landslide_areej:Jaglot-skardu',
    'jsr-rds-layer': 'osama_khan:JSR_RDS',
    'rds-layer': 'osama:RDs'
};

function addAugustLandslides(map) {
    // Check if August data is loaded
    if (!aug25) {
        console.error('August landslide data not loaded yet');
        return;
    }

    // Add source for August landslides
    if (!map.getSource('AUG25')) {
        map.addSource('AUG25', {
            type: 'geojson',
            data: aug25
        });
    }

    // Load landslide icon or fallback
    map.loadImage('https://i.ibb.co/v66Vj0Nb/target.png', (error, image) => {
        if (error) {
            console.error('Error loading landslide icon:', error);
            const fallbackData = new Uint8Array(64 * 64 * 4).map((_, i) =>
                i % 4 === 3 ? 0 : (i % 4 === 0 ? 255 : 82)
            );
            map.addImage('landslide-icon', { width: 64, height: 64, data: fallbackData });
        } else {
            if (!map.hasImage('landslide-icon')) {
                map.addImage('landslide-icon', image);
            }
        }

        // Add circle layer for August landslides
        if (!map.getLayer('AUG25_points')) {
            map.addLayer({
                id: 'AUG25_points',
                type: 'circle',
                source: 'AUG25',
                paint: {
                    'circle-radius': 8,
                    'circle-stroke-width': 3,
                    'circle-stroke-color': '#000000',
                    'circle-color': [
                        'match',
                        ['get', 'Date'],
                        '2025-08-04', '#FF5733',
                        '2025-08-06', '#33FF57',
                        '2025-08-10', '#3357FF',
                        '2025-08-14', '#FF33A8',
                        '2025-08-15', '#FFD133',
                        '2025-08-16', '#FFD133',
                        '2025-08-18', '#FF5733',
                        '#888888' // Default color
                    ]
                },
                layout: {
                    visibility: layerStates.augustLandslides ? 'visible' : 'none' // Controlled by layer state
                }
            });
        }

        // Add label layer for August landslides
        if (!map.getLayer('AUG25_labels')) {
            map.addLayer({
                id: 'AUG25_labels',
                type: 'symbol',
                source: 'AUG25',
                layout: {
                    'text-field': ['coalesce', ['get', 'Name'], 'Landslide'],
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
                    'text-size': 22,
                    'text-anchor': 'top',
                    'text-offset': [0, 2],
                    visibility: layerStates.augustLandslides ? 'visible' : 'none' // Controlled by layer state
                },
                paint: {
                    'text-color': 'BLACK',
                    'text-halo-width': 1,
                    'text-halo-color': 'WHITE'
                }
            });
        }

        // Click event for popup
        map.on('click', 'AUG25_points', (e) => {
            const feature = e.features[0];
            let coords = feature.geometry.coordinates.slice();

            // Convert UTM to WGS84 if needed
            if (coords[0] > 180 || coords[1] > 90) {
                console.warn('UTM coordinates detected, conversion to WGS84 needed');
                coords = [coords[0] / 100000, coords[1] / 100000];
            }

            const {
                Name = 'Landslide Zone',
                Category: Severity = 'Unknown',
                Date = 'Unknown',
                Image = 'DATA/astak.jpeg',
                Area,
                Casualties
            } = feature.properties;

            const infoItems = `
                <div class="info-item"><span class="info-label">DATE</span><span class="info-value">${Date}</span></div>
                ${Area ? `<div class="info-item"><span class="info-label">AREA</span><span class="info-value">${Area}</span></div>` : ''}
                ${Casualties ? `<div class="info-item warning"><span class="info-label">CASUALTIES</span><span class="info-value">${Casualties}</span></div>` : ''}
            `;

            const popupHTML = `
                <div class="futuristic-popup">
                    <div class="popup-header">
                        <div class="pulse-dot"></div>
                        <h3>${Name}</h3>
                        <div class="badge">SEVERITY: ${Severity}</div>
                    </div>
                    <div class="popup-image">
                        <img src="${Image}" alt="${Name}" onerror="this.src='DATA/astak.jpeg'">
                        <div class="overlay-text">LANDSLIDE</div>
                        <div class="image-grid-overlay"></div>
                    </div>
                    <div class="popup-info">${infoItems}</div>
                    <div class="scanline"></div>
                    <div class="corner corner-tl"></div>
                    <div class="corner corner-tr"></div>
                    <div class="corner corner-bl"></div>
                    <div class="corner corner-br"></div>
                </div>
                <style>
                    /* Popup styles (same as provided) */
                </style>
            `;

            new mapboxgl.Popup()
                .setLngLat(coords)
                .setHTML(popupHTML)
                .addTo(map);
        });

        // Hover effects
        map.on('mouseenter', 'AUG25_points', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'AUG25_points', () => {
            map.getCanvas().style.cursor = '';
        });
    });

    // Toggle visibility for August landslides
    const toggleAug = document.getElementById('toggle-aug');
    if (toggleAug) {
        toggleAug.addEventListener('change', (e) => {
            layerStates.augustLandslides = e.target.checked;
            const visibility = e.target.checked ? 'visible' : 'none';
            if (map.getLayer('AUG25_points')) {
                map.setLayoutProperty('AUG25_points', 'visibility', visibility);
            }
            if (map.getLayer('AUG25_labels')) {
                map.setLayoutProperty('AUG25_labels', 'visibility', visibility);
            }
        });
    } else {
        console.error("Toggle element 'toggle-aug' not found in the DOM.");
    }
}


function addTourismPoints(map) {
    // Check if tourism data is loaded
    if (!tourism) {
        console.error('Tourism data not loaded yet');
        return;
    }

    // Add source
    if (!map.getSource('tourism_points')) {
        map.addSource('tourism_points', {
            type: 'geojson',
            data: tourism
        });
    }

    // Add circle layer
    if (!map.getLayer('tourism_points')) {
        map.addLayer({
            id: 'tourism_points',
            type: 'circle',
            source: 'tourism_points',
            layout: {
                visibility: 'none'
            },
            paint: {
                'circle-radius': 8,
                'circle-color': '#FFD700',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#333'
            }
        });
    }

    // Add label layer
    if (!map.getLayer('tourism_points_label')) {
        map.addLayer({
            id: 'tourism_points_label',
            type: 'symbol',
            source: 'tourism_points',
            layout: {
                'text-field': ['get', 'Name'], // Make sure 'Name' matches your GeoJSON property
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 13,
                'text-offset': [0, 1.2],
                'text-anchor': 'top',
                visibility: 'none'
            },
            paint: {
                'text-color': '#FFD700',
                'text-halo-color': '#222',
                'text-halo-width': 1
            }
        });
    }
}


// Define layer groups 
const layerGroups = {
    group1: ['preci', 'BALO', 'GB', 'AJK'],
    group2: ['veryhigh_kkh', 'HIGH', 'low', 'verylow', 'jaglot']
};

// Function to add zonation layers with error handling
function addZonationLayers() {
    Object.entries(zonationLayers).forEach(([id, layerName]) => {
        if (!map1.getSource(id)) {
            const workspace = layerName.split(":")[0];
            const tileSize = (id === 'jsr-rds-layer' || id === 'rds-layer' || id === 'glofass50mm') ? 512 : 256;

            // Assign different GeoServer base URLs depending on workspace or id
            let baseUrl = 'http://172.18.1.47:8080/geoserver';
            if (id === 'jsr-rds-layer' || id === 'rds-layer') {
                baseUrl = 'http://172.18.1.135:8080/geoserver';
            }
            if (id === 'glofass50mm') {
                baseUrl = 'http://172.18.7.21:8080/geoserver';
            }

            // Try different tile URL format with explicit parameters
            map1.addSource(id, {
                type: 'raster',
                tiles: [
                    `${baseUrl}/${workspace}/wms?` +
                    `service=WMS&` +
                    `version=1.1.0&` +
                    `request=GetMap&` +
                    `layers=${layerName}&` +
                    `bbox={bbox-epsg-3857}&` +
                    `width=256&` +  // Use consistent tile size
                    `height=256&` + // Use consistent tile size
                    `srs=EPSG:3857&` +
                    `format=image/png&` +  // Ensure PNG format
                    `transparent=true&` +
                    `exceptions=application/vnd.ogc.se_blank`  // Return blank on error
                ],
                tileSize: 256,  // Use consistent 256 tile size
                scheme: 'xyz'
            });

            map1.on('source.error', (e) => {
                if (e.sourceId === id) {
                    console.error(`Error loading source ${id}:`, e.error);
                }
            });
        }

        if (!map1.getLayer(id)) {
            // Determine visibility based on layer group or individual state
            let visibility = 'none';
            if (id === 'risk' && layerStates.risk) {
                visibility = 'visible';
            } else if (layerGroups.group1.includes(id) && layerStates.zonationGroup1) {
                visibility = 'visible';
            } else if (layerGroups.group2.includes(id) && layerStates.zonationGroup2) {
                visibility = 'visible';
            } else if (id === 'glofass50mm' && layerStates.glofass50mm) {
                visibility = 'visible';
            } else if (id === 'jsr-rds-layer' && layerStates.jsrRds) {
                visibility = 'visible';
            } else if (id === 'rds-layer' && layerStates.rds) {
                visibility = 'visible';
            }

            map1.addLayer({
                id: id,
                type: 'raster',
                source: id,
                paint: { 'raster-opacity': 0.8 },  // Slightly reduce opacity
                layout: { visibility: visibility }
            });
        }
    });
}

// Add error handling for tile loading
map1.on('error', (e) => {
    if (e.error && e.error.message && e.error.message.includes('could not be decoded')) {
        console.warn('Tile loading error for source:', e.sourceId);
    }
});

function addCustomLayers() {

    if (inventory) {
        addLandslidePoints(map1);
    }
    addTourismPoints(map1);
    addSliderLayers();
    addAugustLandslides(map1);
    // Add zonation layers
    addZonationLayers();


    // 10. Add landslide hotspot layer
    map1.addSource('landslide_hotspot', {
        type: 'geojson',
        data: layerpmpm
    });

    // Add fill layer (transparent polygon with red outline)
    map1.addLayer({
        id: 'hotspot_polygons',
        type: 'fill',
        source: 'landslide_hotspot',
        layout: {
            visibility: layerStates.landslideHotspot ? 'visible' : 'none'
        },
        paint: {
            'fill-color': 'transparent',
            'fill-opacity': 1,
            'fill-outline-color': '#8B0000'
        }
    });

    // Add line layer for blinking borders
    map1.addLayer({
        id: 'hotspot_borders',
        type: 'line',
        source: 'landslide_hotspot',
        layout: {
            visibility: layerStates.landslideHotspot ? 'visible' : 'none'
        },
        paint: {
            'line-color': '#8B0000',
            'line-width': 3
        }
    });




    // Major roads layer
    if (!map1.getSource('major-roads-layer')) {
        map1.addSource('major-roads-layer', {
            'type': 'geojson',
            data: 'http://172.18.1.135:8080/geoserver/osama/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=osama%3Amajor_roads&outputFormat=application%2Fjson',
            generateId: true
        });
    }

    if (!map1.getLayer('major-roads-layer')) {
        map1.addLayer({
            id: 'major-roads-layer',
            type: 'line',
            source: 'major-roads-layer',
            layout: { visibility: layerStates.major ? "visible" : "none" },
            paint: { 'line-color': 'blue', 'line-width': 2 }
        });
    }

    // Highways layer
    if (!map1.getSource('highways-layer')) {
        map1.addSource('highways-layer', {
            type: 'geojson',
            data: 'http://172.18.1.135:8080/geoserver/osama/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=osama%3Ahighways&maxFeatures=50&outputFormat=application%2Fjson',
            generateId: true
        });
    }

    if (!map1.getLayer('highways-layer')) {
        map1.addLayer({
            id: 'highways-layer',
            type: 'line',
            source: 'highways-layer',
            layout: { visibility: layerStates.highways ? "visible" : "none" },
            paint: { 'line-color': '#FF4162', 'line-width': 2 }
        });
    }

    // National Boundary
    if (!map1.getSource("nat-boundary")) {
        map1.addSource("nat-boundary", {
            type: "geojson",
            data: "http://172.18.1.4:8080/geoserver/abdul_sattar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=abdul_sattar%3ANational_Boundary&outputFormat=application%2Fjson",
            generateId: true,
        });
    }

    if (!map1.getLayer("nat-boundary-layer")) {
        map1.addLayer({
            id: "nat-boundary-layer",
            type: "line",
            source: "nat-boundary",
            layout: { visibility: layerStates.national ? "visible" : "none" },
            paint: { "line-color": "green", "line-width": 3 },
        });
    }

    if (!map1.getLayer("nat-boundary-label")) {
        map1.addLayer({
            id: "nat-boundary-label",
            type: "symbol",
            source: "nat-boundary",
            layout: {
                visibility: layerStates.national ? "visible" : "none",
                "text-field": ["get", "NAME"],
                "text-size": 12,
                "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                "symbol-placement": "line",
                "text-offset": [0, 0.6],
                "text-anchor": "top",
            },
            paint: {
                "text-color": "#00ff00",
                "text-halo-color": "#000000",
                "text-halo-width": 1,
            },
        });
    }

    // District Boundary
    if (!map1.getSource("district-boundary")) {
        map1.addSource("district-boundary", {
            type: "geojson",
            data: "http://172.18.1.4:8080/geoserver/abdul_sattar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=abdul_sattar:District_Boundary&outputFormat=application/json",
            generateId: true,
        });
    }

    if (!map1.getLayer("district-boundary-layer")) {
        map1.addLayer({
            id: "district-boundary-layer",
            type: "line",
            source: "district-boundary",
            layout: { visibility: layerStates.district ? "visible" : "none" },
            paint: {
                "line-color": "purple",
                "line-width": 2
            }
        });
    }

    if (!map1.getLayer("district-boundary-label")) {
        map1.addLayer({
            id: "district-boundary-label",
            type: "symbol",
            source: "district-boundary",
            minzoom: 6,
            layout: {
                visibility: layerStates.district ? "visible" : "none",
                "text-field": ["get", "DISTRICT"],
                "text-letter-spacing": 0.1,
                "text-size": 13,
                "text-offset": [0, 0],
                "text-anchor": "center",
            },
            paint: {
                "text-color": "black",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1.2,
            },
        });
    }

    // Province Boundary
    if (!map1.getSource("province-boundary")) {
        map1.addSource("province-boundary", {
            type: "geojson",
            data: "http://172.18.1.135:8080/geoserver/zeeshan/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=zeeshan:Provincial_Boundary&outputFormat=application/json",
            generateId: true,
        });
    }

    if (!map1.getLayer("province-boundary-layer")) {
        map1.addLayer({
            id: "province-boundary-layer",
            type: "line",
            source: "province-boundary",
            layout: { visibility: layerStates.province ? "visible" : "none" },
            paint: { "line-color": "orange", "line-width": 3 },
        });
    }

    if (!map1.getLayer("province-boundary-label")) {
        map1.addLayer({
            id: "province-boundary-label",
            type: "symbol",
            source: "province-boundary",
            layout: {
                visibility: layerStates.province ? "visible" : "none",
                "text-field": ["get", "PROVINCE"],
                "text-size": 12,
                "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                "symbol-placement": "line",
                "text-offset": [0, 0.6],
                "text-anchor": "top",
            },
            paint: {
                "text-color": "#ffa500",
                "text-halo-color": "#000000",
                "text-halo-width": 1,
            },
        });
    }
    // Add Tehsil boundary vector source and layers
    if (!map1.getSource("tehsilBoundary")) {
        map1.addSource("tehsilBoundary", {
            type: "vector",
            scheme: "tms",
            tiles: [
                "http://172.18.1.187:8080/geoserver/gwc/service/tms/1.0.0/abdul_sattar:Tehsil_Boundary@EPSG:900913@pbf/{z}/{x}/{y}.pbf",
            ],
        });
    }

    if (!map1.getLayer("TehsilBoundary")) {
        map1.addLayer({
            id: "TehsilBoundary",
            type: "fill",
            source: "tehsilBoundary",
            "source-layer": "Tehsil_Boundary",
            layout: {
                visibility: "none",
            },
            paint: {
                "fill-opacity": 0.2,
                "fill-color": "transparent",
            },
        });
    }

    if (!map1.getLayer("TehsilBoundaryLine")) {
        map1.addLayer({
            id: "TehsilBoundaryLine",
            type: "line",
            source: "tehsilBoundary",
            "source-layer": "Tehsil_Boundary",
            layout: {
                visibility: "none",
            },
            paint: {
                "line-opacity": 0.8,
                "line-color": "black",
                "line-width": 1,
            },
        });
    }

    if (!map1.getLayer("tehsilBoundary_label")) {
        map1.addLayer({
            id: "tehsilBoundary_label",
            type: "symbol",
            source: "tehsilBoundary",
            "source-layer": "Tehsil_Boundary",
            minzoom: 6,
            layout: {
                visibility: "none",
                'text-field': ['get', 'TEHSIL'],
                'text-letter-spacing': 0.1,
                'text-size': 13,
                'text-offset': [0, 0],
                'text-anchor': 'center',
            },
            paint: {
                'text-color': 'black',
            },
        });
    }
}

// Function to change basemap
function changeBasemap(styleId) {
    const style = basemapStyles[styleId];
    if (!style) return;

    // Store current camera position
    const currentCenter = map1.getCenter();
    const currentZoom = map1.getZoom();
    const currentPitch = map1.getPitch();
    const currentBearing = map1.getBearing();

    // Change the style
    map1.setStyle(style);

    // Wait for the new style to load completely
    map1.once('style.load', () => {
        // Restore camera position
        map1.setCenter(currentCenter);
        map1.setZoom(currentZoom);
        map1.setPitch(currentPitch);
        map1.setBearing(currentBearing);

        // Re-add terrain
        addTerrain();

        // Re-add all custom layers with their current visibility states
        addCustomLayers();
    });
}

// Add basemap control to the map
const basemapControl = document.createElement('div');
basemapControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
basemapControl.style.backgroundColor = 'white';
basemapControl.style.padding = '10px';
const select = document.createElement('select');
select.style.padding = '5px';
select.style.borderRadius = '3px';

Object.keys(basemapStyles).forEach(styleId => {
    const option = document.createElement('option');
    option.value = styleId;
    option.text = styleId.charAt(0).toUpperCase() + styleId.slice(1).replace(/-/g, ' ');
    select.appendChild(option);
});

select.addEventListener('change', (e) => {
    changeBasemap(e.target.value);
});

basemapControl.appendChild(select);

// Add the custom control to the map
map1.addControl({
    onAdd: function () {
        return basemapControl;
    },
    onRemove: function () {
        basemapControl.parentNode.removeChild(basemapControl);
    }
}, 'top-right');


// Blinking effect for borders
let blink = true;
setInterval(() => {
    const isVisible = map1.getLayoutProperty('hotspot_borders', 'visibility') === 'visible';
    if (isVisible) {
        map1.setPaintProperty(
            'hotspot_borders',
            'line-color',
            blink ? '#8B0000' : 'transparent'
        );
    }
    blink = !blink;
}, 500);


// Initial map load
map1.on("load", () => {
    // Add terrain on initial load
    addTerrain();

    // Add all custom layers
    addCustomLayers();

    // Set up checkbox event listeners
    document.getElementById("toggle-highways").addEventListener("change", function (e) {
        layerStates.highways = e.target.checked;
        const visibility = e.target.checked ? "visible" : "none";
        if (map1.getLayer("highways-layer")) {
            map1.setLayoutProperty("highways-layer", "visibility", visibility);
        }
    });

    document.getElementById("toggle-major-roads").addEventListener("change", function (e) {
        layerStates.major = e.target.checked;
        const visibility = e.target.checked ? "visible" : "none";
        if (map1.getLayer("major-roads-layer")) {
            map1.setLayoutProperty("major-roads-layer", "visibility", visibility);
        }
    });

    document.getElementById("toggle-national").addEventListener("change", function (e) {
        layerStates.national = e.target.checked;
        const visibility = e.target.checked ? "visible" : "none";
        if (map1.getLayer("nat-boundary-layer")) {
            map1.setLayoutProperty("nat-boundary-layer", "visibility", visibility);
        }
        if (map1.getLayer("nat-boundary-label")) {
            map1.setLayoutProperty("nat-boundary-label", "visibility", visibility);
        }
    });

    document.getElementById("toggle-province").addEventListener("change", function (e) {
        layerStates.province = e.target.checked;
        const visibility = e.target.checked ? "visible" : "none";
        if (map1.getLayer("province-boundary-layer")) {
            map1.setLayoutProperty("province-boundary-layer", "visibility", visibility);
        }
        if (map1.getLayer("province-boundary-label")) {
            map1.setLayoutProperty("province-boundary-label", "visibility", visibility);
        }
    });

    document.getElementById("toggle-district").addEventListener("change", function (e) {
        layerStates.district = e.target.checked;
        const visibility = e.target.checked ? "visible" : "none";
        if (map1.getLayer("district-boundary-layer")) {
            map1.setLayoutProperty("district-boundary-layer", "visibility", visibility);
        }
        if (map1.getLayer("district-boundary-label")) {
            map1.setLayoutProperty("district-boundary-label", "visibility", visibility);
        }
    });
    const toggleTehsil = document.getElementById('toggle-Tehsil');
    if (toggleTehsil) {
        toggleTehsil.addEventListener('change', function (e) {
            const visibility = e.target.checked ? 'visible' : 'none';
            map1.setLayoutProperty('TehsilBoundary', 'visibility', visibility);
            map1.setLayoutProperty('TehsilBoundaryLine', 'visibility', visibility);
            map1.setLayoutProperty('tehsilBoundary_label', 'visibility', visibility);
        });
    }
    // Risk Assessment toggle (separate from zonation group)
    const toggleRisk = document.getElementById("toggle-Risk");
    console.log("Risk toggle element:", toggleRisk); // Debug line
    if (toggleRisk) {
        toggleRisk.addEventListener("change", function (e) {
            console.log("Risk toggle changed:", e.target.checked); // Debug line
            layerStates.risk = e.target.checked;
            const visibility = e.target.checked ? "visible" : "none";
            if (map1.getLayer("risk")) {
                map1.setLayoutProperty("risk", "visibility", visibility);
            } else {
                console.log("Risk layer not found"); // Debug line
            }
        });
    } else {
        console.error("Risk toggle element not found"); // Debug line
    }

    // Zonation Group 1 toggle (preci, BALO, GB, AJK - without risk)
    const toggleZonationGroup1 = document.getElementById("toggle-Zonation");
    if (toggleZonationGroup1) {
        toggleZonationGroup1.addEventListener("change", function (e) {
            layerStates.zonationGroup1 = e.target.checked;
            const visibility = e.target.checked ? "visible" : "none";

            layerGroups.group1.forEach(layerId => {
                if (map1.getLayer(layerId)) {
                    map1.setLayoutProperty(layerId, "visibility", visibility);
                }
            });
        });
    }

    // Group 2 toggle (veryhigh_kkh, HIGH, low, verylow, jaglot)
    const toggleZonationGroup2 = document.getElementById("toggle-jaglot");
    if (toggleZonationGroup2) {
        toggleZonationGroup2.addEventListener("change", function (e) {
            layerStates.zonationGroup2 = e.target.checked;
            const visibility = e.target.checked ? "visible" : "none";

            layerGroups.group2.forEach(layerId => {
                if (map1.getLayer(layerId)) {
                    map1.setLayoutProperty(layerId, "visibility", visibility);
                }
            });
        });
    }

    // Individual toggles for remaining layers
    const toggleGlofass = document.getElementById("toggle-glofass");
    if (toggleGlofass) {
        toggleGlofass.addEventListener("change", function (e) {
            layerStates.glofass50mm = e.target.checked;
            const visibility = e.target.checked ? "visible" : "none";
            if (map1.getLayer("glofass50mm")) {
                map1.setLayoutProperty("glofass50mm", "visibility", visibility);
            }
        });
    }

    const toggleJsrRds = document.getElementById("toggle-jsr-rds");
    if (toggleJsrRds) {
        toggleJsrRds.addEventListener("change", function (e) {
            layerStates.jsrRds = e.target.checked;
            const visibility = e.target.checked ? "visible" : "none";
            if (map1.getLayer("jsr-rds-layer")) {
                map1.setLayoutProperty("jsr-rds-layer", "visibility", visibility);
            }
        });
    }

    const toggleRds = document.getElementById("toggle-rds");
    if (toggleRds) {
        toggleRds.addEventListener("change", function (e) {
            layerStates.rds = e.target.checked;
            const visibility = e.target.checked ? "visible" : "none";
            if (map1.getLayer("rds-layer")) {
                map1.setLayoutProperty("rds-layer", "visibility", visibility);
            }
        });
    }

    const toggleinventory = document.getElementById("toggle-inventory");
    if (toggleinventory) {
        toggleinventory.addEventListener("change", function (e) {
            layerStates.inventory = e.target.checked;
            const visibility = e.target.checked ? "visible" : "none";
            if (map1.getLayer("landslide_points")) {
                map1.setLayoutProperty("landslide_points", "visibility", visibility);
            }
        });
    }
    const toggleTourism = document.getElementById("toggle-tourism");
    if (toggleTourism) {
        toggleTourism.addEventListener("change", function (e) {
            layerStates.tourism = e.target.checked;
            const visibility = e.target.checked ? "visible" : "none";
            if (map1.getLayer("tourism_points")) {
                map1.setLayoutProperty("tourism_points", "visibility", visibility);
            }
            if (map1.getLayer("tourism_points_label")) {
                map1.setLayoutProperty("tourism_points_label", "visibility", visibility);
            }
        });
    }





    const toggleHotspot = document.getElementById("toggle-senario3");
    if (toggleHotspot) {
        toggleHotspot.addEventListener("change", function (e) {
            layerStates.landslideHotspot = e.target.checked;
            const visibility = e.target.checked ? "visible" : "none";
            if (map1.getLayer("hotspot_polygons")) {
                map1.setLayoutProperty("hotspot_polygons", "visibility", visibility);
            }
            if (map1.getLayer("hotspot_borders")) {
                map1.setLayoutProperty("hotspot_borders", "visibility", visibility);
            }
        });
    }


});

// Set default basemap in the dropdown
select.value = 'satellite';

