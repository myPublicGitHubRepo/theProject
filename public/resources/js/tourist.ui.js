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
 * tourist.ui.js
 * contains functions related with the ui on the tourist side
 * used by tourists
 */
var touristUI = (function () {
    //variables
    var loadBox;
    var content;
    var ico_audio;
    var ico_video;
    var sureWantLeaveDialog;

    var audioMuted = false;
    var videoMuted = true;

    var animDur = 400;
    /**
     * initialises ui variables for tourist
     * !needs to be called in document.ready()!
     */
    function initTouristUI(){
        if(showLogs) console.log('tourist: init gui');
        loadBox = $("#loadBox");
        content = $("#content");
        touristUI.ico_audio = $("#ico_audio");
        touristUI.ico_video = $("#ico_video");
        sureWantLeaveDialog = $("#sureWantLeaveDialog");
        initTouristButtons();
        uiHelper.initChat();
    }

    function showTouristUI(){
        if(showLogs) console.log('tourist: show gui');
    }

    function showLoadBox(){
        content.hide();
        loadBox.show();
    }

    function hideLoadBox(){
        loadBox.hide();
        content.show();
    }

    function hideAudioVideoIcons(){
        touristUI.ico_audio.hide();
        touristUI.ico_video.hide();

    }

    function initTouristButtons(){
        if(showLogs) console.log('tourist: init tourist buttons');

        $("#btn_closeConnection").click(function (e) {
            if(showLogs) console.log('btn close connection clicked');
            closeConnection();
        });

        touristUI.ico_audio.click(function (e) {
            if (showLogs) console.log('tourist: audio icon clicked, will mute: ' + !audioMuted);
            if(touristUI.audioMuted){
                //unmute audio
                touristUI.ico_audio.removeClass('lightColor');
                touristUI.ico_audio.attr('src','resources/images/icons/microphoneOn.png');
                unmuteAudio();
            }else{
                //mute audio
                touristUI.ico_audio.addClass('lightColor');
                touristUI.ico_audio.attr('src','resources/images/icons/microphoneOff.png');
                muteAudio();
            }
            touristUI.audioMuted = !touristUI.audioMuted;
        });

        touristUI.ico_video.click(function (e) {
            if (showLogs) console.log('tourist: video icon clicked, will mute: ' + !videoMuted);
            if(touristUI.videoMuted){
                //unmute video
                touristUI.ico_video.removeClass('lightColor');
                touristUI.ico_video.attr('src','resources/images/icons/videoOn.png');
                showVideoStream();
                startAudioStream();
            }else{
                //mute video
                touristUI.ico_video.addClass('lightColor');
                touristUI.ico_video.attr('src','resources/images/icons/videoOff.png');
                hideVideoStream();
            }
            touristUI.videoMuted = !touristUI.videoMuted;
        });

        $("#controlsBtn").on('click', function(e){
            if(showLogs) console.log('touristControlsBtn  button clicked');
            $('.navbar-collapse').collapse('hide');
            $("#videoControlsDialog").show(animDur);
        });

        $(".closeVideoControlsDialog").on('click', function(e){
            if(showLogs) console.log('guide close button clicked');
            $("#videoControlsDialog").hide(animDur);
        });

        $("#btn_gps_tourist").on('click', function(e){
            centerAndResize();
        });

        //Ok buttons of tourist alert
        $(".t_redirectHome").on('click', function(e){
            connectionClosed();
        });

        //closes the tourist's connection, the guide stays connected, tourist redirects home
        $("#hangUp, #hangUpCollapse").click(function (e) {
            if (showLogs) console.log('tourist: closing connection');
            sureWantLeaveDialog.show(animDur);
        });

        $("#leaveYes").on('click', function(e){
            closeConnection();
        });
        $("#leaveNo, #sureWantLeaveDialog_X").on('click', function(e){
            sureWantLeaveDialog.hide(animDur);
        });
    }

    function muteAudio(){
        connectionHelper.connection.attachStreams.forEach(function (stream) {
            if (stream.type == "local") {
                if (stream.id == audioStream) {
                    if (showLogs) console.log('tourist: muting audio stream');
                    stream.mute();
                }
            }
        });
    }

    function unmuteAudio(){
        connectionHelper.connection.attachStreams.forEach(function (stream) {
            if (stream.type == "local") {
                if (stream.id == audioStream) {
                    if (showLogs) console.log('tourist: unmuting audio stream');
                    stream.unmute();
                }
            }
        });
    }

    function hideVideoStream(){
        uiHelper.hideVideo();
        connectionHelper.sendHideVideo();
    }
    function showVideoStream(){
        uiHelper.showVideo();
        connectionHelper.sendShowVideo();
    }

    return {
        //variables
        loadBox: loadBox,
        content: content,
        ico_audio: ico_audio,
        ico_video: ico_video,
        sureWantLeaveDialog: sureWantLeaveDialog,
        audioMuted: audioMuted,
        videoMuted: videoMuted,
        animDur: animDur,
        //functions
        initTouristUI: initTouristUI,
        showTouristUI: showTouristUI,
        showLoadBox: showLoadBox,
        hideLoadBox: hideLoadBox,
        hideAudioVideoIcons: hideAudioVideoIcons,
        initTouristButtons: initTouristButtons,
        muteAudio: muteAudio,
        unmuteAudio: unmuteAudio,
        hideVideoStream: hideVideoStream,
        showVideoStream: showVideoStream
    };

})();