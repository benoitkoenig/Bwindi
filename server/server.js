var Jeu = require("./Game.js");

exports.Server = function() {
	this.onlines = []; // Here is a list of online players.
	this.prepas = []; // These are groups of players, right before they start the game.
	this.games = [];
	// this.mongoose = require("mongoose");
	// this.mongoose.connect("mongodb://localhost/Bwindi");

	this.connection = function(socket) {
		socket.emit("pseudo", "anonyme_"+this.onlines.length);
		this.onlines.push(new Online(this.onlines.length, socket, this, "anonyme_"+this.onlines.length));
		this.MsgAll("<span style='font-weight: bold;'>" + this.onlines[this.onlines.length-1].pseudo + " vient de se connecter</span>")
		for (var i=0 ; i<this.prepas.length ; i++) {
			if (this.prepas[i]!=undefined) {
				socket.emit(
					"newPrepa",
					"<span style='font-weight:bold;'>" + this.prepas[i].nom +
						"</span> by " + this.prepas[i].team1[0].pseudo
				);
			}
		}
	}

	this.createPrepa = function(joueur, name) {
		this.prepas.push(new Prepa(this.prepas.length, joueur, name, this));
		for (var i=0 ; i<this.onlines.length ; i++) {
			if (this.onlines[i].available=="free") {
				this.onlines[i].socket.emit("newPrepa", "<span style='font-weight:bold;'>" + name + "</span> by " + joueur.pseudo);
			}
		}
		return this.prepas[this.prepas.length-1];
	}

	this.createGame = function(i) {
		this.games.push(new Jeu.Game(this.prepas[i]));
		delete this.prepas[i];
	}

	this.MsgAll = function(msg) {
		for (var i=0 ; i<this.onlines.length ; i++) {
			this.onlines[i].socket.emit("MsgAll", msg);
		}
	}
}

Online = function(id, socket, server, pseudo) {
	this.id = id;
	this.socket = socket;
	this.available = "free";
	this.nom = "Barbare";
	this.pseudo = pseudo;
	this.prepa;
	var that = this;

	this.socket.on("createPrepa", function(name) {
		that.prepa = server.createPrepa(that, name);
		that.available = "prepa";
	});

	this.socket.on("joinPrepa", function(nom) {
		for (var i=0 ; i<server.prepas.length ; i++) {
			if (server.prepas[i] != undefined && server.prepas[i].nom == nom) {
				that.prepa = server.prepas[i].addJoueur(that);
				if (that.prepa!=false) {
					that.available = "prepa";
				}
			}
		}
	});

	this.socket.on("quitPrepa", function(nom) {
		for (var i=0 ; i<server.prepas.length ; i++) {
			that.prepa.removeJoueur(that);
		}
	});

	this.socket.on("switchTeam", function() {
		that.prepa.switchTeam(that);
	});

	this.socket.on("pickChampion", function(nom) {
		if (nom=="Barbare" || nom=="Mage" || nom=="Nova") {
			that.nom = nom;
		}
	});

	this.socket.on("MsgAll", function(msg) {
		server.MsgAll("<span style='font-weight: bold'>" + that.pseudo + " : </span>" + msg);
	});

}

Prepa = function(id, host, name, server) {
	this.id = id;
	this.nom = name;
	this.team1 = [];
	this.team2 = [];
	var that = this;

	this.removeJoueur = function(joueur) {
		var team = 0;
		var index = 0;
		for (var i=0 ; i<this.team1.length ; i++) {
			if (this.team1[i]==joueur) {
				this.team1.splice(i, 1);
				team = 1;
				index = i;
			}
		}
		for (var i=0 ; i<this.team2.length ; i++) {
			if (this.team2[i]==joueur) {
				this.team2.splice(i, 1);
				team = 2;
				index = i;
			}
		}

		for (var i=0 ; i<this.team1.length ; i++) {
			this.team1[i].socket.emit("removeJoueur", {team: team, index: index});
		}
		for (var i=0 ; i<this.team2.length ; i++) {
			this.team2[i].socket.emit("removeJoueur", {team: team, index: index});
		}
	}

	this.switchTeam = function(joueur) {
		var team = 0;
		for (var i=0 ; i<this.team1.length ; i++) {
			if (this.team1[i]==joueur) {
				team = 2;
			}
		}
		for (var i=0 ; i<this.team2.length ; i++) {
			if (this.team2[i]==joueur) {
				team = 1;
			}
		}
		if ((team==2 && this.team2.length!=3) || (team==1 && this.team1.length!=3)) {
			this.removeJoueur(joueur);
			this.include(joueur, team);
			if (team==1) {this.team1.push(joueur);
			} else {this.team2.push(joueur); }
		}
	}

	this.addJoueur = function(joueur) {
		if (this.team1.length==3 && this.team2.length==3) { // if the prepa is full
			return false;
		} else {
			var team;
			if (this.team1.length > this.team2.length) {
				team = 2;
			} else {
				team = 1;
			}
			this.include(joueur, team);
			if (team==1) {this.team1.push(joueur);
			} else {this.team2.push(joueur); }
			return this;
		}
	}

	this.include = function(joueur, equipe) {
		//When the player comes in, tell him who's there and shit. Also warn everybody he is in here.
		for (var i=0 ; i<this.team1.length ; i++) {
			joueur.socket.emit("addJoueur", {team: 1, pseudo: that.team1[i].pseudo});
			this.team1[i].socket.emit("addJoueur", {team: equipe, pseudo: joueur.pseudo});
		}
		for (var i=0 ; i<this.team2.length ; i++) {
			joueur.socket.emit("addJoueur", {team: 2, pseudo: that.team2[i].pseudo});
			this.team2[i].socket.emit("addJoueur", {team: equipe, pseudo: joueur.pseudo});
		}
		joueur.socket.emit("addJoueur", {team: equipe, pseudo: joueur.pseudo});
	}

	host.socket.on("startGame", function() {
		// We start the game
		server.createGame(that.id);
	});

	this.addJoueur(host);
}
