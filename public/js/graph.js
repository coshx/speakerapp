var Graph = {
  maxRequests: 25,
  serverTimes: [],
  clientRequestTimes: [],
  clientResponseTimes: [],
  roundtripTimes: [],

  init: function(callback) {
    Graph.serverTimes = [];
    Graph.clientRequestTimes = [];
    Graph.clientResponseTimes = [];
    Graph.roundtripTimes = [];
    Graph.getServerTime(callback);
  },

  getServerTime: function(callback) {
    Graph.clientRequestTimes.push(new Date().getTime());

    $.get("/time", function(data) {
      Graph.serverTimes.push(data.time);
      var currentTime = new Date().getTime();
      Graph.clientResponseTimes.push(currentTime);

      var reqTime = Graph.clientRequestTimes[Graph.clientRequestTimes.length-1];
      var roundtripTime = currentTime - reqTime;
      Graph.roundtripTimes.push(roundtripTime);

      if (Graph.serverTimes.length < Graph.maxRequests) {
        Graph.getServerTime(callback);
      } else {
        callback();
      }
    });
  }
};

var Plot = {
  serverTimes: function() {
    var x = jstat.seq(1, Graph.maxRequests, Graph.maxRequests);
    var y = Graph.serverTimes;
    jstat.plot(x, y, {main: 'Time as Reported By Server'});
  },
  roundtripTimes: function() {
    var x = jstat.seq(1, Graph.maxRequests, Graph.maxRequests);
    var y = Graph.roundtripTimes;
    jstat.plot(x, y, {main: 'Roundtrip Times (ms)'});
  },
  diffTimesReq: function() {
    var x = jstat.seq(1, Graph.maxRequests, Graph.maxRequests);
    var y = _.map(_.zip(Graph.serverTimes, Graph.clientRequestTimes), function(t) {
      return t[0] - t[1];
    });
    jstat.plot(x, y, {main: 'Server Time - Client Time at Request (ms)'});
  },
  diffTimesResp: function() {
    var x = jstat.seq(1, Graph.maxRequests, Graph.maxRequests);
    var y = _.map(_.zip(Graph.clientResponseTimes, Graph.serverTimes), function(t) {
      return t[0] - t[1];
    });
    jstat.plot(x, y, {main: 'Client Time - Server Time at Response (ms)'});
  },
  dServerTime: function() {
    var x = jstat.seq(1, Graph.maxRequests-1, Graph.maxRequests-1);
    var dy = [];
    for (var i = 1; i < Graph.serverTimes.length; i++) {
      dy[i-1] = Graph.serverTimes[i] - Graph.serverTimes[i-1];
    }
    jstat.plot(x, dy, {main: 'd(Server Time)/dt'});
  },
  dClientTime: function() {
    var x = jstat.seq(1, Graph.maxRequests-1, Graph.maxRequests-1);
    var dy = [];
    for (var i = 1; i < Graph.clientRequestTimes.length; i++) {
      dy[i-1] = Graph.clientRequestTimes[i] - Graph.clientRequestTimes[i-1];
    }
    jstat.plot(x, dy, {main: 'd(Client Time)/dt'});
  },
  clockSkew: function() {
    var reqPlusSkew = _.map(_.zip(Graph.serverTimes, Graph.clientRequestTimes), function(t) {
      return t[0] - t[1];
    });
    var respMinusSkew = _.map(_.zip(Graph.clientResponseTimes, Graph.serverTimes), function(t) {
      return t[0] - t[1];
    });

    var sumReqPlusSkew = _.reduce(reqPlusSkew, function(memo, num) {
      return memo + num;
    }, 0);
    var sumRespMinusSkew = _.reduce(respMinusSkew, function(memo, num) {
      return memo + num;
    }, 0);

    var avgReqPlusSkew = sumReqPlusSkew / Graph.serverTimes.length;
    var avgRespMinusSkew = sumRespMinusSkew / Graph.serverTimes.length;

    var estSkew = avgReqPlusSkew - ((avgReqPlusSkew+avgRespMinusSkew)/2);

    $('#clockSkew').text('avg request + skew: ' + avgReqPlusSkew
                    + ', avg response - skew: ' + avgRespMinusSkew
                    + ', If req==resp, skew: ' + estSkew);
  },
  dSkew: function() {
    var x = jstat.seq(1, Graph.maxRequests-1, Graph.maxRequests-1);
    var dy = [];

    var reqPlusSkew = Graph.serverTimes[0] - Graph.clientRequestTimes[0];
    var respMinusSkew = Graph.clientResponseTimes[0] - Graph.serverTimes[0];
    var lastEstSkew = reqPlusSkew - (reqPlusSkew + respMinusSkew);

    for (var i = 1; i < Graph.maxRequests; i++) {
      var reqPlusSkew = Graph.serverTimes[i] - Graph.clientRequestTimes[i];
      var respMinusSkew = Graph.clientResponseTimes[i] - Graph.serverTimes[i];
      var estSkew = reqPlusSkew - (reqPlusSkew + respMinusSkew);
      dy[i-1] = estSkew - lastEstSkew;
      lastEstSkew = estSkew;
    }
    jstat.plot(x, dy, {main: 'dSkew/dt'});
  }

};

$(function() {
  $('a[data-plot]').addClass('disabled');

  Graph.init(function() {
    $('a[data-plot]').removeClass("disabled");
  });

  $('a[data-plot]').on("click", function(e){
    e.preventDefault();
    if ($(e.target).hasClass("disabled")) {
      return;
    }

    var functionName = $(e.target).data('plot');
    Plot[functionName]();
  });
});