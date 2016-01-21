var http = require("http");
var express = require("express");

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var libServer = require("./server/server.js");

app.use("/", express.static(__dirname+"/client"));

var serveur = new libServer.Server(io.sockets);
io.sockets.on("connection", function(socket) {
	serveur.connection(socket);
});

server.listen(8080);