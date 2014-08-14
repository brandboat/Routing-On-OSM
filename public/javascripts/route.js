var field = new Field();
var map;
var geoJson;
var bMarker, eMarker;

function start() {
  field.setValue(22.996086277507416, 120.21786533296108);
}

function Field() {
  var latitude,
      longitude;
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
  map = L.map('map').setView(setPlace, 14);
  map.options.minZoom = 14;
  var southWest = new L.LatLng(22.970800756838422, 120.18084213137627);
  var northEast = new L.LatLng(23.021841032778894, 120.25491401553153);
  var bounds = new L.LatLngBounds(southWest, northEast);
  map.options.maxBounds = bounds;
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function routing() {
  var request = $.ajax({
    type: "GET",
    url: "/routing",
    dataType: "json",
    data: {
      beginLng: $("#beginLng").val(),
      beginLat: $("#beginLat").val(),
      endLng: $("#endLng").val(),
      endLat: $("#endLat").val()
    }
  });
  request.done(function(data) {
    var myStyle = {
      "color": "#ff7800"
    };
    geoJson = L.geoJson(data, {style: myStyle}).addTo(map);

    var str = "",
        tmp = "";
    for(var i = 0; i != data.length; i++) {
        str += "<p>";
        str += data[i].road;
        str += "</p>";
    }
    $("#road").html(str);
  });
  request.fail(function( jqXHR, textStatus, errorThrown) {
    console.err("err: " + textStatus + ' ' + errorThrown);
  });
}

function getLocation($input1, $input2, myIcon) {
  map.on('click', function(e) {
    $input1.val(e.latlng.lat);
    $input2.val(e.latlng.lng);
    marker = L.marker(e.latlng,{icon: myIcon}).addTo(map);
    map.off('click');
  });
}

$("#begin").click(function() {
  var greenIcon = L.MakiMarkers.icon({icon: "rocket", color: "#008000", size: "m"});
  if(bMarker !== undefined) {
    map.removeLayer(bMarker);
  }
  if(geoJson !== undefined) {
    map.removeLayer(geoJson);
  }
  map.on('click', function(e) {
    $("#beginLat").val(e.latlng.lat);
    $("#beginLng").val(e.latlng.lng);
    bMarker = L.marker(e.latlng,{icon: greenIcon}).addTo(map);
    map.off('click');
  });
});

$("#end").click(function() {
  var redIcon = L.MakiMarkers.icon({icon: "rocket", color: "#FF0000", size: "m"});
  if(eMarker !== undefined) {
    map.removeLayer(eMarker);
  }
  if(geoJson !== undefined) {
    map.removeLayer(geoJson);
  }
  map.on('click', function(e) {
    $("#endLat").val(e.latlng.lat);
    $("#endLng").val(e.latlng.lng);
    eMarker = L.marker(e.latlng,{icon: redIcon}).addTo(map);
    map.off('click');
  });
});

$("#reset").click(function() {
  $("#beginLng").val("");
  $("#beginLat").val("");
  $("#endLng").val("");
  $("#endLat").val("");
  $("#road").html("");
  if(geoJson !== undefined) {
    map.removeLayer(geoJson);
  }
  if(bMarker !== undefined) {
    map.removeLayer(bMarker);
  }
  if(eMarker !== undefined) {
    map.removeLayer(eMarker);
  }
});

$("#route").click(function() {
  // remove previous routing layer(if exists);
  if (geoJson !== undefined) {
    map.removeLayer(geoJson);
  }
  routing();
});

