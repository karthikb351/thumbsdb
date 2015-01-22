/*************************
*Created by Joel Schroyen 
*with help from
*Karthik Balakrishnan
*
*30/12/2014
**************************/



var app = angular.module('tdb-app', []);



app.controller('mController',['$scope', '$window', function($scope, $window) {

    $scope.hosts = ["Chris", "Jake", "Sean", "Danielle", "Nick", "Steve", "Patrick"];
    $scope.idlethumbsPlaylistId = 'UUe1HeEEIHtXIqkGn0Bu0wRg';
    $scope.videos = [];
    $scope.results = [];
    $scope.fetchingVideos = true;

    $scope.fromDate = new Date(2014,1,1);
    $scope.toDate = new Date(2015,1,1);

    $scope.activeTopic;

    $scope.getTopics = function() {
        console.log("filtering");
        var videosRange = topicsInDate($scope.fromDate, $scope.toDate, $scope);
        $scope.topics=processVideosData(videosRange);
    }

    $scope.prettyTime = function(a,c,e){d=60;s=[" s"," m"," h"]; return t=[a,(0|a/d)*d,(0|a/d/d)*d*d].map(function(a,b,f){p=(a-(0|f[b+1]))/Math.pow(d,b);return e&&1>b?"":c&&!p?"":p+s[b]+". "}).reverse().join("")};

    var nextVideo = function() {
        if($scope.playStack.length) {
            summary = $scope.playStack.pop();
            $scope.activeSummary = summary;
            params = {
                videoId: summary.videoId,
                startSeconds: summary.time,
                endSeconds: (summary.time + summary.duration)
            }
            console.log("loading params");
            console.log(params);
            player.loadVideoById(params);
        }  
    }

    $scope.playSummaries = function(topic) {
        console.log("playSummaries");
        console.log(topic)
            if(ready) {
                $scope.activeTopic = topic;
                $scope.playStack = [];
                for(var i = 0; i< topic.summaries.length ; i++)
                    $scope.playStack.push(topic.summaries[i]);
                player.addEventListener('onStateChange', playStateChange);
                nextVideo($scope);
            }
        }

    var playStateChange = function(newState) {
        if(newState.data === YT.PlayerState.ENDED)
        {
            console.log("Next Video");
            nextVideo();
        }
    }

    $window.initGapi = function() {
        fetchVideos($scope);
    }

}]);

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
var ready = false;
function onYouTubeIframeAPIReady() {
player = new YT.Player('tdb-player', {
  height: '250px',
  width: '370px',
  events: {
    'onReady': onPlayerReady
  }
});
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    ready = true;
}

function onPlayerStateChange(newState) {
    window.playStateChange(newState);
}


function init() {
    var apiKey = 'AIzaSyDLMAhvP1smHaSJ_iwjLEEgXqqNhhQkVok';
    gapi.client.setApiKey(apiKey);      
    gapi.client.load('youtube', 'v3').then(function() { 
        console.log('youtube api loaded.'); 
        window.initGapi();
    });
    
}
