var FnordMetric = (function(){
 
  var canvasElem = false;

  var currentNamespace = false;
  var currentView = false;

  var sessionView = (function(){
    
    var listElem = $('<ul class="session_list"></ul>');
    var filterElem = $('<div class="events_sidebar"></div>');
    var feedInnerElem = $('<ul class="feed_inner"></div>');
    var feedElem = $('<div class="sessions_feed"></div>').html(
      $('<div class="headbar"></div>').html('Event Feed')
    ).append(feedInnerElem);
    var sideElem = $('<div class="sessions_sidebar"></div>').html(
      $('<div class="headbar"></div>').html('Active Users')
    ).append(listElem);
    

    var eventsPolledUntil = false;
    var sessionData = {};

    function load(elem){
      eventsPolledUntil = parseInt(new Date().getTime()/10000);
      elem.html('')
        .append(filterElem)
        .append(feedElem)
        .append(sideElem);
      startPoll();
    };

    function resize(_width, _height){
      $('.sessions_feed').width(_width-452);
    };

    function startPoll(){
      (doSessionPoll())();
      (doEventsPoll())();
      sessionView.session_poll = window.setInterval(doSessionPoll(), 1000);
    };

    function doSessionPoll(){
      return (function(){
        $.ajax({
          url: '/'+currentNamespace+'/sessions',
          success: callbackSessionPoll()
        });
      });
    }

    function callbackSessionPoll(){
      return (function(_data, _status){
        $.each(JSON.parse(_data).sessions, function(i,v){
          updateSession(v);  
        });
        sortSessions();
      });
    };


    function doEventsPoll(){
      return (function(){         
        $.ajax({
          url: '/'+currentNamespace+'/events?since='+eventsPolledUntil,
          success: callbackEventsPoll()
        });
      });
    };

    function callbackEventsPoll(){
      return (function(_data, _status){
        var data = JSON.parse(_data)
        var events = data.events;
        var timout = 1000;
        var maxevents = 200;
        if(events.length > 0){ 
          timeout = 1000; 
          eventsPolledUntil = parseInt(events[0]._time)-1;
        }
	for(var n=events.length-1; n >= 0; n--){
	  var v = events[n];
          if(parseInt(v._time)<=eventsPolledUntil){
            renderEvent(v);  
          }
        };
        var elems = $("p", feedInnerElem);
        for(var n=maxevents; n < elems.length; n++){
          $(elems[n]).remove();
        }
        window.setTimeout(doEventsPoll(), timout);
      });
    };

    function formatTimeSince(time){
      var now = new Date().getTime()/1000;
      var since = now - time;
      if(since < 60){
        return parseInt(since) + 's';
      } else if(since<3600){
        return parseInt(since/60) + 'm';
      } else if(since<(3600*24)){
        return parseInt(since/3600) + 'h';
      } else {
        return ">1d"
      }
    }

    function updateSession(session_data){
      sessionData[session_data.session_key] = session_data;
      renderSession(session_data);
    }

    function sortSessions(){
      console.log("fixme: sort and splice to 100");
    }

    function renderSession(session_data){

      var session_name = session_data["_name"];
      var session_time = formatTimeSince(session_data["_updated_at"]);
      var session_elem = $('li[data-session='+session_data["session_key"]+']:first');

      if(session_elem.length>0){

        if(session_data["_picture"] && (session_data["_picture"].length > 1)){
          $('.picture img', session_elem).attr('src', session_data["_picture"])
        }

        if(session_name){
          $('.name', session_elem).html(session_name);
        }
        
        $('.time', session_elem).html(session_time);

      } else {
        
        var session_picture = $('<img width="18" />');

        if(!session_name){ 
          session_name = session_data["session_key"].substr(0,15)
        };

        if(session_data["_picture"]){ 
          session_picture.attr('src', session_data["_picture"]);
        };
        
        listElem.append(
          $('<li class="session"></li>').append(
            $('<div class="picture"></div>').html(session_picture)
          ).append(
            $('<span class="name"></span>').html(session_name)
          ).append(
            $('<span class="time"></span>').html(session_time)
          ).attr('data-session', session_data["session_key"])
        );

      }
    };

    function renderEvent(event_data){
      var event_time = $('<span class="time"></span>');
      var event_message = $('<span class="message"></span>');
      var event_props = $('<span class="properties"></span>');
      var event_picture = $('<div class="picture"></picture>');

      if(event_data._session_key && event_data._session_key.length > 0){
        if(session_data=sessionData[event_data._session_key]){
          if(session_data._name){            
            event_props.append(
              $('<strong></strong>').html(session_data._name)
            );
          }
          if(session_data._picture){ 
            event_picture.append(
              $('<img width="40" />').attr('src', session_data._picture)
            )
          }
        }
      }

      if(event_data._type=="_pageview"){
        event_message.html("Pageview: " + event_data.url);
      } else {
        event_message.html(event_data._type);
      }

      event_time.html(formatTimeSince(event_data._time));

      feedInnerElem.prepend(
        $('<li class="feed_event"></li>')
        .append(event_time)
        .append(event_picture)
        .append(event_message)
        .append(event_props)
      );
    }

    function close(){
      
    };

    return {
      load: load,
      resize: resize,
      close: close
    };

  })();
  
  function loadView(_view){
    if(currentView){ currentView.close(); }
    canvasElem.html('loading!');
    currentView = _view;
    currentView.load(canvasElem);
    resizeView();
  };

  function resizeView(){
    currentView.resize(
      canvasElem.innerWidth(), 
      canvasElem.innerHeight()
    );
  }

  function init(_namespace, _canvasElem){
    canvasElem = _canvasElem;
    currentNamespace = _namespace;
    loadView(sessionView);
  };

  return {
    p: '/fnordmetric/',  
    loadView: loadView,
    resizeView: resizeView,
    init: init
  };

})();
