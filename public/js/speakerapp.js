var Play = {
  title: null,
  url: null,
  start_at: null,
  duration: 0,
  audio: null,
  count:0,
  playing:false,

  fetchAudioData: function() {
    $.ajax({ url:  "/song_info", cache: false, dataType: 'json', async: false, success: function(serverResponse) {
      Play.title = serverResponse.title;
      Play.url = serverResponse.url;
      Play.start_at = serverResponse.start_at;
      console.log(Play.start_at);
    }});
  },
  play: function() {

    if(Play.url==null || Play.url=="") {
      Play.fetchAudioData();
      setTimeout(Play.play, 500);
      return false;
    }

    if (Play.audio == null) {
      Play.count = 0 ;
      Play.audio = new Audio();
      Play.audio.src = Play.url;
      Play.audio.loop = false ;
    }

    if (Play.audio.readyState != 4) { // HAVE_ENOUGH_DATA
      Play.audio.play();
      $("#status").text("Loading... ");
      setTimeout(Play.play, 500);
      return false;
    }

    Play.currentServerTime = new Date().getTime() + Sync.clock_skew;
    Play.audio.currentTime = ((Play.currentServerTime - Play.start_at)*0.001);

    Play.count++;
    if(Play.count<5) {
      $("#status").text("Syncing ...");
      setTimeout(Play.play,500);
    }else{
      $("#status").text("Playing");
      $("#pause").text("Pause");
      $("#pause").removeClass("disabled");
    }
    //console.log("Player lag: "+(currentSongTime - Play.audio.currentTime));
    //console.log("Current server time is: " + currentServerTime);
    //console.log("Setting currentTime to " + currentSongTime);
  },
  pause: function() {
    if (Play.audio != null) {
      $("#pause").text("");
      $("#play").removeClass("disabled");
        Play.audio.src =""     //assign a blank string as audio src
        Play.audio.load() ;    //play src to induce audio player to delete the prior mp3 from memory
        Play.audio = null ;
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

      Play.fetchAudioData();
      if(Play.title!=""){
        $("#play").text("Subscribe - "+Play.title);
        $("#play").removeClass("disabled");
      }else{
        $("#play").text("Subscribe");
        $("#play").addClass("disabled") ;
      }

      $("#status").text("Ready");
      $("#skew").text("Skew: " + Sync.clock_skew);
      $("#broadcast").addClass("disabled");
      $("#pause").addClass("disabled");

      $.each(PlayList.songs, function(index, song) {
        $("#song_list option[id='"+index+"']").text(PlayList.songs[index].title);
        $("#song_list option[id='"+index+"']").val(index);
      });

      $("#song_list").on("change", function(e) {
        $("#broadcast").removeClass("disabled");
        Play.pause();
        e.preventDefault();
      });

      $("#broadcast").on("click", function(e) {
        $("#broadcast").addClass("disabled");
        var selected_index = $('#song_list :selected').val();
        $("#status").text("starting broadcast...");
        $.post('/song_info', PlayList.songs[selected_index], function(data){
          $("#status").text("Ready");
          $("#play").text("Subscribe - "+PlayList.songs[selected_index].title);
          $("#play").removeClass("disabled");
        });
        e.preventDefault();
      });
      $("#play").on("click", function(e) {

        if ($("#play").hasClass("disabled")) {
          return;
        }

        $("#broadcast").addClass("disabled");
        $("#status").text("Connecting...");
        Play.play();
        $("#play").addClass("disabled");
          e.preventDefault();

      });

      $("#pause").on("click", function(e) {
        $("#status").text("Ready");
        Play.pause();
        e.preventDefault();
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
