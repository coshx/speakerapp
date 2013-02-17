App = {
  init: function() {
    var app = this;
    $(function() {
      app.initAudio();
    });
  },

  initAudio: function() {
    var app = this;
    app.audio = new Audio();
    app.audio.volume = 0;
    app.audio.loop = false ;
    app.audio.src = "media/rainbow.mp3";

    app.offset = 0;
    app.syncInterval = 30;
    app.latencyCount = 0 ;
    app.milliseconds_in_a_year = 1000*60*60 ;
    app.lag = 0 ;
    app.logging = "" ;

    $('#play').on('click', function(e) {
      var app = App;
      app.playing = true;
      app.audio.volume = 0 ;
      app.audio.play();
      app.sync() ;
      $("#play").addClass("disabled");
    });
  },
  clockSkew: function(){
    var app = App;
    app.latencyCount++ ;
    app.begin_time = new Date().getTime() ;
    $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(data) {
      app.server_time_response = data["time"] ;
    }});
    app.local_time = new Date().getTime() ;
    app.lag = (app.local_time - app.begin_time);
    app.skew = app.local_time - app.server_time_response ;
    app.logging += "total latency: "+app.lag+", "+"local_time - server_time: "+app.skew+"\n"

    if(app.latencyCount<=20){
     setTimeout(app.clockSkew,100) ;
    }else{
     console.log(app.logging) ;
    }
  },
  sync: function() {
    var app = App;
    if(app.audio.currentTime==0)
     setTimeout(app.sync, 500);
    else{
     app.song_duration = app.audio.duration*1000 ;
     app.clockSkew() ;
    }
  }
};

App.init();
