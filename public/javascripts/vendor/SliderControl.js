L.Control.SliderControl = L.Control.extend({
    options: {
        position: 'topright',
        layers: null,
        maxValue: -1,
        minValue: -1,
        markers: null,
        range: false,
        follow: false,
        player: false
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
        this._layer = this.options.layer;

    },

    setPosition: function (position) {
        var map = this._map;

        if (map) {
            map.removeControl(this);
        }

        this.options.position = position;

        if (map) {
            map.addControl(this);
        }
        this.startSlider();
        return this;
    },

    onAdd: function (map) {
        this.options.map = map;
        var _options = this.options;

        // Create a control sliderContainer with a jquery ui slider
        var sliderContainer = L.DomUtil.create('div', 'slider', this._container);
        if(_options.player) {
            $(sliderContainer).append('<div id="leaflet-slider" style="width:200px"><div class="ui-slider-handle"></div><div style="margin-top: 20px;"><button id="play-sc-btn" style="color: #fff;background-color: #5cb85c;border-color: #4cae4c; margin: 3px; border: 0px;">Play</button><button id="stop-sc-btn" style="color: #fff; background-color: #d9534f; border-color: #d43f3a; margin: 3px; border: 0px;">Stop</button><button id="restart-sc-btn" style="color: #fff; background-color: #f0ad4e; border-color: #eea236; margin: 3px; border: 0px;">Restart</button></div><div id="slider-timestamp" style="width:200px; margin-top:10px; padding: 3px; background-color:#FFFFFF"></div></div>');
        }else {
            $(sliderContainer).append('<div id="leaflet-slider" style="width:200px"><div class="ui-slider-handle"></div><div id="slider-timestamp" style="width:200px; margin-top:10px;background-color:#FFFFFF"></div></div>');
        }
        //Prevent map panning/zooming while using the slider
        $(sliderContainer).mousedown(function () {
            map.dragging.disable();
        });
        $(document).mouseup(function () {
            map.dragging.enable();
            //Only show the slider timestamp while using the slider
            $('#slider-timestamp').html('');
        });

        this.options.markers = [];
        var that = this;

        //If a layer has been provided: calculate the min and max values for the slider
        if (this._layer) {
            this._layer.eachLayer(function (layer) {
                if (that.options.minValue === -1) {
                    that.options.minValue = layer._leaflet_id;
                }
                that.options.maxValue = layer._leaflet_id;
                that.options.markers[layer._leaflet_id] = layer;
            });
        } else {
            console.log("Error: You have to specify a layer via new SliderControl({layer: your_layer});");
        }
        return sliderContainer;
    },

    onRemove: function (map) {
        //Delete all markers which where added via the slider and remove the slider div
        for (var i = this.options.minValue; i < this.options.maxValue; i++) {
            map.removeLayer(this.options.markers[i]);
        }
        $('#leaflet-slider').remove();
    },

    initPlayer: function() {
        var that = this;
        // getter
        var slider_val = $("#leaflet-slider").slider( "option", "value" );
        that.options.slider_val = slider_val;
        // setter
        $( "#leaflet-slider" ).slider( "option", "value", 10 );
        $("#play-sc-btn").click(function() {
            that._playMap();
        });

        $("#stop-sc-btn").click(function() {
            that._stopMap();
        })

        $("#restart-sc-btn").click(function() {
            that._restartMap();
        })

    },

    _playMap : function() {
        var that = this;
        this.interval = setInterval(function() {
            if(that.options.slider_val < that.options.maxValue) {
                $( "#leaflet-slider" ).slider( "option", "value", ++that.options.slider_val);
            }else {
                that._restartMap();
            }
        }, 2000);
        $("#play-sc-btn").attr("disabled", true).css("background-color", "#CCC");
        $("#stop-sc-btn").attr("disabled", false).css("background-color", "#d9534f");
    },

    _stopMap: function() {
        clearInterval(this.interval);
        $("#play-sc-btn").attr("disabled", false).css("background-color", "#5cb85c");
        $("#stop-sc-btn").attr("disabled", true).css("background-color", "#CCC");
    },

    _restartMap: function() {
        var that = this;
        clearInterval(that.interval);
        that.options.slider_val = that.options.minValue;
        $("#play-sc-btn").attr("disabled", false).css("background-color", "#5cb85c");
        $("#stop-sc-btn").attr("disabled", true).css("background-color", "#CCC");
        $( "#leaflet-slider" ).slider( "option", "value", that.options.minValue);
    },

    startSlider: function () {
        var that = this;
        _options = this.options;
        var setMap = function(e, ui) {
            var map = _options.map;
            if(!!_options.markers[ui.value]) {
                // If there is no time property, this line has to be removed (or exchanged with a different property)
                if(_options.markers[ui.value].feature !== undefined) {
                    if(_options.markers[ui.value].feature.properties.time){
                        if(_options.markers[ui.value]) $('#slider-timestamp').html(_options.markers[ui.value].feature.properties.time);
                    }else {
                        console.error("You have to have a time property");
                    }
                }else {
                    // set by leaflet Vector Layers
                    if(_options.markers [ui.value].options.time){
                        if(_options.markers[ui.value]) $('#slider-timestamp').html(_options.markers[ui.value].options.time);
                    }else {
                        console.error("You have to have a time property");
                    }
                }
                if(_options.range){
                    // jquery ui using range
                    for (var i = ui.values[0]; i <= ui.values[1]; i++){
                       if(_options.markers[i]) map.addLayer(_options.markers[i]);
                    }
                    for (var i = _options.maxValue; i > ui.values[1]; i--) {
                        if(_options.markers[i]) map.removeLayer(_options.markers[i]);
                    }
                    for (var i = _options.minValue; i < ui.values[0]; i++) {
                        if(_options.markers[i]) map.removeLayer(_options.markers[i]);
                    }
                }else if(_options.follow){
                    map.addLayer(_options.markers[ui.value]);
                    for (var i = _options.minValue; i <= (ui.value - 1); i++) {
                        if(_options.markers[i]) map.removeLayer(_options.markers[i]);
                    }

                    for (var i = (ui.value + 1); i <= _options.maxValue; i++) {
                        if(_options.markers[i]) map.removeLayer(_options.markers[i]);
                    }
                }else{
                    // jquery ui for point before
                    for (var i = _options.minValue; i <= ui.value ; i++) {
                        if(_options.markers[i]) map.addLayer(_options.markers[i]);
                    }
                    for (var i = (ui.value + 1); i <= _options.maxValue; i++) {
                        if(_options.markers[i]) map.removeLayer(_options.markers[i]);
                    }
                }
            }
        }
        $("#leaflet-slider").slider({
            range: _options.range,
            value: _options.minValue,
            min: _options.minValue,
            max: _options.maxValue,
            step: 1,
            slide: function (e, ui) {
                setMap(e, ui);
                that._stopMap();
                if(_options.range) {
                    _options.slider_val = ui.value[0];
                }else {
                    _options.slider_val = ui.value
                }
            },
            change: function (e, ui) {
                setMap(e, ui);
            }
        });
        console.log(_options.marker);
        console.log(_options.markers[_options.minValue]);
        _options.map.addLayer(_options.markers[_options.minValue]);
    }
});

L.control.sliderControl = function (options) {
    return new L.Control.SliderControl(options);
};
