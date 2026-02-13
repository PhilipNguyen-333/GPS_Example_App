// ---------------------------------------------
// GLOBAL VARIABLES
// ---------------------------------------------

// This will store the ID returned by watchPosition()
// so we can stop the GPS watcher later.
let watchId = null;

// This will store the ID returned by setInterval()
// so we can stop the 3-second timer later.
let intervalId = null;

// This will always hold the *most recent* GPS reading.
// The interval timer will log this every 3 seconds.
let latestPosition = null;

// This stores the previous logged position so we can compute distance.
let lastLoggedPosition = null;

// Boolean flag to prevent starting tracking twice.
let tracking = false;


// ---------------------------------------------
// BUTTON EVENT HANDLERS
// ---------------------------------------------

document.getElementById("startBtn").onclick = () => startTracking();
document.getElementById("stopBtn").onclick = () => stopTracking();


// ---------------------------------------------
// START TRACKING
// ---------------------------------------------
function startTracking() {

  // If tracking is already running, do nothing.
  if (tracking) return;

  // Mark that tracking has begun.
  tracking = true;

  // Start watching the GPS. This does NOT log every 3 seconds.
  // It simply updates "latestPosition" whenever the GPS gives new data.
  watchId = navigator.geolocation.watchPosition(
    pos => {
      // Always store the newest GPS reading.
      latestPosition = pos;
    },
    err => console.error(err),
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );

  // Start a strict 3-second timer.
  // Every 3000 ms, we log whatever the latest GPS reading is.
  intervalId = setInterval(() => {
    if (latestPosition) {
      logPosition(latestPosition);
    }
  }, 3000);
}


// ---------------------------------------------
// STOP TRACKING
// ---------------------------------------------
function stopTracking() {

  // Mark that tracking has stopped.
  tracking = false;

  // Stop the GPS watcher.
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  // Stop the 3-second logging timer.
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
}


// ---------------------------------------------
// LOG POSITION (runs every 3 seconds)
// ---------------------------------------------
function logPosition(pos) {

  // Extract latitude and longitude.
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  // Default distance is 0 for the first logged point.
  let distance = 0;

  // If we have a previous logged point, compute distance.
  if (lastLoggedPosition) {
    distance = haversine(
      lastLoggedPosition.lat, lastLoggedPosition.lon,
      lat, lon
    );
  }

  // Update last logged position.
  lastLoggedPosition = { lat, lon };

  // Build a new table row.
  const row = `
    <tr>
      <td>${new Date().toLocaleTimeString()}</td>
      <td>${lat.toFixed(6)}</td>
      <td>${lon.toFixed(6)}</td>
      <td>${distance.toFixed(2)}</td>
    </tr>
  `;

  // Append the row to the table.
  document.getElementById("logTable").innerHTML += row;
}


// ---------------------------------------------
// HAVERSINE DISTANCE FORMULA
// Computes distance between two GPS points in meters.
// ---------------------------------------------
function haversine(lat1, lon1, lat2, lon2) {

  // Radius of Earth in meters.
  const R = 6371000;

  // Convert degrees → radians.
  const toRad = x => x * Math.PI / 180;

  // Differences in latitude and longitude.
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  // Haversine formula.
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  // Final distance in meters.
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
