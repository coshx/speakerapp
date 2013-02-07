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
    app.recalculateSkew = true;
    app.syncInterval = 30;

    app.audio = new Audio();
    app.audio.preload = "auto";
    app.audio.loop = true;
    app.audio.src = "media/night-is-young.mp3";

    $(app.audio).on("canplaythrough", function() {
      $("#play").removeClass("disabled");
      app.audio_loaded = true;
    });
  },

  initPlayHandler: function() {
    var app = this;
    $('#play').on('click', function(e) {
      if (app.playing) {
        app.audio.pause();
        $("#play").text("Play");
        app.playing = false;
      } else if ($('#play').hasClass('disabled')) {
        // do nothing
      } else {
        app.audio.volume = 0;
        app.audio.play();
        app.playing = true;
        app.skewCount = app.skew = 0;
        app.calculateSkew();
        $("#play").text("Pause");
      }
      e.preventDefault();
    });
  },

  calculateSkew: function() {
    var app = SpeakerApp;
    app.recalculateSkew = false;
    app.recalculatingSkew = true;

    app.audio.volume = 0;
    app.skewCount++;

    // for now, using ms offset into current hour for syncing song
    var ms = new Date().getTime() % (1000*60*60);
    var newTime = (ms % (app.audio.duration*1000)) / 1000.0;
    app.skew += newTime - app.audio.currentTime;

    if (app.skewCount > 10) {
      app.skew = app.skew / app.skewCount;
      app.skewCount = 0;
      app.recalculatingSkew = false;
      app.audio.currentTime = app.audio.currentTime + app.skew;
      app.audio.volume = 1;
      console.log("Skew is " + app.skew);
    } else {
      setTimeout(app.calculateSkew, app.syncInterval);
    }
  }

};

SpeakerApp.init();
