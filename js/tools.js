function updateProgressBar(value) {
    var progressSoFar = $( "#progressbar" ).progressbar( "value" );
    $( "#progressbar" ).progressbar( "value", progressSoFar + value );
}

function initPageWidgets() {
    $( "#progressbar" ).progressbar();
    $( "#spinner" ).spinner();
    $( "#spinner" ).spinner( "value", 50 );
    $( "#topics" ).accordion({
        collapsible: true,
        heightStyle: "content",
        active: 0
    });
     $(function() {
        $( "#radio" ).buttonset();
    });
     $(function() {
        $( "#startbutton" )
            .button()
            .click(function( event ) {
                go();
        });
    });
    $(function() {
        $( "#datepickerfrom, #datepickerto" ).datepicker({ 
            changeMonth: true,
            changeYear: true,
        });
    });
    
    
    $( "#datepickerfrom" ).datepicker("setDate", "01/01/2014");
    $( "#datepickerto" ).datepicker("setDate", "12/31/2014");
}

function renderTopics(topics) {
    var html = "";
    var maxResults = $( "#spinner" ).spinner( "value" );
    maxResults = Math.min(maxResults, topics.length);
    var num = 0;
    for (var i = 0; i < maxResults; i++ ) {
        if (topics[i].summaries[0].type == "remove") {
            continue;
        }
        num ++;
        html += "<h3>" + (num) + ": <b>" + topics[i].topic + "</b> <i>" + renderTime(topics[i].totalDuration) + " minutes</i>" + "</h3>";
        html += "<div>";
        html += "<ul id='summaries'>";
        for (var ii = 0; ii < topics[i].summaries.length; ii++) {
            html += "<li><a href=\""
            + topics[i].summaries[ii].videoId
            + "\">Ep "
            + topics[i].summaries[ii].episode 
            + "</a> : \"";
            if (topics[i].summaries[ii].summary) {
                html += topics[i].summaries[ii].summary;
            }
            html += "\" <i>"
            + topics[i].summaries[ii].duration
            + "s</i>"
            + "</li>";
        }
        html += "</ul>";
        html += "</div>";
    }
    $( "#topics" ).html(html);
    $( "#topics" ).accordion( "refresh" );
    $( "#topics" ).accordion( "option", "active", "0" );
}

function renderTime(seconds) {
    var minutes = seconds / 60 ;
    var time = minutes.toFixed(2);
    return time;
}
