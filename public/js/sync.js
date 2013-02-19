var Sync = {
  guesses: 0,
  skew: 0,
  maxGuesses: 0,
  lastGuessTime: 0,
  skewError: 0,
  maxAllowedError: 15,

  getSkew: function(maxGuesses) {
    var currentTime, initialRequestTime;
    currentTime = Sync.lastGuessTime = new Date().getTime();
    Sync.maxGuesses = maxGuesses;
    Sync.guesses = 0;
    Sync.skew = 0;

    // uniform distribution, avg. 100, ±25
    initialRequestTime = 100+Math.random()*50-25;
    Sync.makeGuess({client: currentTime, requestTime: initialRequestTime});
  },

  makeGuess: function(currentGuess) {
    $.get("/guess", currentGuess, Sync.handleGuessResponse);
  },

  handleGuessResponse: function(serverResponse) {
    var currentTime, totRequestTime, guess;
    currentTime = new Date().getTime();
    totRequestTime = currentTime - Sync.lastGuessTime;
    Sync.skew = Sync.skew + (0.63*serverResponse.skew);
    Sync.skewError = serverResponse.skew;

    Sync.lastGuessTime = currentTime;
    guess = {client: currentTime + Sync.skew, requestTime: totRequestTime/2};
    Sync.guesses++;

    if (Sync.guesses >= Sync.maxGuesses) {
      $("#skew").text("Skew: " + Sync.skew + ", Error: ±" + Sync.skewError);
      console.log("Est. Server Time: " + (new Date().getTime() + Sync.skew));
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
  duration: 222000, // hardcode since seeing 300ms diff btw browsers
  audio: null,

  play: function() {
    $("#play").text("Loading...");

    if (Play.audio == null) {
      Play.audio = new Audio();
      Play.audio.src = Play.src;
      Play.audio.play();
      setTimeout(function() {
        Play.audio.pause();
      }, 1);
    }

    if (Play.audio.readyState !== 4) { // HAVE_ENOUGH_DATA
      console.log("waiting for enough data...");
      setTimeout(Play.play, 500);
      return;
    }

    $("#play").text("Playing...");
    $("#pause").text("Pause");

    var currentServerTime;
    currentServerTime = new Date().getTime() + Sync.skew;
    var currentSongTime;
    currentSongTime = (currentServerTime % Play.duration) / 1000;

    Play.audio.play();

    console.log("Current server time is: " + currentServerTime);
    console.log("Setting currentTime to " + currentSongTime);
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
