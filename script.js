// ---------------------------------------------
// GLOBAL VARIABLES
// ---------------------------------------------

// Stores the ID returned by watchPosition()
// so we can stop GPS tracking later.
let watchId = null;

// Stores the ID returned by setInterval()
// so we can stop the 3-second timer later.
let intervalId = null;

// Always holds the most recent GPS reading.
// The 3-second timer will log this value.
let latestPosition = null;

// Stores the last logged position so we can compute distance.
let lastLoggedPosition = null;

// Prevents starting tracking twice.
let tracking = false;


// ---------------------------------------------
// BUTTON EVENT HANDLERS
// ---------------------------------------------

document.getElementById("startBtn").onclick = function() {
  startTracking();
};

document.getElementById("stopBtn").onclick = function() {
  stopTracking();
};


// ---------------------------------------------
// START TRACKING
// ---------------------------------------------
function startTracking() {

  // If tracking is already running, do nothing.
  if (tracking) {
    return;
  }

  // Mark that tracking has begun.
  tracking = true;

  // Start watching the GPS. This does NOT log every 3 seconds.
  // It simply updates "latestPosition" whenever the GPS gives new data.
  watchId = navigator.geolocation.watchPosition(
    function(pos) {
      // Always store the newest GPS reading.
      latestPosition = pos;
    },
    function(err) {
      console.error(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );

  // Start a strict 3-second timer.
  // Every 3000 ms, we log whatever the latest GPS reading is.
  intervalId = setInterval(function() {
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

  let totaldist = 0;
// ---------------------------------------------
// LOG POSITION (runs every 3 seconds)
// ---------------------------------------------
function logPosition(pos) {

  // Extract latitude and longitude.
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  // Default distance is 0 for the first logged point.
  let distance = 0;
  let distance2 = 0;

  // If we have a previous logged point, compute distance.
  if (lastLoggedPosition) {
    distance = haversine(
      lastLoggedPosition.lat, lastLoggedPosition.lon,
      lat, lon
    );
  }
  //PHILIP: If we have a previous logged point, then compute distance using distance formula.
  if (lastLoggedPosition) {
    distance2 = distFormula(
      lastLoggedPosition.lat, lastLoggedPosition.lon, 
      lat, lon
    );
  }
  //PHILIP: If we have a previous logged point, then compute the total distance
  if (lastLoggedPosition) {
    totaldist = totaldist + distance2;
  }

  // Update last logged position.
  lastLoggedPosition = { lat: lat, lon: lon };

  // Build a new table row.
  const row = `
    <tr>
      <td>${new Date().toLocaleTimeString()}</td>
      <td>${lat.toFixed(6)}</td>
      <td>${lon.toFixed(6)}</td>
      <td>${distance.toFixed(2)}</td>
      <td>${distance2.toFixed(2)}</td>
      <td>${totaldist.toFixed(2)}</td>
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
  function toRad(x) {
    return x * Math.PI / 180;
  }

  // Differences in latitude and longitude.
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  // Haversine formula.
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // Final distance in meters.
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distFormula(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  // Convert degrees to radians
  function toRad(x) {
    return x * Math.PI / 180;
  }
  let dLat = lat2 - lat1;
  let dLon = lon2 - lon1;

  // Make sure the longitude difference accurately represents the difference in longitude 
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  // Take the average latitude to scale your x-value (since the difference in two longitudes vary in its "influence" on how far the person went depending on the latitude)
  const phi = toRad((lat1 + lat2) / 2)

  // Convert lat/lon differences into meters
  const x = toRad(dLon) * R * Math.cos(phi);
  const y = toRad(dLat) * R;
  // return the value from the distance formula
  return Math.sqrt(x*x + y*y);  
}