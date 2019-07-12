
on({
    id: 'mqtt.0.SnorkTracker.Molli.Gps', 
    change: 'any'
}, function (obj) {
   UpdateGpsData();
});