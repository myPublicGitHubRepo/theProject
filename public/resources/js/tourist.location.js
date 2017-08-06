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
 * tourist.loccation.js
 * contains functions for selecting the location
 * used by tourists
 */
var touristLocation = (function () {
    //variables
    var showLogs = false;
    var map;
    var marker;

    //the icon
    var blueMarker;

    var permissionDenied="#{false}";
    var animDur = 400;

    //used to watchPosition and to clearWatch() --> stop watching position
    var watchID;

    var defaultLocation = {lat: 0, lng: 0};
    //used to delay click to allow doubleclick
    var click_timeout;
    var click_timeoutTimer = 200; //ms
    //DOM elements
    var loadPopup;
    var infoPopup;
    var declinedPopup;
    var permissionError;
    var otherError;
    var tryAgainMessage;
    
    
    function init() {
        
        if(showLogs) console.log('document ready');

        loadPopup = $('#loadPopup');
        infoPopup = $('#infoPopup');
        declinedPopup = $('#declinedPopup');

        $("#btn_submit").on('click', function (e) {
            if(showLogs) console.log('submit button clicked');
            if(marker && _isValidGEOPosition(marker.position)){
                _submitLocation();
            }else{
                _showInfoPopup();
            }
        });

        $("#btn_info").on('click', function(e){
            if(showLogs) console.log('info ok button clicked');
            _showInfoPopup();
        });

        $("#btn_infoOk").on('click', function(e){
            if(showLogs) console.log('info ok button clicked');
            _hideInfoPopup();
        });


        $("#img_infoClose").on('click', function(e){
            if(showLogs) console.log('info close img clicked');
            _hideInfoPopup();
        });

        $("#btn_loadClose").on('click', function(e){
            if(showLogs) console.log('load close button clicked');
            //stop watching (updating and trying to get the position) if the user close the popup
            navigator.geolocation.clearWatch(watchID);
            _fillTryAgainDiv();
            _hideLoadPopup();
        });

        $("#img_loadClose").on('click', function(e){
            if(showLogs) console.log('load close img clicked');
            //stop watching (updating and trying to get the position) if the user close the popup
            navigator.geolocation.clearWatch(watchID);
            _hideLoadPopup();
        });

        $("#btn_declinedClose").on('click', function(e){
            if(showLogs) console.log('declined close button clicked');
            _hideDeclinedPopup();
        });

        $("#img_declinedClose").on('click', function(e){
            if(showLogs) console.log('declined close img clicked');
            _hideDeclinedPopup();
        });
        $("#btn_gps").on('click', function(e){
            if(showLogs) console.log('gps img clicked');
            _getGEOLocation();
        });

        _getGEOLocation();

    }

    function setErrorMessages(permissionError, otherError, tryAgainMessage){
        this.permissionError = permissionError;
        this.otherError = otherError;
        this.tryAgainMessage = tryAgainMessage;
    }
    /**
     * callback when the map script has been successfully loaded
     */
    function initMap(){
        if(showLogs) console.log('init map');
        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultLocation,
            zoom: 3,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: true,
            fullscreenControl: false
        });

        blueMarker = {
            url: '/resources/images/icons/blueMarker.png',
            size: new google.maps.Size(46, 64),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(11, 32),
            scaledSize: new google.maps.Size(23, 32)
        };
        
        _addMapListeners();
        
    }
    /**
     * adds listeners on the map element
     */
    function _addMapListeners(){
        if(showLogs) console.log("add map listeners");
        //place a marker or remove it
        map.addListener('click', function (event) {
            if(showLogs) console.log('map click');
            //waits ms for marker to be placed		
            click_timeout = setTimeout(function () {
                if(showLogs) console.log('map click timeout ended');
                _updateMarker(event.latLng);
            }, click_timeoutTimer);
        });
        //double click zooms
        map.addListener('dblclick', function (event) {
            if(showLogs) console.log('doubleclick, zoom level: ' + map.getZoom());
            clearTimeout(click_timeout);
        });
    }
    /**
     * adds a new marker created by the tourist to the map and saves it in an array
     * @param {Object {double, double}} position lat lng of the marker to set
     */
    function _addMarker(position) {
        if(showLogs) console.log('add marker');
        
        marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: blueMarker
        });
    }
    /**
     * gets the geo location
     */
    function _getGEOLocation() {
        _showLoadPopup();
        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            //watchPosition() is used instead of getCurrentPosition() so this action can be stopped
            watchID = navigator.geolocation.watchPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                //stop watching (updating and trying to get the position) when the position is found
                navigator.geolocation.clearWatch(watchID);
                map.setCenter(pos);
                _updateMarker(pos);
                _hideLoadPopup();
                map.setZoom(15);
                _fillTryAgainDiv();
            }, function (error) { //error function
                //user did not allow google maps
                if(showLogs) console.log('The Geolocation service failed');
                if (error.code == error.PERMISSION_DENIED){
                    document.getElementById('errorMessage').innerHTML = permissionError;
                }
                else{
                    document.getElementById('errorMessage').innerHTML = otherError
                    _fillTryAgainDiv();
                }
                _hideLoadPopup();
                _showDeclinedPopup();
            });

        } else {
            // Browser doesn't support Geolocation
            if(showLogs) console.info('Your browser does not support geolocation');
            _hideLoadPopup();
            _showDeclinedPopup();
            _fillTryAgainDiv();
        }
    }
    /**
     * sets the marker to the given position
     * @param {object{lat: double, lng: double}} pos to set marker at
     */
    function _updateMarker(pos){
        if(showLogs) console.log("update marker");
        if(_isValidGEOPosition(pos)){
            if(!marker){
                _addMarker(pos);
                map.setZoom(15);
                map.panTo(pos);
            }
            else {
                marker.setPosition(pos);
            }
        }else{
            if(showLogs) console.log("invalid position");
        }
    }

    function _showInfoPopup(){
        infoPopup.show(animDur);
    }

    function _hideInfoPopup(){
        infoPopup.hide(animDur);
    }

    function _showLoadPopup(){
        loadPopup.show(animDur);
    }

    function _hideLoadPopup(){
        console.log(loadPopup);
        loadPopup.hide(animDur);
    }

    function _showDeclinedPopup(){
        declinedPopup.show(animDur);
    }

    function _hideDeclinedPopup(){
        declinedPopup.hide(animDur);
    }

    //not used anumore??
    /*
    function getTouristLocation(){
        if(showLogs) console.log('get tourist location');
        _getGEOLocation();
    }
    */

    /**
     * checks if the given position is valid (only if lat and lng are not null)
     * @param {Object{lat: double, lng: double}} pos
     * @returns {Boolean} true if lat and lng are valid (not null)
     */
    function _isValidGEOPosition(pos){
        return (pos.lat != null && pos.lng != null);
    }

    function _fillTryAgainDiv(){
        document.getElementById('tryAgain').innerHTML = '<a id="btn_infoLocation" class="btn btn-default btn-white btn-map">'+tryAgainMessage+'</a>';
        $("#btn_infoLocation").on('click', function(e){
            _hideInfoPopup();
            if(showLogs) console.log('location img clicked');
            _getGEOLocation();
        });
    }
    /**
     * submits the position with a POST method
     * action ="/touristLocation"
     */
    function _submitLocation(){
        var pos = JSON.stringify(marker.position);
        // Create the form object
        var locForm = document.createElement("form");
        locForm.setAttribute("method", "post");
        locForm.setAttribute("action", "/tourist");
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("name", "position");
        hiddenField.setAttribute("value", pos);
        // append the newly created control to the form
        locForm.appendChild(hiddenField);
        document.body.appendChild(locForm); // inject the form object into the body section
        locForm.submit();
    }



    return {
        setErrorMessages:setErrorMessages,
        initMap:initMap,
        init:init
    }
})();

