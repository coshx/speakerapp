var Sync = {
  guesses: 0,
  skew: 0,
  maxGuesses: 0,
  lastGuessTime: 0,
  skewError: 0,
  maxAllowedError: 15,

  getSkew: function(maxGuesses) {
    Sync.maxGuesses = maxGuesses;
    Sync.guesses = 0;
    Sync.skew = 0;
    var currentTime = new Date().getTime();

    // uniform distribution, avg. 100, ±25
    var initialRequestTime = 100+Math.random()*50-25;
    Sync.makeGuess({client: currentTime, requestTime: initialRequestTime});
  },

  makeGuess: function(currentGuess) {
    Sync.lastGuessTime = currentGuess.client;
    $.get("/guess", currentGuess, Sync.handleGuessResponse);
  },

  handleGuessResponse: function(serverResponse) {
    var currentTime = new Date().getTime();
    var totRequestTime = currentTime - Sync.lastGuessTime;
    Sync.skew = Sync.skew + (serverResponse.skew/2);
    Sync.skewError = serverResponse.skew;

    var guess = {client: currentTime + Sync.skew, requestTime: totRequestTime/2};
    Sync.guesses++;

    if (Sync.guesses >= Sync.maxGuesses) {
      $("#skew").text("Skew: " + Sync.skew + ", Error: ±" + Sync.skewError);
      if (Math.abs(Sync.skewError) < Sync.maxAllowedError) {
        $("#play").removeClass("disabled");
      }
    } else {
      Sync.makeGuess(guess);
    }
  }
};


var Play = {
  src: "media/rainbow.mp3",
  audio: null,

  play: function() {
    $("#play").text("Loading...");

    if (Play.audio == null) {
      Play.audio = new Audio();
      Play.audio.src = Play.src;
      Play.audio.play();
    }

    if (Play.audio.currentTime == 0) {
      setTimeout(Play.play, 100);
      return;
    }

    $("#play").text("Playing...");
    $("#pause").text("Pause");

    var duration = Play.audio.duration * 1000;
    var currentTime = new Date().getTime();
    var currentSongTime = (currentTime % duration + Sync.skew) / 1000;

    Play.audio.currentTime = currentSongTime;
  },

  pause: function() {
    if (Play.audio != null) {
      Play.audio.pause();
      Play.audio = null;
    }
  }
};

$(function() {
  $("#calculateSkew").on("click", function(e) {
    Sync.getSkew($("#maxGuesses").val());
    e.preventDefault();
  });

  $("#play").on("click", function(e) {
    e.preventDefault();
    if ($("#play").hasClass("disabled")) {
      return;
    }

    Play.play();
    $("#play").addClass("disabled");
    $("#play").text("loading...");
  });

  $("#pause").on("click", function(e) {
    e.preventDefault();
    Play.pause();
    $("#pause").text("");
    $("#play").text("Play");
    $("#play").removeClass("disabled");
  });
});
