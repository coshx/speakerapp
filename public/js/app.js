App = {
  init: function() {
    var app = this;
    $(function() {
      app.initAudio();
    });
  },

  initAudio: function() {
    var app = this;
    app.offset = 0;
    app.skewCount = 0;
    app.syncInterval = 30;
    app.audio = new Audio();
    app.audio.volume = 0;
    app.audio.loop = true;



    $('#play').on('click', function(e) {
       var app = App;
       app.playing = true;
       app.skewCount = app.offset = 0;
       app.audio.src = "media/rainbow.mp3";
       app.audio.volume = 0 ;
       app.audio.play();
       app.calculateSkew();
       $("#play").addClass("disabled");
    });
  },
  serverTime:function(){
    var app = App;
    var local_time = new Date().getTime() ;
    var server_time_response ;
    $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(data) {
      server_time_response = data["time"] ;
    }});
    return 2*server_time_response - local_time ;  //real server time estimate
  },
  calculateSkew: function() {

    var app = App;
    app.skewCount++ ;

    local_time = new Date().getTime() ;
    server_time = app.serverTime() ;

    app.time_offset += local_time - server_time ;

    if (app.skewCount == 10) {
      app.time_offset = 0;
    }

    if(app.skewCount < 110) {
      setTimeout(app.calculateSkew, app.syncInterval);
    } else {
      app.time_offset /= 100 ;

      var ms = (server_time) % (1000*60*60);
      var newTime = ((ms) % (app.audio.duration*1000)) / 1000.0;

      app.audio.currentTime = newTime ;
      app.skewCount = 0;
      app.audio.volume = 1;
    }
  }
};

App.init();
