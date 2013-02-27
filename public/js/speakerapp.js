var Play = {
  title:null,
  url:null,
  serverStartTime:null,
  duration:0,
  audio:null,
  syncCount:0,
  playing:false,
  playerTimeSetCost: 0,
  playerLags: [],
  clientStartTime:0,

  fetchAudioData:function (){
    Play.title = ""
    Play.url = null ;
    Play.serverStartTime = null ;
    $.ajax({ url:"/song_info", cache:false, dataType:'json', async:false, success:function (serverResponse){
      Play.title = serverResponse.title;
      Play.url = serverResponse.url;
      Play.serverStartTime = serverResponse.serverStartTime;
      console.log(Play.url)
    }});
  },
  play:function (){
    if (Play.url == null || Play.url==""){
      Play.fetchAudioData();
      Play.audio = null;
      setTimeout(Play.play, 1000);
      return false;
    }
    if (Play.audio == null){
      Play.audio = new Audio();
      Play.audio.src = Play.url;
      Play.audio.play();
      Play.playing = true;
    }
    if (Play.audio.readyState != 4){
      $("#status").text("Loading... ");
        setTimeout(Play.play, 500);
        return false;
    }
    Play.clientStartTime = Play.serverStartTime - Calc.clockSkew;
    var songDuration = Play.audio.duration*1000 ;
    var songPosition = Date.now() - Play.clientStartTime ;
    if(songPosition<songDuration){
      $("#status").text("Syncing...");
      Play.setSongPosition(songPosition);
      Play.syncCount = 0;
      Play.sync();
    }else{
      Play.audio.pause();
      $("#play").addClass("disabled");
      $("#status").text("The song has finished playing, please broadcast another.");
      $("#song_list").removeClass("disabled");
    }
  },
  sync:function (){
    /*this works fairly well between Chrome and Safari desktop*/
    var idealSongPosition = Date.now() - Play.clientStartTime;
    var playerTime =  Play.audio.currentTime * 1000;
    var playerLag =  idealSongPosition - playerTime ;
    if(Math.abs(playerLag)>5 || Play.syncCount<5){ //Run at least 5 times and until error is below 5ms
      if(Play.syncCount!=0){ //cull out first value
        Play.playerLags.push(playerLag);
        var mean = Play.mean(Play.playerLags);
        if(Play.syncCount % 10 == 0){
          Play.playerTimeSetCost += mean ;
          Play.playerLags = [] ;
        }
      }
      Play.setSongPosition(idealSongPosition);
      Play.syncCount++ ;
      setTimeout(Play.sync, 500);
      return false ;
    }
    $("#pause").removeClass("disabled");
    $("#song_list").removeClass("disabled");
    $("#status").text("Playing: "+Play.title);
  },
  mean:function(values){
    var sum = _.reduce(values, function(memo, val){ return memo + val; }, 0);
    return sum/values.length ;
  },
  pause:function (){
    if (Play.playing){
      Play.playing = false;
      $("#pause").addClass("disabled");
      $("#status").text("Ready");
      $("#play").removeClass("disabled");
      Play.url = null;
      Play.audio.pause();
      Play.audio.src = ""
      Play.audio = null;
    }
  },
  setSongPosition: function(timeInMs){
    setTimeout(function(){
      Play.audio.currentTime = 0.001*(timeInMs + Play.playerTimeSetCost);}, 1);
  }
};

PlayList = {
  domain: 'http://chielo.herokuapp.com',
  songs: [  //update speakerapp.html when add another song
   {title:"Let The Meter Run", url: "http://chielo.herokuapp.com/media/Meter.mp3"},
   {title:"Don't Fall in Love with a Lonely Girl", url: "http://chielo.herokuapp.com/media/LonelyGirl.mp3"},
   {title:"Word", url: "http://chielo.herokuapp.com/media/Word.mp3"},
   {title:"Can't Say No To Friday", url: "http://chielo.herokuapp.com/media/friday.mp3"},
   {title:"Venus, I'm Milo", url: "http://chielo.herokuapp.com/media/VenusImMilo.mp3"},
   {title:"We Belong", url: "http://chielo.herokuapp.com/media/WeBelong.mp3"},
   {title:"Lay Your Head", url: "http://chielo.herokuapp.com/media/LayYourHead.mp3"},
   {title:"The Call (Album Version)", url: "http://chielo.herokuapp.com/media/TheCall.mp3"},
   {title:"Rainbow", url: "http://speakerapp.herokuapp.com/media/rainbow.mp3"},
   {title:"Cross", url: "http://speakerapp.herokuapp.com/media/cross.mp3"}
  ],
  init: function(){
    $(function(){
      $("#play").text("Subscribe");
      $("#play").removeClass("disabled");

      $("#status").text("Ready");
      $("#clockSkew").text("Skew: " + Calc.clockSkew);
      $("#broadcast").addClass("disabled");
      $("#pause").addClass("disabled");
      $.each(PlayList.songs, function(index, song){
        $("#song_list option[id='"+index+"']").text(PlayList.songs[index].title);
        $("#song_list option[id='"+index+"']").val(index);
      });
      $("#song_list").on("change", function(e){
        $("#broadcast").removeClass("disabled");
        e.preventDefault();
      });
     $("#broadcast").on("click", function(e){
        $("#broadcast").addClass("disabled");
        Play.pause();
        var selected_index = $('#song_list :selected').val();
        $("#status").text("starting broadcast...");
        $.post('/song_info', PlayList.songs[selected_index], function(data){
          $("#status").text("Ready");
          $("#play").text("Subscribe");
          $("#play").removeClass("disabled");
        });
        e.preventDefault();
      });
      $("#play").on("click", function(e){
        if ($("#play").hasClass("disabled")){
          return false;
        }
        $("#song_list").addClass("disabled");
        $("#broadcast").addClass("disabled");
        $("#status").text("Connecting...");
        $("#play").addClass("disabled");
        Play.play();
        e.preventDefault();
      });
      $("#pause").on("click", function(e){
        $("#status").text("Ready");
        $("#song_list").removeClass("disabled");
        Play.pause();
        e.preventDefault();
      });
    });
  }
}

var Calc ={
  clockSkew: 0,
  init: function(){
    GateSync.init();
    this.clockSkew = GateSync.clockSkew;
  }
}

Calc.init();
PlayList.init();