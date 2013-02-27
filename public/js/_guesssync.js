var GuessSync = {
  guesses: 0,
  clockSkew: 0,
  maxGuesses: 10,
  lastGuessTime: 0,
  skewError: 0,
  maxAllowedError:10,
  clockSkew: 0,

  init: function(){
    GuessSync.getSkew(GuessSync.maxGuesses);
  },
  getSkew: function(maxGuesses){
    var currentTime, initialRequestTime;
    currentTime = GuessSync.lastGuessTime = new Date().getTime();

    // uniform distribution, avg. 100, ±25
    initialRequestTime = 100+Math.random()*50-25;
    GuessSync.makeGuess({client: currentTime, requestTime: initialRequestTime});
  },
  makeGuess: function(currentGuess){
   $.ajax({ url:  "/guess", cache: false, data: currentGuess, dataType: 'json', async: false, success: function(serverResponse){
    var currentTime, totRequestTime, guess;
    currentTime = new Date().getTime();
    totRequestTime = currentTime - GuessSync.lastGuessTime;
    GuessSync.clockSkew = GuessSync.clockSkew + (0.63*serverResponse.clockSkew);
    GuessSync.skewError = serverResponse.clockSkew;

    GuessSync.lastGuessTime = currentTime;
    guess = {client: currentTime + GuessSync.clockSkew, requestTime: totRequestTime/2};
    GuessSync.guesses++;

    if (GuessSync.guesses >= GuessSync.maxGuesses){
      var error = Math.abs(GuessSync.skewError);

      if (error < GuessSync.maxAllowedError){
        GuessSync.clock_skew = GuessSync.clockSkew;
      }else{
        GuessSync.maxGuesses = GuessSync.maxGuesses + GuessSync.maxGuesses/10;
        GuessSync.getSkew(GuessSync.maxGuesses);
      }
    } else {
      GuessSync.makeGuess(guess);
    }
    }});

  }

}
