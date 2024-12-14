// Importing W3.js and GSAP
// OpenLayers map integration

const defaultDataset = document.getElementById('datasets').value;

// Initialize OpenLayers Map
function initMap() {
    const map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM(), // OpenStreetMap as the base layer
            }),
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([-94.5786, 39.0997]), // Centered on KS and MO
            zoom: 6,
        }),
    });

    return map;
}

// Load CSV data and plot on the map
async function plotDataOnMap(map, dataset) {
    const response = await fetch(dataset);
    const csvData = await response.text();
    const rows = csvData.split('\n').slice(1); // Skip header row

    const features = rows.map(row => {
        const [latitude, longitude, ...info] = row.split(','); // Adjust based on CSV columns
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
            // Create a feature for each data point
            return new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([lng, lat])),
                data: info.join(', '), // Include all other CSV data
            });
        }
    }).filter(feature => feature); // Remove undefined features

    // Create a vector layer to add points
    const vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features,
        }),
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({ color: 'red' }),
                stroke: new ol.style.Stroke({ color: 'black', width: 1 }),
            }),
        }),
    });

    map.addLayer(vectorLayer);

    // Add a click event to display popup info
    map.on('singleclick', function (event) {
        map.forEachFeatureAtPixel(event.pixel, function (feature) {
            const data = feature.get('data');
            alert(`Data: ${data}`);
        });
    });
}

// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    const map = initMap();
    plotDataOnMap(map, defaultDataset);

    // Dataset selector handler
    document.getElementById('datasets').addEventListener('change', (event) => {
        const selectedDataset = event.target.value;
        map.getLayers().getArray().forEach((layer, index) => {
            if (index > 0) map.removeLayer(layer); // Remove old data layers
        });
        plotDataOnMap(map, selectedDataset);
    });
});
