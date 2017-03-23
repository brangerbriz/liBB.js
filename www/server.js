var express = require('express');
var app = express();

app.get(/^(.+)$/, function(req, res){
	console.log('requested : ', req.params);
	res.sendFile( __dirname + req.params[0]);
});

var server = app.listen(3333, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('listening at http://%s:%s', host, port);
});
