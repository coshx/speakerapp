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
  songs: [  //update speakerapp.html when add another song
   {title:"Let The Meter Run", url: "https://s3.amazonaws.com/gigdog.fm/songs/Charlie_Mars/ib1jgxameh81mhxg_-_Let_the_Meter_Run_-_ib1jgxameh81mhxg.mp3"},
   {title:"Don't Fall in Love with a Lonely Girl", url: "https://s3.amazonaws.com/gigdog.fm/songs/Freedy_Johnston/4vpcgdga1fv6ud47_-_Don_t_Fall_in_Love_with_a_Lonely_Girl_-_4vpcgdga1fv6ud47.mp3"},
   {title:"Word", url: "https://s3.amazonaws.com/gigdog.fm/songs/Dewveall/ont76y2xznk1tnlg_-_Word_-_ont76y2xznk1tnlg.mp3"},
   {title:"At the End of My Rope", url: "https://s3.amazonaws.com/gigdog.fm/songs/Mark_Taylor/20f2zhrzkgl724n8_-_At_the_End_of_My_Rope_-_20f2zhrzkgl724n8.mp3"},
   {title:"Can't Say No To Friday", url: "https://s3.amazonaws.com/gigdog.fm/songs/The_Torn_ACLs/88x697vgf5rkpi7b_-_Can_t_Say_No_To_Friday_-_88x697vgf5rkpi7b.mp3"},
   {title:"Venus, I'm Milo", url: "https://s3.amazonaws.com/gigdog.fm/songs/The_Most/fs0ukcmb96edg5aw_-_Venus__I_m_Milo_-_fs0ukcmb96edg5aw.mp3"},
   {title:"We Belong", url: "https://s3.amazonaws.com/gigdog.fm/songs/FM_Pilots/ml7xcokhr75m84tv_-_We_Belong_-_ml7xcokhr75m84tv.mp3"},
   {title:"Lay Your Head", url: "https://s3.amazonaws.com/gigdog.fm/songs/New_Day_Dawn/ev8r0csc9ez0yrqa_-_Lay_Your_Head_-_ev8r0csc9ez0yrqa.mp3"},
   {title:"The Call (Album Version)", url: "https://s3.amazonaws.com/gigdog.fm/songs/The_Hill_and_Wood/tsmdac9qxf059leo_-_The_Call__Album_Version__-_tsmdac9qxf059leo.mp3"},
   {title:"Rainbow", url: "http://speakerapp.herokuapp.com/media/rainbow.mp3"},
   {title:"Thirdday", url: "http://speakerapp.herokuapp.com/media/thirdday.mp3"},
   {title:"Cross", url: "http://speakerapp.herokuapp.com/media/cross.mp3"}
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
