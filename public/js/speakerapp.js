speakerApp = {
  init: function() {
    var app = this;
    $(function() {
      app.initAudio();
    });
  },
  initAudio: function() {
    var app = speakerApp;
    app.audio = new Audio();
    app.audio.volume = 0;
    app.audio.src = "media/rainbow.mp3";
    app.syncInterval = 2000;
    app.milliseconds_in_a_year = 1000*60*60 ;

    $('#play').on('click', function(e) {
      var app = speakerApp;
      app.audio.volume = 0 ;
      app.audio.play();
      app.calculateSkew() ;
      $("#play").addClass("disabled");
    });
  },
  serverLog:function(lag, skew){
    var app = speakerApp;
    $.ajax({
      type: "POST",
      url: "/post_start_time",
      data: {latency: lag, skew: skew},
      dataType:  'json'
    });
  },
  skewSeek:function(){
    var app = speakerApp;
    app.begin_time = new Date().getTime() ;
    $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(data) {
      app.server_time_response = data["time"] ;
    }});
    app.audio.currentTime  = ((app.server_time_response % app.milliseconds_in_a_year) % app.song_duration) * 0.001 ;
    app.audio.volume = 1 ;
    app.time = new Date().getTime() ;
    app.skew = app.time - app.server_time_response ;
    app.lag = app.time - app.begin_time ;
    app.serverLog(app.lag, app.skew) ;
    console.log("latency: "+app.lag+", skew: "+app.skew) ;
    setTimeout(app.skewSeek,app.syncInterval) ;
  },
  calculateSkew: function() {
    var app = speakerApp;
    if(app.audio.currentTime==0){ //(fix for mobile safari block on pre-loading - 'waits til it starts playing')
     setTimeout(app.calculateSkew, 500);
    }else{
     app.song_duration = app.audio.duration*1000 ;
     app.skewSeek() ;
    }
  }
};

speakerApp.init();
