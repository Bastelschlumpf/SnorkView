var gps      = {};
var timespan = 60 * 24 * 60 * 60 * 1000; // msec - 60 days

var mqtt_id  = "SnorkTracker.Molli";

// 1 minute rounding
function getRoundedTime(timeStamp)
{
    var roundedTimeStamp = Math.round(timeStamp / (60 * 1000)) * (60 * 1000);

    return formatDate(new Date(roundedTimeStamp), "YYYY.MM.DD hh:mm:ss");
}

function UpdateGpsData() 
{
    var end = new Date().getTime();

    //console.log('UpdateGpsData');
    sendTo('history.0', 'getHistory', {
        id: 'mqtt.0.' + mqtt_id + '.Gps',
        options: {
            start:      end - timespan,
            end:        end,
            aggregate: 'onchange'
        }
    }, function (result) {
        var lastKey;

        //console.log('getHistory');
        for (var i = 0; i < result.result.length; i++) {
            if (result.result[i] && result.result[i].val) {
               var lastMinute = getRoundedTime(result.result[i].ts);
        
               gps[lastMinute] = result.result[i].val;
               lastKey = lastMinute;
               //console.log('gps: ' + lastMinute + ':' + result.result[i].val);
            }
        }
        createState(mqtt_id + '.Gps', "", {
           name: 'GPS',
           desc: mqtt_id + ' json data',
           type: 'string'
        });
    
        var gpsData       = '[';
        var first         = true;
        var lastLongitude = null;
        var lastLatitude  = null;
        
        for (var key in gps) {
            var myGps     = JSON.parse(gps[key]);
            var longitude = myGps.long;
            var latitude  = myGps.lat;
            var altitude  = myGps.alt;
            var kmph      = myGps.kmph;
            var track     = 30;
            var distKm    = 0.0;

            // Only Values with logitude and latitude
            if (!isNaN(longitude) && !isNaN(latitude) && longitude != 0 && latitude != 0) {
                if (lastLatitude && lastLongitude) {
                   distKm = getDistanceFromLatLonInKm(lastLatitude, lastLongitude, latitude, longitude);
                }

                if (!isNaN(distKm)) {
                   //console.log('Distance [' + key + '] ' + distKm);
                   if (first || key === lastKey || distKm > 3.0) {
                      track = getBearing(lastLatitude, lastLongitude, latitude, longitude);
                      //console.log('Bearing: '  + track);
                      lastLatitude  = latitude;
                      lastLongitude = longitude;
                   
                      if (first === false) {
                          gpsData += ',';
                      }
                      gpsData += 
                         '{' + 
                         '"id":"'   + key       + '",' +
                         '"name":"' + 'Snorki'  + '",' + 
                         '"lat":'   + latitude  + ',' + 
                         '"lng":'   + longitude + ',' +
                         '"alt":'   + altitude  + ',' +
                         '"kmph":'  + kmph      + ',' +
                         '"track":' + track     +
                         '}';
                      first = false;
                   }
                }
            }
        } 
        gpsData += ']'
     
        console.log('SnorkTracker GpsData:' + gpsData.length + ' bytes');
        //console.log('SnorkTracker:' + gpsData);
        setState(mqtt_id + '.Gps', gpsData);
    });
}
