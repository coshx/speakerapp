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

var Play = {
  title: null,
  url: null,
  start_at: null,
  duration: 0,
  audio: null,
  count:0,

  fetchAudioData: function() {
    $.get("/song_info", function(serverResponse) {
      Play.title = serverResponse.title;
      Play.url = serverResponse.url;
      Play.start_at = serverResponse.start_at;
      Play.duration = serverResponse.duration;
      if(Play.url=="")
        console.log("no feed...") ;
    }) ;
  },
  play: function() {
    $("#play").text("Loading...") ;

    if(Play.url==null) {
     Play.fetchAudioData() ;
     setTimeout(Play.play, 500) ;
     return ;
    }

    if (Play.audio == null) {
      Play.audio = new Audio() ;
      Play.audio.src = Play.url;
      Play.audio.play() ;
      setTimeout(function() {
      }, 1) ;
    }
    if (Play.audio.readyState !== 4) { // HAVE_ENOUGH_DATA
      console.log("waiting for enough data...") ;
      $("#play").text("Loading... ") ;
      setTimeout(Play.play, 500) ;
      return;
    }
    $("#play").text("Playing "+Play.title) ;
    $("#pause").text("Stop") ;
    $("#pause").removeClass("disabled") ;

    var currentServerTime;
    var currentSongTime;

    currentServerTime = new Date().getTime() + Sync.skew;
    currentSongTime = ((currentServerTime - Play.start_at) % Play.duration)/1000;
    Play.audio.currentTime = currentSongTime ;

    player_lag = Math.abs(currentSongTime - Play.audio.currentTime) ;
    Play.count++ ;
    if(Play.count<5 && player_lag>0) {
       setTimeout(Play.play,1000) ;
    }
    console.log("Player lag: "+(currentSongTime - Play.audio.currentTime)) ;
    console.log("Current server time is: " + currentServerTime) ;
    console.log("Setting currentTime to " + currentSongTime) ;
  },
  pause: function() {
    if (Play.audio != null) {
      $("#pause").text("") ;
      $("#play").text("Subscribe")
      $("#play").removeClass("disabled") ;
      Play.audio.pause() ;
      Play.url = null;
      Play.audio = null;
    }
  }
};

PlayList = {
  songs: [
   {title:"Rainbow",url: "http://speakerapp.herokuapp.com/media/rainbow.mp3", duration:222000},
   {title:"Thirdday",url: "http://speakerapp.herokuapp.com/media/thirdday.mp3", duration:210000}
  ],
  init: function() {
    $(function() {
      $.each(PlayList.songs, function(index, song) {
        $("#song_list option[id='"+index+"']").text(PlayList.songs[index].title) ;
        $("#song_list option[id='"+index+"']").val(index) ;
      }) ;

      $("#song_list").on("change", function(e) {
        e.preventDefault() ;
        var selected_index = $('#song_list :selected').val() ;
        $.post('/song_info', PlayList.songs[selected_index]) ;
        Play.pause() ;
        $("#play").text("Broadcast") ;
      }) ;

      $("#play").on("click", function(e) {
        e.preventDefault() ;
        if ($("#play").hasClass("disabled")) {
        return;
        }
        Play.play() ;
        $("#play").addClass("disabled") ;
        $("#play").text("loading...") ;
      }) ;

      $("#pause").on("click", function(e) {
        e.preventDefault() ;
        Play.pause() ;
      }) ;
    }) ;
  }

}

PlayList.init() ;
Sync.init() ;

