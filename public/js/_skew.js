
var Sync = {
  guesses: 0,
  skew: 0,
  maxGuesses: 10,
  lastGuessTime: 0,
  skewError: 0,

  init: function() {
    var app = this;
    $(function() {
        Sync.getSkew(Sync.maxGuesses) ;
    }) ;
  },
  getSkew: function(maxGuesses) {
    var currentTime, initialRequestTime;
    currentTime = Sync.lastGuessTime = new Date().getTime() ;
    Sync.maxGuesses = maxGuesses;
    Sync.guesses = 0;
    Sync.skew = 0;

    // uniform distribution, avg. 100, ±25
    initialRequestTime = 100+Math.random()*50-25;
    Sync.makeGuess({client: currentTime, requestTime: initialRequestTime}) ;
  },

  makeGuess: function(currentGuess) {
    $.get("/guess", currentGuess, Sync.handleGuessResponse) ;
  },
  errorContext:function(error) {
    var context = "";
    if(error<=Sync.preferredError)
      context = "(Excellent)";
    else if(error<=Sync.maxAllowedError)
      context = "(Good)";
    else
      context = "(bad)";
    return context ;
  },
  handleGuessResponse: function(serverResponse) {
    var currentTime, totRequestTime, guess;
    currentTime = new Date().getTime() ;
    totRequestTime = currentTime - Sync.lastGuessTime;
    Sync.skew = Sync.skew + (0.63*serverResponse.skew) ;
    Sync.skewError = serverResponse.skew;

    Sync.lastGuessTime = currentTime;
    guess = {client: currentTime + Sync.skew, requestTime: totRequestTime/2};
    Sync.guesses++;

    if (Sync.guesses >= Sync.maxGuesses) {
      var error = Math.abs(Sync.skewError) ;
      var context = Sync.errorContext(error) ;
      $("#skew").text("Skew: " + Sync.skew) ;
      $("#error").text("Error: ±" + Sync.skewError+" "+context) ;

      if (error < Sync.maxAllowedError) {
        $("#play").removeClass("disabled") ;
        $("#play").text("Subscribe") ;
      }else{
        Sync.maxGuesses = Sync.maxGuesses + Sync.maxGuesses/10;
        Sync.getSkew(Sync.maxGuesses) ;
      }
    } else {
      Sync.makeGuess(guess) ;
    }
  }
};

Sync.init() ;