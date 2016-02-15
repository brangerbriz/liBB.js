var Kinect = require(__dirname + '/../lib/node-kinect/kinect');
var kinect = new Kinect({device: 0});

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// kinect.start('video');
kinect.start('depth');

kinect.resume();

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

 // 	kinect.on('video', function(buf) {
	// 	socket.emit('kinect-video', buf);
	// });

	kinect.on('depth', function(buf) {
		socket.emit('kinect-depth', buf);
	});
});

server.listen(8008);
console.log('listening on http://localhost:8008');
