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
    //app.clockSyncExample() ;
    app.calculateSkew();
  },
  stop:function(){
    var app = SpeakerApp;
    app.audio.pause();
    $("#play").text("Play");
    $("#sync").addClass("disabled");
    app.playing = false;
  },
  serverTime:function(){
    var app = SpeakerApp;
    var local_time1 = new Date().getTime() ;
    var server_time_response ;
    $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(data) {
      server_time_response = data["time"] ;}});
    return 2*server_time_response - local_time1 ;
  },
  calculateSkew: function() {
    var app = SpeakerApp;
    app.skewCount++ ;

    var ms = (app.serverTime()) % (1000*60*60);
    var newTime = ((ms) % (app.audio.duration*1000)) / 1000.0;

    app.skew += newTime - app.audio.currentTime;

    if (app.skewCount % 10 == 0) {
      app.skew = app.skew / 10;
      console.log(app.skew) ;
      app.audio.currentTime = app.audio.currentTime + app.skew;
      app.skew = 0;
    }

    if (app.skewCount == 30) {
      app.skewCount = 0;
      app.audio.volume = 1;
    } else {
      setTimeout(app.calculateSkew, app.syncInterval);
    }
  }
};

SpeakerApp.init();
