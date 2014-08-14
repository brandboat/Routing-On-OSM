var field = new Field();
var map;
var setLogging = 0;
var count = 0;
var point_arr = [];
var sliderControl = null;

function startLocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      field.setValue(position.coords.latitude, position.coords.longitude);
      var myPoint = L.latLng(20, 30);
      console.log(myPoint);
    });

  } else {
    alert ("Geolocation is not supported by this browser.");
  }
}

function logLocate() {
  $("#logs").hide();
  setLogging = setInterval(function() {
    navigator.geolocation.getCurrentPosition(function(position) {
      $("#info-lat").html(position.coords.latitude);
      $("#info-lng").html(position.coords.longitude);
      $("#info-speed").html(position.coords.speed || "Nothing");
      $("#info-acc").html(position.coords.accuracy || "Nothing");
      $("#info-alt").html(position.coords.altitude || "Nothing");
      count++;
      $("#logs").prepend("<div class='item-log'> <b>#" + count + "</b>: Latitude: <i>" + position.coords.latitude + "</i>, Longitude: <i>" + position.coords.longitude + "</i>, Speed: <i>" + position.coords.speed + "</i>, Accuracy: <i>" + position.coords.accuracy + "</i>, Altitude: <i>" + position.coords.altitude + "</i></div>")
      point_arr.push({lat: position.coords.latitude, lng: position.coords.longitude, time: new Date()});
    })
  }, 1000);
}

function cancelLocate() {
  clearInterval(setLogging);
}

function resetLocate() {
  clearInterval(setLogging);
  count = 0;
  $("#logs").empty();
  point_arr = [];
  sliderControl.onRemove(map);
}

function Field() {
  var latitude,
      longitude
  this.getValue = function() {
    return [latitude, longitude];
  };

  this.setValue = function(lat_val, long_val) {
    latitude = lat_val;
    longitude = long_val;
    createMap(this.getValue());
  };
}


function createMap(setPlace) {
  map = L.map('map').setView(setPlace, 12);

  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.marker(setPlace).addTo(map)
  .bindPopup("<p>You are here.</b>").openPopup();

}

$("#start-log").click(function() {
	logLocate();
});

$("#pause-log").click(function() {
  cancelLocate();
});

$("#reset-log").click(function() {
  resetLocate();
});

$("#watch-log").click(function(){
  $("#logs").toggle();
});

$("#draw-log").click(function(){
  if(sliderControl !== null) {
    sliderControl.onRemove(map);
  }
  var polyline_arr = [];
  point_arr.forEach(function(point, i) {
    if (i > 0) {
      var pointA = new L.LatLng(point_arr[i - 1]["lat"], point_arr[i - 1]["lng"]);
      var pointB = new L.LatLng(point_arr[i]["lat"], point_arr[i]["lng"]);
      var pointList = [pointA, pointB];

      var polyline = new L.Polyline(pointList, {
        time: point_arr[i]["time"],
        color: 'red',
        weight: 3,
        opacity: 1,
        smoothFactor: 1
      });

      polyline_arr.push(polyline);
    }
  });
  console.log(polyline_arr);
  var layerGroup = L.layerGroup(polyline_arr);
  sliderControl = L.control.sliderControl({position: "topright", layer: layerGroup, player: true});
  map.addControl(sliderControl);
  sliderControl.startSlider();
  sliderControl.initPlayer();
})
