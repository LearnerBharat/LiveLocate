const socket = io();

if (navigator.geolocation) {
    let marker;
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            if (!marker) {
                marker = L.marker([latitude, longitude]).addTo(map);
            } else {
                marker.setLatLng([latitude, longitude]);
            }
            
            map.setView([latitude, longitude], 13);
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.error("Permission denied");
                    break;
                case error.POSITION_UNAVAILABLE:
                    console.error("Position unavailable");
                    break;
                case error.TIMEOUT:
                    console.error("Position acquisition timed out");
                    break;
                default:
                    console.error("An unknown error occurred");
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

const map = L.map("map", {
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0,
}).setView([0, 0], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "LiveLocate",
}).addTo(map);

window.addEventListener("resize", () => {
    map.invalidateSize();
});

const markers = {};

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    map.setView([latitude, longitude]);

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
