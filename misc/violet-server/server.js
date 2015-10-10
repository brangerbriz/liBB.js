var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var sendAudioData = null; // function
var sockets = []; // THIS IS A MEMORY LEAK

app.get('/', function (req, res) {
    res.sendfile('index.html');
});

io.on('connection', function (socket) {
 
    sockets.push(socket); // THIS WILL CAUSE A MEMORY LEAK

    socket.on('my other event', function (data) {
        console.log(data);
    });
});

server.listen(5555);
console.log("Server listening at port 127.0.0.1:5555");
