// Variable to store the ID returned by watchPosition()
// This lets us stop GPS tracking later.
let watchId = null;

// Stores the last known GPS position so we can compute distance
let lastPosition = null;

// Boolean flag so we don't start tracking twice
let tracking = false;

// Attach the startTracking function to the Start button
document.getElementById("startBtn").onclick = () => startTracking();

// Attach the stopTracking function to the Stop button
document.getElementById("stopBtn").onclick = () => stopTracking();


// -------------------------------
// START TRACKING FUNCTION
// -------------------------------
function startTracking() {

  /* If tracking is already running (aka if tracking = true), 
do nothing because we don't want tracking to happen twice. 
For instance, if user accidentally pressed on the "Start 
Tracking' button twice, then this prevents the tracking to be duplicated */
  if (tracking) return;

  // Mark that tracking has begun
  tracking = true;

  // Begin watching the user's GPS position
  // watchPosition continuously calls our callback whenever GPS updates
  watchId = navigator.geolocation.watchPosition(

    // SUCCESS CALLBACK: runs every time the GPS gives a new reading
    position => {
      logPosition(position);  // send the position to our logging function
    },

    // ERROR CALLBACK: runs if GPS fails or permission denied
    error => console.error(error),

    // OPTIONS OBJECT: tells GPS how accurate and fresh we want the data
    {
      enableHighAccuracy: true, // request best possible accuracy
      maximumAge: 0,            // do not use cached locations
      timeout: 5000             // give up if GPS takes longer than 5 seconds
    }
  );
}


// -------------------------------
// STOP TRACKING FUNCTION
// -------------------------------
function stopTracking() {

  // Mark that tracking has stopped
  tracking = false;

  // If watchPosition is active, stop it
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
}


// -------------------------------
// LOG POSITION FUNCTION
// Called every time GPS gives a new reading
// -------------------------------
function logPosition(pos) {

  // Extract latitude and longitude from the GPS reading
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  // Default distance is 0 (for the very first reading)
  let distance = 0;

  // If we have a previous position, compute distance from last point
  if (lastPosition) {
    distance = haversine(
      lastPosition.lat, lastPosition.lon,  // previous point
      lat, lon                             // current point
    );
  }

  // Update lastPosition so next reading can compare to this one
  lastPosition = { lat, lon };

  // Build a new table row with timestamp, lat, lon, and distance
  const row = `
    <tr>
      <td>${new Date().toLocaleTimeString()}</td>
      <td>${lat.toFixed(6)}</td>
      <td>${lon.toFixed(6)}</td>
      <td>${distance.toFixed(2)}</td>
    </tr>
  `;

  // Append the row to the table body
  document.getElementById("logTable").innerHTML += row;
}


// -------------------------------
// HAVERSINE DISTANCE FUNCTION
// Computes distance between two GPS points in meters
// -------------------------------
function haversine(lat1, lon1, lat2, lon2) {

  // Radius of Earth in meters
  const R = 6371000;

  // Helper function to convert degrees → radians
  const toRad = x => x * Math.PI / 180;

  // Differences in latitude and longitude (in radians)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  // Final distance in meters
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
