var Sync = {
  guesses: 0,
  skew: 0,
  maxGuesses: 10,
  lastGuessTime: 0,
  skewError: 0,
  maxAllowedError: 15,
  preferredError: 5,

  init: function() {
    var app = this;
    $(function() {
        Sync.getSkew(Sync.maxGuesses);
    });
  },
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
  errorContext:function(error){
    var context = ""  ;
    if(error<=Sync.preferredError)
      context = "(Excellent)"  ;
    else if(error<=Sync.maxAllowedError)
      context = "(Good)"  ;
    else
      context = "(bad)" ;
    return context ;
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

      var error = Math.abs(Sync.skewError) ;
      var context = Sync.errorContext(error) ;
      $("#skew").text("Skew: " + Sync.skew) ;
      $("#error").text("Error: ±" + Sync.skewError+" "+context);

      if (error < Sync.maxAllowedError) {
        $("#play").removeClass("disabled");
        $("#play").text("Subscribe");
      }else{
        Sync.maxGuesses = Sync.maxGuesses + Sync.maxGuesses/10 ;
        Sync.getSkew(Sync.maxGuesses);
      }
    } else {
      Sync.makeGuess(guess);
    }
  }
};

var Play = {
  title: "",
  src: null,
  start_at: null,
  duration: 0,
  audio: null,

  fetchSrcData: function(){
    console.log('fetchSrcData') ;
    $.get("/song_info", Play.handleFetchSrcResponse);
  },
  handleFetchSrcResponse: function(serverResponse){
    console.log('handleFetchSrcResponse')
    Play.title = serverResponse.title  ;
    Play.src = serverResponse.url  ;
    Play.start_at = serverResponse.start_at  ;
    Play.duration = serverResponse.duration  ;
    Play.play() ;
  },
  play: function() {

    if(Play.src==null){
      Play.src = Play.fetchSrcData() ;
      return ;
    }
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

    $("#play").text("Playing "+Play.title);
    $("#pause").text("Pause");

    var currentServerTime ;
    currentServerTime = new Date().getTime() + Sync.skew;
    var currentSongTime ;
    currentSongTime = ((currentServerTime - Play.start_at) % Play.duration)/1000 ;                                            //(currentServerTime % Play.duration) ;

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


Sync.init();

