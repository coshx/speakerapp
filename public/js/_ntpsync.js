var NtpSync = {
  maxRequests: 25,
  serverTimes: [],
  clientRequestTimes: [],
  clientResponseTimes: [],
  clock_skew: 0,

  init: function() {
    NtpSync.getServerTime();
  },
  getServerTime: function() {
    NtpSync.clientRequestTimes.push(new Date().getTime());
    $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(data) {
      var currentTime = new Date().getTime();
      NtpSync.serverTimes.push(data.time);
      NtpSync.clientResponseTimes.push(currentTime);
      if (NtpSync.serverTimes.length < NtpSync.maxRequests) {
        NtpSync.getServerTime();
      } else {
          NtpSync.calculateSkew();
      }
    }});
  },
  calculateSkew: function() {
    var reqPlusSkew = _.map(_.zip(NtpSync.serverTimes, NtpSync.clientRequestTimes), function(t) {
      return t[0] - t[1];
    });
    var respMinusSkew = _.map(_.zip(NtpSync.clientResponseTimes, NtpSync.serverTimes), function(t) {
      return t[0] - t[1];
    });
    var sumReqPlusSkew = _.reduce(reqPlusSkew, function(memo, num) {
      return memo + num;
    }, 0);
    var sumRespMinusSkew = _.reduce(respMinusSkew, function(memo, num) {
      return memo + num;
    }, 0);

    var avgReqPlusSkew = sumReqPlusSkew / NtpSync.serverTimes.length;
    var avgRespMinusSkew = sumRespMinusSkew / NtpSync.serverTimes.length;
    NtpSync.clock_skew = avgReqPlusSkew - ((avgReqPlusSkew+avgRespMinusSkew)/2);
  }

};

