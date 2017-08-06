/**
 * Copyright Ⓒ 2016 Splinxs
 * Authors: Elia Kocher, Philippe Lüthi
 * This file is part of Splinxs.
 * 
 * Splinxs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License V3 as published by
 * the Free Software Foundation, see <http://www.gnu.org/licenses/>.
 */

/**
 * guide.knownArea.map.js
 * contains functions for marking certain regions on the map
 * used by guides
 */

//this variable shoud be public
//circles loaded from db
var existingCircles = null;
var guideAreas = (function () {


    //variables
    var showLogs = false;
    var map;
    var drawingManager;
    var searchBox;
    var drawingModes;
    var circles = [];
    var circleCounter = 0;
    var circleOptions = {
        fillColor: '#28B294',
        fillOpacity: 0.6,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        zIndex: 1,
        suppressUndo: true,
        strokeColor: '#2585C4'
    };
    var defaultLocation = {lat: 0, lng: 0};
    

    var animDur = 400;
    var infoPopup;
    var backArrow;

    function init() {
        if (showLogs) console.log('guide areas document ready');
        if (!Modernizr.datalistelem) {
            $("#sb_places").hide();
            //remove the class that makes the element move when there is no place for the sb and the controls
            $("#mapControls").removeClass('controls-move');
            $("#mapInfos").removeClass('info-move');
        }
        infoPopup = $("#infoPopup");
        //areaForm = $("#frm_areas");
        backArrow =$("#backArrow");

        $("#btn_knownAreasContinue").click(function (e) {
            if(showLogs) console.log('knownAreasContinue button clicked');
            var n = _getNumberOfCircles();
            if(n > 0){
                _saveCircles();
            }else{
                //no areas are selected
                $("#nothingSelected").show();
            }

        });
        $(".nothingSelectedClose").click(function () {
            $("#nothingSelected").hide(animDur);
        });

        $("#mapControlRemoveCircles").click(function () {
            if(showLogs) console.log('mapControlRemoveCircles clicked');
            drawingManager.setDrawingMode(null);
            drawingManager._removeCircle = true;
        });
        $("#img_infoClose").click(function () {
            if(showLogs) console.log('img_infoClose clicked');
            infoPopup.hide(animDur);
        });
        $("#infoBottom").click(function () {
            if(showLogs) console.log('infoBottom clicked');
            infoPopup.hide(animDur);
        });

        $('.control').click(function() {
            //console.log($(this));
            $('.control').removeClass('selected-control');
            $(this).addClass('selected-control');
        });

        $("#mapControlPan").click(function () {
            if(showLogs) console.log('mapControlPan clicked');
            drawingManager.setDrawingMode(drawingModes.pan);
            drawingManager._removeCircle = false;
        });

        $("#mapControlAddCircles").click(function () {
            if(showLogs) console.log('mapControlAddCircles clicked');
            drawingManager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
            drawingManager._removeCircle = false;
        });

        $("#mapInfoOpener").click(function () {
            if(showLogs) console.log('mapInfoOpener clicked');
            drawingManager.setDrawingMode(drawingModes.pan);
            drawingManager._removeCircle = false;
            infoPopup.show(animDur);
        });

        _loadExistingCircles();

    }

    /**
     * callback when the map script has been successfully loaded
     */
    function initMap() {
        if (showLogs) console.log('initialising guide areas map');
        map = new google.maps.Map($("#map")[0],{
            center: defaultLocation,
            zoom: 2,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: true,
            fullscreenControl: false
        });

        _addKnownAreaMapListeners();
        _initDrawingManager();
        
        drawingModes = {
            pan: null,
            circle: google.maps.ControlPosition.TOP_CENTER
        };
        
        _initSearchBox();
        
    }
    /**
     * add listeners to the map
     */
    function _addKnownAreaMapListeners() {
        if (showLogs) console.log('add listeners');
        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
            if (showLogs) console.log('bounds changed');
            searchBox.setBounds(map.getBounds());
        });
    }
    /**
     * initialises the drawing manager
     */
    function _initDrawingManager() {
        if (showLogs) console.log('init drawing manager');
        drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.Circle,
            drawingControl: false,
            circleOptions: circleOptions
        });

        drawingManager._removeCircle = false;
        drawingManager.setMap(map);

        _addDrawingManagerListeners();
    }
    /**
     * adds the listeners to the drawing manager
     */
    function _addDrawingManagerListeners() {
        if (showLogs) console.log('add drawing manager listeners');
        google.maps.event.addListener(drawingManager, 'circlecomplete', function (circle) {
            if (showLogs) console.log('circlecomplete');
            _addCircle(circle);
        });

    }
    /**
     * adds listeners to the circle
     * @param {google.maps.drawing.OverlayType.Circle} circle for which the listeners should be added
     */
    function _addCircleListeners(circle) {
        if(showLogs) console.log('add circle listeners');
        //center changed
        google.maps.event.addListener(circle, 'center_changed', function (event) {
            if (showLogs) console.log('circle center changed, lat: ' + circle.center.lat() + ' , lng: ' + circle.center.lng());
        });
        //radius changed
        google.maps.event.addListener(circle, 'radius_changed', function (event) {
            if (showLogs) console.log('circle radius changed: ' + circle.radius);
        });
        //click
        google.maps.event.addListener(circle, 'click', function (event) {
            if (showLogs) console.log('circle click, id: ' + circle.id);
            if (drawingManager._removeCircle) {
                _removeCircle(circle);
            }
        });

    }
    /**
     * adds a circle
     * @param {google.maps.drawing.OverlayType.Circle} circle to add
     */
    function _addCircle(circle) {
        circle.id = circleCounter++;
        if (showLogs) console.log('add circle, id: ' + circle.id);
        circles.push(circle);
        _addCircleListeners(circle);
    }
    /**
     * removes a circle
     * @param {google.maps.drawing.OverlayType.Circle} circle
     */
    function _removeCircle(circle) {
        if (showLogs) console.log('removing circle, ' + circle.id);

        google.maps.event.clearListeners(circle, 'center_changed');
        google.maps.event.clearListeners(circle, 'radius_changed');
        circle.setRadius(0);

        circle.setMap(null);

        circles = jQuery.grep(circles, function (value) {
            return value.id != circle.id;
        });
    }
    /**
     * initialises the search box
     */
    function _initSearchBox(){
        if (showLogs) console.log('init search box');
        var sb = $("#sb_places")[0];
        searchBox = new google.maps.places.SearchBox(sb);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(sb);
        
        _addSearchBoxListeners();
    }
    /**
     * adds the listeners to the search box
     */
    function _addSearchBoxListeners(){
        if (showLogs) console.log('add search box listeners');
        // Listen for the event fired when the user selects a prediction and retrieve more details for that place.
        google.maps.event.addListener(searchBox, 'places_changed', function () {
            var places = searchBox.getPlaces();

            if (places.length == 0) {
                return;
            }
            
            // For each place, get the icon, name and location.
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function(place) {
                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                bounds.extend(place.geometry.location);
                }
            });
            map.fitBounds(bounds);
        });
    }

    /**
     * gets all the circles set by the user or null
     * @returns {Array|circles} the array of circles or null
     */
    function _getCircles(){
        if(showLogs) console.log('get circles');
        if(circles.length > 0){
            return circles;
        }else{
            return null;
        }
    }
    /**
     * gets the number of all circles set by the user
     * @returns {Number} number of circles
     */
    function _getNumberOfCircles(){
        if(showLogs) console.log('get number of circles');
        var n = _getCircles();
        return (n == null || n == 'undefined') ? 0 : n.length;
    }
    /**
     * loads the existing circles and displays them on the map
     */
    function _loadExistingCircles(){
        if(showLogs) console.log('load existing circles');
        if(existingCircles == null){
            if(showLogs) console.log('no existing circles');
        }else{
            if(existingCircles.length > 0){
                //guide comes from guide site, he can go back
                //show back button
                backArrow.show();

                if(showLogs) console.log('number of existing circles: ' + existingCircles.length);
                //set properties for each circle
                $.each(existingCircles, function (index, value) {
                    var c = new google.maps.Circle({
                        center: {lat: value.lat, lng: value.lng},
                        radius: value.radius,
                        fillColor: circleOptions.fillColor,
                        fillOpacity: circleOptions.fillOpacity,
                        strokeWeight: circleOptions.strokeWeight,
                        clickable: circleOptions.clickable,
                        editable: circleOptions.editable,
                        zIndex: circleOptions.zIndex,
                        suppressUndo: circleOptions.suppressUndo,
                        strokeColor: circleOptions.strokeColor,
                        map: map
                    });
                    //display circle on map and add listeners
                    _addCircle(c);
                });
            }else{
                if(showLogs) console.log('less than 1 existing circle');
            }
        }
    }
    /**
     * prepares the circles to be saved to the server and sends them
     */
    function _saveCircles(){
        if(showLogs) console.log('save circles');
        if(_getNumberOfCircles() > 0){
            var ec = [];
            $.each(circles, function (index, value) {
                var circle = {
                    radius: value.radius,
                    lat: value.center.lat(),
                    lng: value.center.lng()
                };
                ec.push(circle);
                _removeCircle(value);
            });
            existingCircles = JSON.stringify(ec);
            _submitCircles();
        }else{
            if(showLogs) console.log('no circles to save');
            //prevent form from being submitted
            return false;
        }
    }
    /**
     * sends the saved circles to the server
     */
    function _submitCircles(){
        // Create the form object
        var areaForm = document.createElement("form");
        areaForm.setAttribute("method", "post");
        areaForm.setAttribute("action", "/guideAreas");
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("name", "areas");
        hiddenField.setAttribute("value", existingCircles);
        // append the newly created control to the form
        areaForm.appendChild(hiddenField);
        document.body.appendChild(areaForm); // inject the form object into the body section
        areaForm.submit();
    }
     return{
         init:init,
         initMap:initMap
     }

})();


$(document).ready(function(){
    guideAreas.init();
});