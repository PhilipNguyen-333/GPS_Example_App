// ---------------------------------------------
// GLOBAL VARIABLES
// ---------------------------------------------

let watchId = null;
let intervalId = null;
let latestPosition = null;
let lastLoggedPosition = null;
let tracking = false;
let firstLogTime = null;
let totaldist = 0;

// Arrays for graphing
let timeData = [];
let distanceData = [];

// Chart object
let totaldistanceChart = null;


// ---------------------------------------------
// CREATE THE CHART
// ---------------------------------------------
function createChart() {
  const ctx = document.getElementById("totaldistanceChart").getContext("2d");

  totaldistanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeData,
      datasets: [{
        label: 'Total Distance (m)',
        data: distanceData,
        borderColor: 'blue',
        borderWidth: 2,
        fill: false,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { text: 'Time (s)', display: true }
        },
        y: {
          title: { text: 'Total Distance (m)', display: true }
        }
      }
    }
  });
}

// Create the chart immediately
createChart();


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

  if (tracking) {
    return;
  }

  tracking = true;

  watchId = navigator.geolocation.watchPosition(
    function(pos) {
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

  tracking = false;

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  if (intervalId !== null) {
    clearInterval(intervalId);
  }

  // Reset for next run
  firstLogTime = null;
  lastLoggedPosition = null;
  totaldist = 0;
  timeData.length = 0;
  distanceData.length = 0;

  if (totaldistanceChart) {
    totaldistanceChart.update();
  }
}


// ---------------------------------------------
// LOG POSITION (runs every 3 seconds)
// ---------------------------------------------
function logPosition(pos) {

  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  let distance = 0;
  let distance2 = 0;

  // Elapsed time logic
  let elapsedSeconds = 0;
  if (firstLogTime === null) {
    firstLogTime = Date.now();
  }
  elapsedSeconds = Math.floor((Date.now() - firstLogTime) / 1000);

  // Compute distances
  if (lastLoggedPosition) {
    distance = haversine(
      lastLoggedPosition.lat, lastLoggedPosition.lon,
      lat, lon
    );

    distance2 = distFormula(
      lastLoggedPosition.lat, lastLoggedPosition.lon,
      lat, lon
    );

    totaldist += distance2;
  }

  lastLoggedPosition = { lat: lat, lon: lon };

  // ---------------------------------------------
  // UPDATE GRAPH
  // ---------------------------------------------
  timeData.push(elapsedSeconds);
  distanceData.push(totaldist);

  if (totaldistanceChart) {
    totaldistanceChart.update();
  }

  // ---------------------------------------------
  // UPDATE TABLE
  // ---------------------------------------------
  const row = `
    <tr>
      <td>${new Date().toLocaleTimeString()}</td>
      <td>${elapsedSeconds}</td>
      <td>${lat.toFixed(6)}</td>
      <td>${lon.toFixed(6)}</td>
      <td>${distance.toFixed(2)}</td>
      <td>${distance2.toFixed(2)}</td>
      <td>${totaldist.toFixed(2)}</td>
    </tr>
  `;

  document.getElementById("logTable").innerHTML += row;
}


// ---------------------------------------------
// HAVERSINE DISTANCE FORMULA
// ---------------------------------------------
function haversine(lat1, lon1, lat2, lon2) {

  const R = 6371000;

  function toRad(x) {
    return x * Math.PI / 180;
  }

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// ---------------------------------------------
// FLAT-EARTH DISTANCE FORMULA
// ---------------------------------------------
function distFormula(lat1, lon1, lat2, lon2) {
  const R = 6371000;

  function toRad(x) {
    return x * Math.PI / 180;
  }

  let dLat = lat2 - lat1;
  let dLon = lon2 - lon1;

  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;

  const phi = toRad((lat1 + lat2) / 2);

  const x = toRad(dLon) * R * Math.cos(phi);
  const y = toRad(dLat) * R;

  return Math.sqrt(x*x + y*y);
}
