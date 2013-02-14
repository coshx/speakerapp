SpeakerApp = {
  init: function() {
    var app = this;
    app.time = 0;
    $(function() {
      app.initAudio();
      app.initPlayHandler();
    });
  },

  initAudio: function() {
    var app = this;
    app.audio_loaded = false;
    app.playing = false;
    app.skew = 0;
    app.skewCount = 0;
    app.latency = 0 ;
    app.latencyCount = 0 ;
    app.syncInterval = 30;


    app.server_offset =0;
    app.last_server_offset = 0;
    app.local_offset = 0 ;

    app.audio = new Audio();
    app.audio.preload = "auto";
    app.audio.loop = true;
    app.audio.src = "media/thirdday.mp3";

    $(app.audio).on("canplaythrough", function() {
      $("#play").removeClass("disabled");
      app.audio_loaded = true;
    });
  },

  initPlayHandler: function() {
    var app = this;
    $('#sync').on('click', function(e) {
      if(!$('#play').hasClass('disabled')){
        app.stop() ;
        app.play() ;
      }
      e.preventDefault();
    }) ;
    $('#play').on('click', function(e) {
      if (app.playing) {
        app.stop() ;
      } else if ($('#play').hasClass('disabled')) {
        // do nothing
      } else {
        app.play() ;
      }
      e.preventDefault();
    });
  },
  play:function(){
    var app = SpeakerApp;
    app.audio.volume = 0;
    app.playing = true;
    app.skewCount = app.skew = 0;
    $("#play").text("Pause");
    $("#sync").removeClass("disabled");
    app.audio.play();
    app.calculateSkew();
  },
  stop:function(){
    var app = SpeakerApp;
    app.audio.pause();
    $("#play").text("Play");
    $("#sync").addClass("disabled");
    app.playing = false;
  },
  measureLatency: function(){ //network + clock
    var app = SpeakerApp;
    app.latencyCount++ ;
    var runtime_offset = 2 ;
    var local_time1 = new Date().getTime() ;
    var server_time_response ;
    $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(data) {
        server_time_response = data["time"] ;}});
    var local_time2 = new Date().getTime() ;
    app.latency += local_time2 - local_time1 - runtime_offset ;
    if (app.latencyCount < 100) {
       app.calculateLatency();
    }else{
        console.log(app.latency/app.latencyCount ) ;
    }
  },
  serverTime:function(){
    var runtime_offset = 2 ;
    var local_time1 = new Date().getTime() ;
    var server_time_response ;
    $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(data) {
      server_time_response = data["time"] ;}});
    var local_time2 = new Date().getTime() ;
    var latency = local_time2 - local_time1 - runtime_offset ;
    var server_time = server_time_response + latency ;
    return server_time ;
  },
  clockSyncExample:function(){
    var app = SpeakerApp;
    var local_time1 = new Date().getTime() ;
    var server_time_response ;
      $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(data) {
         server_time_response = data["time"] ;}});
    var local_time2 = new Date().getTime() ;
    app.latency = local_time2 - local_time1;
    var runtime = local_time1 - server_time_response+app.latency
    var lag = app.latency+runtime-7
    var server_time = server_time_response+lag ;
    var server_offset  = server_time%1000 ;
    var server_offset_change = server_offset - app.last_server_offset

      if(server_offset > 500){
        if(server_offset_change > 0)
          local_offset = -10 ;
      }if(server_offset < 500){
        if(server_offset_change < 0)
          local_offset = 10 ;
      }
      app.last_server_offset = server_offset ;

      console.log(server_offset)   ;
      setTimeout(app.calculateSkew, 1000+local_offset);
  },
  calculateSkew: function() {
    var app = SpeakerApp;
    app.audio.volume = 0 ;


    app.clockSyncExample() ;

    return false ;

    var ms = (app.serverTime()) % (1000*60*60);
    var newTime = ((ms) % (app.audio.duration*1000)) / 1000.0;

    app.skew += newTime - app.audio.currentTime;

    if (app.skewCount % 20 == 0) {   //for some reason it seems to work better like this when reading from server
      app.skew = app.skew / 20;      // "
      app.audio.currentTime = app.audio.currentTime + app.skew;

      app.skew = 0;
    }

    if (app.skewCount == 20) {   //for some reason it seems to work better like this when reading from server
      app.skewCount = 0;
      app.audio.volume = 1;
    } else {
      setTimeout(app.calculateSkew, app.syncInterval);
    }
  }
};

SpeakerApp.init();
