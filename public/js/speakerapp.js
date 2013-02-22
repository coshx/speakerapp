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
        console.log("no feed...");
    });
  },
  play: function() {
    $("#play").text("Loading...");

    if(Play.url==null) {
     Play.fetchAudioData();
     setTimeout(Play.play, 500);
     return;
    }

    if (Play.audio == null) {
        Play.count = 0 ;
      Play.audio = new Audio();
      Play.audio.src = Play.url;
      Play.audio.loop = false ;
      Play.audio.play();
    }

    if (Play.audio.readyState !== 4 && Play.count==0) { // HAVE_ENOUGH_DATA
      console.log("waiting for enough data...");
      $("#play").text("Loading... ");
      setTimeout(Play.play, 500);
      return;
    }
    $("#play").text("Playing "+Play.title);
    $("#pause").text("Pause");
    $("#pause").removeClass("disabled");

    var currentServerTime;
    var currentSongTime;

    currentServerTime = new Date().getTime() + Sync.clock_skew;
    currentSongTime = ((currentServerTime - Play.start_at)/1000);
    Play.audio.currentTime = currentSongTime;

    Play.count++;
    if(Play.count<5) {
      setTimeout(Play.play,1000);
    }
    console.log("Player lag: "+(currentSongTime - Play.audio.currentTime));

    //console.log("Current server time is: " + currentServerTime);
    //console.log("Setting currentTime to " + currentSongTime);
  },
  pause: function() {
    if (Play.audio != null) {
      $("#pause").text("");
      $("#play").text("Subscribe")
      $("#play").removeClass("disabled");
      Play.audio.pause();
      Play.url = null;
      Play.audio = null;
    }
  }
};

PlayList = {
  songs: [
   {title:"Rainbow", url: "http://speakerapp.herokuapp.com/media/rainbow.mp3", duration:222000},
   {title:"Thirdday", url: "http://speakerapp.herokuapp.com/media/thirdday.mp3", duration:215000},
   {title:"Cross", url: "http://speakerapp.herokuapp.com/media/cross.mp3", duration:215000}
  ],
  init: function() {
    $(function() {

      $("#skew").text("Skew: " + Sync.clock_skew);

      $("#play").removeClass("disabled");
      $("#play").text("Subscribe");

      $.each(PlayList.songs, function(index, song) {
        $("#song_list option[id='"+index+"']").text(PlayList.songs[index].title);
        $("#song_list option[id='"+index+"']").val(index);
      });

      $("#song_list").on("change", function(e) {
        e.preventDefault();
        var selected_index = $('#song_list :selected').val();
        $.post('/song_info', PlayList.songs[selected_index]);
        Play.pause();
        $("#play").text("Broadcast");
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
      });
    });
  }

}

var Sync ={
  clock_skew: 0,

  init: function() {
    //GuessSync.init();
    //console.log("GuessSync.clock_skew "+GuessSync.clock_skew);
    NtpSync.init();
    console.log("NtpSync.clock_skew "+NtpSync.clock_skew);
    this.clock_skew = NtpSync.clock_skew;
  }
}

Sync.init();
PlayList.init();
