GateSync = {
  maxRequests: 100,
  measurements: [],
  clockSkew: 0,

  init: function(){
    GateSync.getMeasurement();
  },
  mean:function(values){
    var sum = _.reduce(values, function(memo, val){ return memo + val; }, 0);
    return sum/values.length ;
  },
  stdev:function(values){
    var mean = GateSync.mean(values);
    var squared_difference_sum = _.reduce(values, function(memo, val){ return memo + Math.pow(val-mean,2) }, 0);
    return Math.sqrt(squared_difference_sum/(values.length-1));
  },
  typicalMeasurements:function(measurements){
    var done = true ;
    var new_measurements = [] ;
    var respPlusSkews = measurements.map(function(memo){return memo.respPlusSkew});
    var stdev = GateSync.stdev(respPlusSkews);
    var mean = GateSync.mean(respPlusSkews);
    _.each(measurements, function(measurement){
      var respPlusSkew = measurement.respPlusSkew ;
      if(respPlusSkew <= (mean + stdev) && respPlusSkew >= (mean - stdev) ){
        new_measurements.push(measurement);
      }else{
        done = false ;
      }
    });
    if(!done){
      return GateSync.typicalMeasurements(new_measurements);
    }else{
      return new_measurements ;
    }
  },
  getMeasurement:function(){
    var clientRequestTime,currentTime,roundTrip,respPlusSkew ;
    clientRequestTime = Date.now();
    $.ajax({ url:  "/time", dataType: 'json', async: false, success: function(response){
      currentTime = Date.now();
      respPlusSkew = currentTime - response["time"] ;
      roundTrip = currentTime - clientRequestTime ;
      GateSync.measurements.push({respPlusSkew: respPlusSkew, roundTrip: roundTrip});
    }});
    if(GateSync.measurements.length < GateSync.maxRequests){
        GateSync.getMeasurement();
    }else{
      GateSync.calculateSkew();
    }
  },
  calculateSkew:function(){
    var responseTime, respPlusSkew;
    var typicalMeasurements = GateSync.typicalMeasurements(GateSync.measurements);
    responseTime = _.min(typicalMeasurements.map(function(memo){return memo.roundTrip}))/2;
    respPlusSkew = _.min(typicalMeasurements.map(function(memo){return memo.respPlusSkew}));
    GateSync.clockSkew = -1*(respPlusSkew - responseTime);
  }
};
