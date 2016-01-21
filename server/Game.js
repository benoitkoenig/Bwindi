var Objects = require("./objetserveur.js");
var Map = require("./Map.js");

sign = function(x) {
	if (x>=0) {return +1; }
	if (x<0) {return -1; }
}

exports.Game = function(prepa) {
	this.champions = [];
	this.campsMonstres = [];
	this.projectiles = []; //Pour l'instant, ceci reste vide. Attention : doivent etre crees et detruits.
	this.batiments = []; // Les tours
	var that = this;

	this.loadObjects = function() {

		this.map = new Map.Map();

		this.newid = 0;
		var that = this;

		for (var i=0 ; i<prepa.team1.length ; i++) {
			var champ = prepa.team1[i];
			var classe = require("./Champions/"+champ.nom+".js");
			this.champions.push( new classe.Champion(this, champ.nom, that.newid+i, champ.socket , 1) );
		}
		this.newid += prepa.team1.length;
		for (var i=0 ; i<prepa.team2.length ; i++) {
			var champ = prepa.team2[i];
			var classe = require("./Champions/"+champ.nom+".js");
			this.champions.push( new classe.Champion(this, champ.nom, that.newid+i, champ.socket , 2) );
		}

		var MONSTERS = require("./monstres.js");
		this.newid += prepa.team2.length;
		for (var i=0 ; i<MONSTERS.listeDesMonstres.length ; i++) {
			this.campsMonstres.push( new Objects.CampMonstre(this, MONSTERS.listeDesMonstres[i], that.newid) );
			this.newid += MONSTERS.listeDesMonstres[i].length;
		}

		this.batiments.push(new Objects.Tower(this, that.newid, 1));
		this.batiments.push(new Objects.Tower(this, that.newid+1, 2));
		this.batiments.push(new Objects.Protecteur(this, that.newid+2, 1));
		this.batiments.push(new Objects.Protecteur(this, that.newid+3, 2));
		this.newid += 4;

		this.initial = {};
		this.initial.click = [];
		for (var i=0 ; i<this.champions.length ; i++) {
			var c = this.champions[i];
			this.initial.click.push({classe: "entite", nom: "Champions/"+c.nom+"/"+c.nom, x: c.x, z: c.z, rot: 0, idserveur: {type: "champion", num: i}});
		}
		for (var i=0 ; i<this.campsMonstres.length ; i++) {
			for (var j=0 ; j<this.campsMonstres[i].monstres.length ; j++) {
				var m = this.campsMonstres[i].monstres[j];
				this.initial.click.push({classe: "entite", nom: m.nom, x: m.x, z: m.z, rot: 0, idserveur: {type: "monstre", numCamp: i, num: j}});
			}
		}

		var c = this.batiments[0];
		this.initial.click.push({classe: "entite", nom: "Tower", x: c.x, z: c.z, rot: 0, idserveur: {type: "batiment", num: 0}});
		var c = this.batiments[1];
		this.initial.click.push({classe: "entite", nom: "Tower", x: c.x, z: c.z, rot: 0, idserveur: {type: "batiment", num: 1}});
		var c = this.batiments[2];
		this.initial.click.push({classe: "entite", nom: "Protecteur", x: c.x, z: c.z, rot: 0, idserveur: {type: "batiment", num: 2}});
		var c = this.batiments[3];
		this.initial.click.push({classe: "entite", nom: "Protecteur", x: c.x, z: c.z, rot: 0, idserveur: {type: "batiment", num: 3}});

		for (var i=0 ; i<this.champions.length ; i++) {
			this.champions[i].addSomeMesh(this);
		}

		for (var i=0 ; i<this.champions.length ; i++) {
			this.champions[i].socket.emit("debutJeu", {id: i, initial: that.initial});
		}

		setTimeout(function() {
			that.emit("anim", {id: that.batiments[2].idclient, val: "4"});
			that.emit("anim", {id: that.batiments[3].idclient, val: "4"});
		}, 500);

	}

	this.emit = function(nom, obj) {
		for (var i=0 ; i<this.champions.length ; i++) {
			this.champions[i].socket.emit(nom, obj);
		}
	}

	this.update = function() {
		for (var i=0 ; i<that.champions.length ; i++) {
			for (var j=0 ; j<4 ; j++) {
				that.champions[i].spells[j].update();
			}
		}
		for (var i=0 ; i<that.champions.length ; i++) {
			that.champions[i].move();
		}
		for (var i=0 ; i<that.campsMonstres.length ; i++) {
			that.campsMonstres[i].update();
		}
		for (var i=0 ; i<that.batiments.length ; i++) {
			that.batiments[i].update();
		}
	}

	this.loadObjects();
	setInterval(that.update, 60);
}