speakerMetrics = {
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
    app.latencyCount = 0 ;
    app.milliseconds_in_an_hour = 1000*60*60 ;
    app.log_string = "" ;
    app.skew_array = [] ;
    app.latency_array = [] ;

    $('#play').on('click', function(e) {
      var app = speakerMetrics;
      app.playing = true;
      app.audio.volume = 0 ;
      app.audio.play();
      app.loadAudio() ;
      $("#play").addClass("disabled");
    });
  },
  mean:function(array){
    var sum = 0 ;
    jQuery.each(array, function(i, val) {
      sum += val ;
    });
    return sum/array.length ;
  },
  stdev:function(array){
    var app = speakerMetrics;
    var diff ;
    var squared_difference_sum = 0 ;
    var mean = app.mean(array) ;
    jQuery.each(array, function(i, val) {
      diff = val - mean ;
      squared_difference_sum += diff*diff ;
    });
    return Math.sqrt(squared_difference_sum/(array.length-1)) ;
  },
  findMetrics: function(){
    var app = speakerMetrics;
    app.latencyCount++ ;
    app.begin_time = new Date().getTime() ;
    $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(data) {
      app.server_time_response = data["time"] ;
    }});
    app.local_time = new Date().getTime() ;
    app.latency = app.local_time - app.begin_time ;
    app.skew = app.local_time - app.server_time_response ;
    app.log_string += "total latency: "+app.latency+", "+"local_time - server_time: "+app.skew+"\n"

    app.skew_array.push(app.skew) ;
    app.latency_array.push(app.latency) ;

    if(app.latencyCount<=20){
     setTimeout(app.findMetrics, 100) ;
    }else{
     console.log(app.log_string) ;
     console.log("mean of local_time - server_time: "+app.mean(app.skew_array)) ;
     console.log("standard deviation of local_time - server_time: "+app.stdev(app.skew_array)) ;
     console.log("mean of total latency: "+app.mean(app.latency_array)) ;
     console.log("standard deviation of total latency: "+app.stdev(app.latency_array)) ;
    }
  },
  loadAudio: function() {
    var app = speakerMetrics;
    if(app.audio.currentTime==0){
       setTimeout(app.loadAudio, 500);
    }else{
     app.song_duration = app.audio.duration*1000 ;
     app.findMetrics() ;
    }
  }
};

speakerMetrics.init();
