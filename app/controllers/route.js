/*
exports.queryTime = function(req, res) {
  var pg = require('pg');
  var config = require('../config/config');
  //var conString = "postgres://" + config.database.username + ":"
  //    + config.database.password + "@localhost/" + config.database.dbname;
  var conString = config.database.url + "/" + config.database.dbname;
  var client = new pg.Client(conString);

  function connect_db() {
    client.connect(function(err) {
      if(err) {
        return console.error('✗ Postgresql Connection Error. Please make sure Postgresql is running. -> ', err);
      }
      console.log("✔ Connect to Postgresql");
    });
  }
  client.connect();
  client.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) {
      return console.error('✗ Postgresql Running Query Error', err);
    }
    res.send(200, result.rows[0].theTime);
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
    client.end();
  });
}*/

exports.pgr_dijkstra = function(req, res) {
  var pg = require('pg');
  var config = require('../config/config');
  var conString = config.database.url + "/" + config.database.dbname;
  //var conString = "postgres://" + config.database.username + ":"
   //   + config.database.password + "@localhost/" + config.database.dbname;
  var client = new pg.Client(conString);
  var reqPoint = [];
  /*
  [
    {
      "lat": req.query.beginLat,
      "lng": req.query.beginLng
    },
    {
      "lat": req.query.endLat,
      "lng": req.query.endLng
    }
  ];*/
  var point = [];
  var i = 0, j = 0;
  var queryStreets = [];



  client.connect();
  eliminate(req.query.latlngs);
  getPoint();

  // delete duplicate points.
  function eliminate(latlngs) {
    var q = latlngs;
    reqPoint.push(q[0]);
    for(var i = 1; i < q.length; i++) {
      if(q[i].lat === q[i - 1].lat && q[i].lng === q[i - 1].lng) {
      } else {
        reqPoint.push(q[i]);
      }
    }
  }

  // get the nearest point of begin and end point in topology network(database).
  function getPoint() {
    if(i === reqPoint.length) {
      dijkstra(point[j], point[j + 1]);
      j++;
      return;
    }
    var qStr = "SELECT id FROM ways_vertices_pgr ORDER BY st_distance(the_geom, st_setsrid(st_makepoint(" + reqPoint[i].lng + "," + reqPoint[i].lat + "), 4326)) LIMIT 1;";
    // console.log(qStr);

    client.query(qStr, function(err,result) {
      if(err) {
        console.log(qStr);
        return console.error('✗ Postgresql Running Query Error', err);
      }
      // console.log("%j", reqPoint[i]);
      // console.log(result);
      point[i++] = result.rows[0].id;
      getPoint();
    });
  }

  function dijkstra(begin, end) {
    if(j === point.length - 1){
      allDone(queryStreets);
      return;
    }

    var qStr = "WITH result AS (SELECT * FROM ways JOIN (SELECT seq, id1 AS node, id2 AS edge_id, cost, ROW_NUMBER() OVER (PARTITION BY 1) AS rank FROM pgr_dijkstra('SELECT gid AS id, source::integer, target::integer, length::double precision AS cost FROM ways'," + begin + ", " + end + ", false, false)) AS route ON ways.gid = route.edge_id ORDER BY rank) SELECT ST_AsEWKT(result.the_geom), name from result;";
    // console.log(qStr);
    client.query(qStr, function(err, result) {
      if(err) {
        console.log(qStr);
        return console.error('✗ Postgresql Running Query Error', err);
      }
      parsingData(result.rows);
    });
  }

  function toGeoJson(road, type, points) {
    if(road === "") {
      road = "unknown";
    }
    var geoJson = {
      "road": road,
      "type": type,
      "coordinates": points
    };
    return geoJson;
  }

  // parsing the result from query.
  function parsingData(data) {
    // the data is like : "SRID=4326;LINESTRING(120.2121912 22.9975817,120.2123558 22.9982876)"
    var x = 0;
    var result = [];
    for(var i = 0; i != data.length; i++) {
      var points = [];
      var y = 0;
      var tmp = data[i].st_asewkt.split('(');
      var tmp2 = tmp[1].split(')');
      var tmp3 = tmp2[0].split(',');
      for(var j = 0; j != tmp3.length; j++) {
        var tmp4 = tmp3[j].split(' ');
        var point = [tmp4[0], tmp4[1]]
        tmp4[1];
        points[y] = point;
        y++;
      }
      var geoObj = toGeoJson(data[i].name, "LineString", points);
      result[x++] = geoObj;
    }
    collectLines(result);

  }

  function collectLines(result) {
    var _result = [];
    var road = "";
    var lines = [];
    for(var i = 0; i < result.length; i++) {
      if(result[i].road !== road) {
        var a = {
          "road": road,
          "lines": lines
        };
        _result.push(a);
        lines = [];
      }
      road = result[i].road;
      lines.push(result[i]);
    }
    _result.push({"road": road, "lines": lines});
    queryStreets.push(_result);
    dijkstra(point[j], point[j + 1]);
    j++;
    //allDone(_result);
  }

  function allDone(data) {
    res.send(200, data);
    res.end();
    client.end();
  }
}
