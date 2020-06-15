var server = require('http').createServer(handler); //require http server, and create server with function handler()
var io = require('socket.io').listen(server);//require socket.io module and pass the http object (server)
var fs = require('fs'); //require filesystem module
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
// var LED04 = new Gpio(4, 'out'); //use GPIO pin 4 as output
// var LED06 = new Gpio(6, 'out'); //use GPIO pin 4 as output
var sensor = new Gpio(17, 'in', 'both', {debounceTimeout: 10}); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled
//Put all the LED variables in an array
// var leds = [LED04, LED06];
var indexCount = 0; //a counter
const sensorTemp = require("node-dht-sensor").promises;
let count = 0;
const repeats = 10;
 



server.listen(process.env.PORT || 3000, function(){
  console.log('Server started',process.env.PORT );
});



function exec(body) {
  sensorTemp.initialize(11, 25);
  
  sensorTemp.read(11, 25).then(
    function(res) {
      console.log('reading...');
      
      console.log(
        `temp: ${res.temperature.toFixed(1)}C, ` +
          `humidity: ${res.humidity.toFixed(1)}%`
      );
      count++;
      // (24°C × 9/5) + 32
      body.write(`
        <h4>temp: ${(res.temperature.toFixed(1) * 9/5)+32}F</h4>
        <h4>humidity: ${res.humidity.toFixed(1)}%</h4>
      `)
      body.end();
    },
    function(err) {
      console.error("Failed to read sensor data:", err);
      count = repeats;
    }
  );
}

// var interval = setInterval(function() {
//   if (count >= repeats) {
//     clearInterval(interval);
//   }
//   exec();
// }, 500 );


function handler (req, res) { //create server
  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from index.html
    exec(res, function(err) {
      console.log(err)
      if(err) {
        return res.end();
      }
      return res.end();
    });
    
  });
}

io.sockets.on('connection', function (socket) {// WebSocket Connection
  var lightvalue = 0; //static variable for current status
  // console.log(socket);
  // console.log('connected',sensor);
  sensor.watch(function (err, value) { //Watch for hardware interrupts on pushButton
    // console.log('watching', value);
    if (err) { //if an error
      console.error('There was an error', err); //output error message to console
      return;
    }
    lightvalue = value == 0 ? 1 : 0;
    console.log(value);
    socket.emit('light', lightvalue); //send button status to client
  });
  socket.on('light', function(data) { //get light switch status from client
    lightvalue = data;
  });
});

process.on('SIGINT', function () { //on ctrl+c
  sensor.unexport();
  process.exit();
});

