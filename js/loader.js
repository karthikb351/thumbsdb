function fetchVideos($scope) {
    var requestParams= {
        part: 'snippet',
        maxResults: '50',
        pageToken: '',
        playlistId: $scope.idlethumbsPlaylistId
    }
    executeRequest(requestParams, $scope)
}

function executeRequest(requestParams, $scope)  {
    var request = gapi.client.youtube.playlistItems.list(requestParams);
    console.log("Requesting list of next 50 videos");
    request.execute(function(response) {
        //console.log(response);
        console.log("Processing...");
        for (var i = 0; i < response.items.length; i++) {
            var video = parseThumbsVideoDescription(response.items[i], $scope);
            if (video != false) {           
                $scope.videos.push(video);
                $scope.$apply()
            }
        }
        
        if (response.hasOwnProperty('nextPageToken')) {
            requestParams.pageToken = response.nextPageToken;
            executeRequest(requestParams, $scope);
        }
        else {
            //finished getting all videos
            console.log("Completed requesting videos");
            requestComplete($scope);
        }
    });
}

function requestComplete($scope) {
    $scope.fetchingVideos=false;
    var videosRange = topicsInDate($scope.fromDate, $scope.toDate, $scope);
    $scope.topics=processVideosData(videosRange);
    $scope.$apply()
}

function topicsInDate(startDate, endDate, $scope) {
    
    var vs = [];
    for (var i = 0, vl = $scope.videos.length; i < vl; i ++) {
        var vidDate = $scope.videos[i].date;
        if (vidDate > startDate && vidDate < endDate) {
            vs.push($scope.videos[i]);
        }
    }
    return vs;
}


function processVideosData(videosRange) {
    //console.log(videosRange);
    console.log("Processing videos data...");
    
    var topics = [];
    
    //for each video
    for (var i = 0, vl = videosRange.length; i < vl; i++) {
        //for each time code
        for (var ii = 0, vtcl = videosRange[i].tc.length; ii < vtcl; ii++) {
        
            var tc = videosRange[i].tc[ii];
            var topicPos = -1;
            //check list of topics to see if topic is already there.
            for (var iii = 0, tl = topics.length; iii < tl; iii++) {
                if (topics[iii].topic.toLowerCase() == tc.topic.toLowerCase()) {
                    topicPos = iii;
                }
            }
            
            var videoId = videosRange[i].videoId;
            
            //TODO check for errors here ??
            var summary = {
                        type: tc.type,
                        summary: tc.summary,
                        duration: tc.duration,
                        time: tc.time,
                        episode: videosRange[i].episode,
                        videoId: videoId
                    };
            
            if (topicPos < 0) {
                
                //console.log("New Topic: " + tc.topic);
            
                var td = {
                    topic: tc.topic,
                    totalDuration: tc.duration,
                    summaries: [summary]
                }
                
                topics.push(td);
            }
            else {
                //console.log("Adding summary: " + topics[topicPos].topic);
                topics[topicPos].totalDuration += tc.duration;
                topics[topicPos].summaries.push(summary);
            }
        }
    }    
    return topics;
    
}

function parseThumbsVideoDescription(response, $scope) {    
    var video = {tc:[], hosts:[]};
    var processLine = 0;
    
    //Check is episode
    if (response.snippet.title.match(/Idle Thumbs \d/) == null) {
        //console.log("Not an episode: " + response.snippet.title);
        return false;
    }
    
    //populate video data
    var titleStr = response.snippet.title.split(" - ");
    video.episode = parseInt(titleStr[0].substring(12));
    video.title = titleStr[1];
    video.videoId = response.snippet.resourceId.videoId;

    var rawData = response.snippet.description.split("\n");
    if (rawData.length < 3) {
        return video;
    }

    //console.log(rawData);
    
    video.desc = rawData[processLine];
    for (var i = 0; i < $scope.hosts.length; i++) {
        var h = video.desc.search($scope.hosts[i]);
        if (h >= 0 && video.hosts.indexOf($scope.hosts[i]) == -1) {
            video.hosts.push($scope.hosts[i]);
        }
    }
    
    processLine += 2;
        
    //Support for "Originally aired " video description version over Youtube PublishedAt Date
    if (rawData[processLine].search("Originally aired ") >= 0) {
        video.date = new Date(rawData[2].slice(17));
        processLine += 2;
    }
    else {
        //TODO Get date from Idle Thumbs website
        video.date = new Date(response.snippet.publishedAt);
    }
    
        
    //Define timecode splits
    var tcStr = " — ";
    var tcTopicStr = " - ";
    
    video.tc.push({time: 0, topic: "Podcast beginning", duration: 0, type: "remove"});
    
    for (var i = processLine; i < rawData.length; i++) {
        
        if (rawData[i].search(tcStr) > 0) {
            
            var tc = rawData[i].split(tcStr);
                        
            //support for ep 169 timecode (has ; instead of :)
            tc[0] = tc[0].replace(";", ":");
            
            //Convert times to total seconds
            var tcTimes = tc[0].split(":");
                       
            var tcSeconds = parseInt(tcTimes[tcTimes.length-1]);
                        
            if (tcSeconds < 0) {
                console.warn("Bad timecode - Ep " + video.episode + " | " + rawData[i]);
            }
            
            tcSeconds += parseInt(tcTimes[tcTimes.length-2]) * 60;
            
            if (tcTimes.length == 3) {
                tcSeconds += parseInt(tcTimes[0]) * 3600; 
            }
            
            //TODO Sometimes fails because string is "- "
            var tcData = {
                time: tcSeconds,
                duration: 0
            };
            
            // if tc.length == 3 then — has been used instead of -
            if (tc.length == 2) {
                var tcTopic = tc[1].split(tcTopicStr);
            }
            else if (tc.length == 3) {
                var tcTopic = [tc[1],tc[2]];
            }
            
            if (tcTopic[0] == "Reader Mail") {
                tcData.type = "Reader Mail";
                tcData.topic = tcTopic[1];
                tcTopic.shift();
                tcTopic.shift();
                tcData.summary = tcTopic.toString();
            }
            else {
                tcData.type = "Standard";
                tcData.topic = tcTopic[0];
                tcTopic.shift();
                tcData.summary = tcTopic.toString();
            }
            
            tcData.topic.trim();
            tcData.summary.trim();
                        
            //Compare with previous item to get duration for previous item.
            var duration = tcSeconds - video.tc[video.tc.length-1].time;
            
            if (duration < 0) {
                console.warn("Bad timecode: is less than previous timecode - Ep " + video.episode + " | " + rawData[i]);
                duration = 0;
            }
            
            video.tc[video.tc.length-1].duration = duration;
            
            
            video.tc.push(tcData);
        }
    }
    
    /*TODO Get video length
    //get duration from length of video.
    var videoLength = response.contentDetails.duration;
    var sPos = videoLength.indexOf("S");
    var mPos = videoLength.indexOf("M");
    var hPos = videoLength.indexOf("H");
    var ptPos = videoLength.indexOf("T");
    
    var s, m, h = 0;
    
    s = parseInt(videoLength.substring(mPos + 1, sPos));
    
    if (hPos > 0) {
        m = parseInt(videoLength.substring(hPos + 1, mPos));
        h = parseInt(videoLength.substring(ptPos + 1, hPos));
    }
    else {
        m = parseInt(videoLength.substring(ptPos + 1, mPos));
    }
    
    var vL = s + (m * 60) + (h * 3600);
    
    video.tc[video.tc.length-1].duration = vL - video.tc[video.tc.length-1].time;
    
    video.tc.push({time: vL, topic: "End"});
    */
    //console.log(video);
    return video;
    
}