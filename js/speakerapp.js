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
    app.audio.play();
    app.playing = true;
    app.skewCount = app.skew = 0;
    app.calculateSkew();
    $("#play").text("Pause");
    $("#sync").removeClass("disabled");
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
    $.ajax({ url:  "http://desolate-mesa-8298.herokuapp.com/", dataType: 'json', async: false, success: function(data) {
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
    $.ajax({ url:  "http://desolate-mesa-8298.herokuapp.com/", dataType: 'json', async: false, success: function(data) {
      server_time_response = data["time"] ;}});
    var local_time2 = new Date().getTime() ;
    var latency = local_time2 - local_time1 - runtime_offset ;
    var server_time = server_time_response + latency ;
    return server_time ;
  },
  calculateSkew: function() {
    var app = SpeakerApp;
    app.audio.volume = 0 ;
    app.skewCount++;

    var ms = (app.serverTime()) % (1000*60*60);
    var newTime = ((ms) % (app.audio.duration*1000)) / 1000.0;

    app.skew += newTime - app.audio.currentTime;

    if (app.skewCount % 1 == 0) {   //for some reason it seems to work better like this when reading from server
      app.skew = app.skew / 1;      // "
      app.audio.currentTime = app.audio.currentTime + app.skew;
      console.log("Skew is " + app.skew);
      app.skew = 0;
    }

    if (app.skewCount == 1) {   //for some reason it seems to work better like this when reading from server
      app.skewCount = 0;
      app.audio.volume = 1;
    } else {
      setTimeout(app.calculateSkew, app.syncInterval);
    }
  }
};

SpeakerApp.init();
