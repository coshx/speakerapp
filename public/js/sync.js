var Sync = {
  guesses: 0,
  skew: 0,
  maxGuesses: 0,
  lastGuessTime: 0,
  skewError: 0,

  getSkew: function(maxGuesses) {
    Sync.maxGuesses = maxGuesses;
    Sync.guesses = 0;
    Sync.skew = 0;
    var currentTime = new Date().getTime() / 1000;

    // uniform distribution, avg. 100, ±25
    var initialRequestTime = 100+Math.random()*50-25;
    Sync.makeGuess({client: currentTime, requestTime: initialRequestTime});
  },

  makeGuess: function(currentGuess) {
    Sync.lastGuessTime = currentGuess.client;
    $.get("/guess", currentGuess, Sync.handleGuessResponse);
  },

  handleGuessResponse: function(serverResponse) {
    var currentTime = new Date().getTime() / 1000;
    var totRequestTime = currentTime - Sync.lastGuessTime;
    Sync.skew = Sync.skew + (serverResponse.skew/2);
    Sync.skewError = serverResponse.skew;

    var guess = {client: currentTime + Sync.skew, requestTime: totRequestTime/2};
    Sync.guesses++;

    if (Sync.guesses >= Sync.maxGuesses) {
      $("#skew").text("Skew: " + Sync.skew + ", Error: ±" + Sync.skewError);
    } else {
      Sync.makeGuess(guess);
    }
  }

};

$(function() {
  $("#calculateSkew").on("click", function(e) {
    Sync.getSkew($("#maxGuesses").val());
    e.preventDefault();
  });
});
