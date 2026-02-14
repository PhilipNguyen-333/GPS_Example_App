// ---------------------------------------------
// GLOBAL VARIABLES
// ---------------------------------------------

let watchId = null; /* watchId is needed to run the watchPosition() method. 
The watchPosition() method will input a unique number into the watchID variable, 
thereby making watchId no longer "null". Visit the website below for more details:
https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition */
let intervalId = null; /* intervalId is needed to run the setInterval() method. 
The setInterval method allows you to run a function repeatedly with a specified
time interval. Visit the website below for more information:
https://www.w3schools.com/jsref/met_win_setinterval.asp */
let latestPosition = null; /* latestPosition is a variable that will store 
the most recent GPS coordinates */
let lastLoggedPosition = null; /*lastLoggedPosition is a variable that will
store the GPS coordinates that occurred immediately before latestPosition */
let tracking = false; /* we will use this tracking variable to help the code
know when tracking is occurring and when it has stopped. This variable will 
help the code know to not duplicate tracking if the user pressed the "Start
Tracking" button twice */
let firstLogTime = null;
let totaldist = 0; /* this totaldistance variable will store our
total distance travelled */

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
}; // when user presses the "Start Tracking" button, the startTracking() function is activated

document.getElementById("stopBtn").onclick = function() {
  stopTracking();
}; // when user presses the "Stop Tracking" button, the stopTracking() function is activated


// ---------------------------------------------
// START TRACKING: the function that runs when the user presses the "Start Tracking" button
// ---------------------------------------------
function startTracking() {

  if (tracking) {
    return;
  } /* this if statement prevents the program from duplicating GPS
  tracking. This prevents duplication of tracking from happening if the user 
  accidently pressed the "Start Tracking" button twice */
  

  tracking = true;

  /* The watchPosition() method has THREE inputs. Its job is 
  to pull your device's GPS data EACH time your device spits 
  out new GPS coordinates. This method is very powerful since
  it acts like a loop where it will forever collect GPS data.
  Every device has its own internal clock of when it spits out 
  new GPS coordinates. (Some devices have new coordinates every second, some every 15 seconds, etc.) */ 
  watchId = navigator.geolocation.watchPosition(
    function(pos) {
      latestPosition = pos;
    } /* Input #1: a callback function used to put the new GPS 
    coordinates into the variable latestPosition, thereby converting
    latestPosition from being "null" to having true GPS values */,
    function(err) {
      console.error(err);
    } /* Input #2: a callback function that tells your program
    what to do if the GPS coordinates failed to load */,
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    } /* Input #3: an object which gives specific configuration options */
  );

  /* The setInterval() method below tells the program to run the
  logPosition() function every 3 seconds if latestPosition is true 
  (meaning latestPosition has true GPS values and is not "null") */
  intervalId = setInterval(function() {
    if (latestPosition) {
      logPosition(latestPosition);
    }
  }, 3000);
}


// ---------------------------------------------
// STOP TRACKING: the function that runs when the user presses the "Stop Tracking" button
// ---------------------------------------------
function stopTracking() {

  tracking = false; /* we want the tracking variable to be an indicator
  of if we are in the process of tracking (true or not tracking (false) */ 

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  } /* clearing the watchId is how we stop the watchPosition() method from 
  tracking GPS coordinates */

  if (intervalId !== null) {
    clearInterval(intervalId);
  } /* clearing the intervalId is how we stop the setInterval() method from 
  looping every 3 seconds */

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
// LOG POSITION: this function contains all the actions we want to happen every 3 seconds
// ---------------------------------------------
function logPosition(pos) {

  const lat = pos.coords.latitude; // store the latitude of the most recent GPS coordinates
  const lon = pos.coords.longitude; // store the longitude of the most recent GPS coordinates

  let distance = 0; /* updates the distance to be 0 at the start 
  of each operation of the logPosition() function. This distance
  variable will track the distance using the Haversine formula */
  let distance2 = 0; /* updates the distance2 to be 0 at the start 
  of each operation of the logPosition() function. This distance2
  variable will track the distance using a modified distance formula */

  // Elapsed time logic
  if (firstLogTime === null) {
    firstLogTime = Date.now();
  } /* this if statement uses the .now() method, which basically gives
  a timestamp (but in terms of number of milliseconds that have elapsed 
  since Jan 1, 1970). This if statement gives a timestamp to the
  firstLogTime variable only when the firstlogTime variable was previously "null".
  Very handy since we ONLY want to give a timestamp to firstLogTime on the
  FIRST occurrence.*/
  let elapsedSeconds = Math.floor((Date.now() - firstLogTime) / 1000); // elapsedSeconds tells us the amount of time that has elapsed since the firstLogTime

  // Compute distances
  if (lastLoggedPosition) {
    distance = haversine(
      lastLoggedPosition.lat, lastLoggedPosition.lon,
      lat, lon
    ); /* this if statement tells the program to update distance using 
    the haversine() function if we have a lastLoggedPosition.*/

    distance2 = distFormula(
      lastLoggedPosition.lat, lastLoggedPosition.lon,
      lat, lon
    ); /* this if statement tells the program to update distance2 using 
    the distFormula() function if we have a lastLoggedPosition. */

    totaldist = totaldist + distance2; /* the totaldist variable is equal to adding up all of the 
    distance2 values. An easy way to do this is by recursively adding distance2 to the 
    previous totaldist each time we run the logPosition() function */
  }

  lastLoggedPosition = { lat: lat, lon: lon }; /* the most recent latitude and longitude 
  data is stored into our lastLoggedPosition variable. When the logPosition() function
  is activated next time, we will have another set of EVEN MORE recent latitude and 
  longitude data that will be compared with lastLoggedPosition in order to derive
  distances. */

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
// HAVERSINE DISTANCE FORMULA: this function inputs your two GPS coordinates and spits out the distance between them using the Haversine formula
// ---------------------------------------------
function haversine(lat1, lon1, lat2, lon2) {

  const R = 6371000; // radius of the Earth in meters

  function toRad(x) {
    return x * Math.PI / 180;
  } // an embedded function that converts your degrees latitude and longitude into radians 

  const dLat = toRad(lat2 - lat1); // find the radians between your two latitudes
  const dLon = toRad(lon2 - lon1); // find the radians between your two longitudes

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // returns this value as your distance
}


// ---------------------------------------------
// MODIFIED DISTANCE FORMULA: this function inputs your two GPS coordinates and spits out the distance between them using a modified distance formula
// ---------------------------------------------
function distFormula(lat1, lon1, lat2, lon2) {
  const R = 6371000; // radius of the Earth in meters

  function toRad(x) {
    return x * Math.PI / 180;
  } // an embedded function that converts your degrees latitude and longitude into radians 

  let dLat = lat2 - lat1; // find the radians between your two latitudes
  let dLon = lon2 - lon1; // find the radians between your two longitudes

  if (dLon > 180) dLon -= 360; // accounting for the scenario where your longitudes "wrap" around and inflate your change in angle
  if (dLon < -180) dLon += 360; // accounting for the scenario where your longitudes "wrap" around and inflate your change in angle

  const phi = toRad((lat1 + lat2) / 2); // adjusting how the distance between your longitudes is different based on your latitude level 

  const x = toRad(dLon) * R * Math.cos(phi); // finding the horizontal change (with an extra cosine term to adjust for the fact that longitudes converge at the poles)
  const y = toRad(dLat) * R; // finding the vertical change

  return Math.sqrt(x*x + y*y); // returns the value as produced by the distance formula
}
