ROSM.RoutingDescription = {
  onClickRoutingDescription: function(id) {
    ROSM.G.route.setFormalStyle();
    ROSM.G.route.setHighLightStyle(id);
    //ROSM.G.map.fitBounds(ROSM.G.route.centerView(id));
    ROSM.G.route.centerViewPart(id);
  },

  show: function(response) {
    var body = "";
    var id = 0;
    body += '<table class="ui very basic table">';
    body += '<tbody>';
    for(var i = 0; i < response.length; i++) {
      for(var j = 0; j < response[i].length; j++) {
        body += '<tr>';
        var roadName = response[i][j].road;
        body += '<td>' + '<div onclick="ROSM.RoutingDescription.onClickRoutingDescription(' + id + ')">' + roadName + '</div>' + '</td>';
        body += '</tr>';
        id++;
      }
    }
    body += '</tbody>';
    body += '</table>';

    document.getElementById('road').innerHTML = body;
  },

  reset: function() {
    document.getElementById('road').innerHTML = "";
  }
}
