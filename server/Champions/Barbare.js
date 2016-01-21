var Objects = require("../objetserveur.js");

exports.Champion = function(game, nom, idclient, socket, team) {
	Objects.Champion.call(this, game, nom, idclient, socket, team);
	var that = this;

	this.initParam(400, 400, 0, 0, 20, 14, 4, 160, 1.2, 20, 5, 0.4);

	setTimeout(function() {
		that.game.emit("setMovementSpeed", {id: that.idclient, speed: 160});
	}, 5000);

	this.levelGrid = [0, 100, 300, 600, 900, 1300, 1900, 2900, -1];
	this.pvgrid = [400, 450, 500, 550, 600, 700, 800, 900];
	this.dpgrid = [400, 420, 440, 460, 480, 500, 525, 550];
	this.epgrid = [0, 0, 0, 0, 0, 0, 0, 0];
	this.gpgrid = [0, 0, 0, 0, 0, 0, 0, 0];
	this.drgrid = [20, 21, 22, 23, 24, 26, 28, 32];
	this.ergrid = [14, 15, 16, 17, 18, 20, 22, 26];
	this.grgrid = [4, 4, 4, 4, 5, 5, 5, 6];

	this.addSomeMesh = function() {
		//game.initial.noclick.push({nom: "boulefeu", x: 0, z: 0, rot: 0, idserveur: null});
	}

	this.spells = [];
	this.spells.push(new Spell0(that));
	this.spells.push(new Objects.Spell(that, 0, 0, 1));
	this.spells.push(new Spell2(that));
	this.spells.push(new Spell3(that));
}

var Spell0 = function(guy) {
	Objects.Spell.call(this, guy, 1, 20*10, 0);
	var that = this;
	this.actif = 0;
	this.x;
	this.z;

	this.cast = function(data) {
		if (this.avalaible==0) {
			this.guy.angle = (function(x, z, data) {
				var dist = Math.sqrt(Math.pow(x-data.mouseX, 2)+Math.pow(z-data.mouseY, 2));
				if (dist!=0) {
					return Math.acos((data.mouseX-x)/dist) * sign(data.mouseY-z);
				} else {
					return 0;
				}
			})(this.guy.x, this.guy.z, data);
			this.incantation = this.incant+1;
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 5});
			this.guy.game.emit("position", {id: that.guy.idclient, x: that.guy.x, z: that.guy.z, angle: -that.guy.angle+Math.PI/2});
			that.guy.resetPos();
			that.guy.action = "stay";
		}
	}

	this.update = function() {
		this.incanter();
		if (this.actif==8) {
			this.vitesse = 0;
		}
		if (this.actif==8) {
			this.vitesse = -0.6;
		}
		if (this.actif > 2) {
			this.x += this.vitesse * Math.cos(this.angle);
			this.z += this.vitesse * Math.sin(this.angle);
			this.checkHit();
		}
		if (this.actif==1) {
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 0});
		}
		if (this.actif > 0) {
			this.actif -= 1;
		}
	}

	this.checkHit = function() {
		for (var i=0 ; i<this.guy.game.champions.length ; i++) {
			var cible = this.guy.game.champions[i];
			if (Math.pow(cible.x-this.x, 2)+Math.pow(cible.z-this.z, 2) < Math.pow(0.5+cible.hitRange, 2)) {
				this.affect(cible);
			}
		}
		for (var i=0 ; i<this.guy.game.campsMonstres.length ; i++) {
			for (var j=0 ; j<this.guy.game.campsMonstres[i].monstres.length ; j++) {
				var cible = this.guy.game.campsMonstres[i].monstres[j];
				if (Math.pow(cible.x-this.x, 2)+Math.pow(cible.z-this.z, 2) < Math.pow(0.5+cible.hitRange, 2)) {
					this.affect(cible);
				}
			}
		}
	}

	this.affect = function(cible) {
		cible.hurt(20+0.05*this.guy.dp, 0, 0, 0, this.guy);
		cible.etats.setDuring(1, 20*0.5);
	}

	this.action = function() {
		this.actif = 14;
		this.guy.etats.setDuring(1, 14);
		this.angle = this.guy.angle;
		this.x = this.guy.x + 0.6*Math.cos(this.angle-0.35);
		this.z = this.guy.z + 0.6*Math.sin(this.angle-0.35);
		//this.guy.game.emit("anim", {id: {click: false, num: 0}, val: 1});
		//this.guy.game.emit("position", {id: {click: false, num: 0}, x: this.x, z: this.z, angle: 0});
		this.vitesse = 0.6;
	}

}

var Spell2 = function(guy) {
	Objects.Spell.call(this, guy, 0, 20*15, 2);
	var that = this;

	this.update = function() {
		this.incanter();
		if (this.actif>0) {
			this.actif -= 1;
			if (this.guy.action != this.guyAction) {
				if (this.guy.action=="move") {
					this.guy.game.emit("anim", {id: that.guy.idclient, val: 9});
				} else if (this.guy.action=="stay") {
					this.guy.game.emit("anim", {id: that.guy.idclient, val: 8});
				}
				this.guyAction = this.guy.action;
			}
			if (this.action=="attack") {
				this.actif = 0;
			}
			this.blesser();
			if (this.actif==0) {
				if (this.guy.action=="move") {
					this.guy.game.emit("anim", {id: that.guy.idclient, val: 1});
				} else {
					this.guy.game.emit("anim", {id: that.guy.idclient, val: 0});
				}
			}
		}
	}

	this.blesser = function() {
		for (var i=0 ; i<this.guy.game.champions.length ; i++) {
			var cible = this.guy.game.champions[i];
			if (Math.pow(cible.x-this.guy.x, 2)+Math.pow(cible.z-this.guy.z, 2) < Math.pow(1+cible.hitRange, 2)) {
				this.affect(cible);
			}
		}
		for (var i=0 ; i<this.guy.game.campsMonstres.length ; i++) {
			for (var j=0 ; j<this.guy.game.campsMonstres[i].monstres.length ; j++) {
				var cible = this.guy.game.campsMonstres[i].monstres[j];
				if (Math.pow(cible.x-this.guy.x, 2)+Math.pow(cible.z-this.guy.z, 2) < Math.pow(1+cible.hitRange, 2)) {
					this.affect(cible);
				}
			}
		}
	}

	this.affect = function(cible) {
		cible.hurt(2+0.05*this.guy.dp, 0, 0, 0, this.guy);
	}

	this.action = function() {

		if (this.guy.action == "move") {
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 9});
		} else {
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 8});
		}
		this.actif = 80;
		this.guy.etats.setDuring(2, 80);
		this.guyAction = this.guy.action;
	}
}

var Spell3 = function(guy) {
	Objects.Spell.call(this, guy, 1, 20*40, 3);
	var that = this;
	this.actif = 0;
	this.data;
	this.vitesse;

	this.action = function() {
		this.vitesse = this.dist / 12;
		this.actif = 15;
		this.guy.action = "stay";
		that.guy.destinations = [{type: "position", x: that.data.mouseX, z: that.data.mouseY}];
		this.guy.etats.setDuring(1, 15);
	}

	this.update = function() {
		this.incanter();
		if (this.actif > 2 && this.actif < 15) {
			this.guy.x += this.vitesse*Math.cos(this.guy.angle);
			this.guy.z += this.vitesse*Math.sin(this.guy.angle);
			this.guy.game.emit("position", {id: that.guy.idclient, x: that.guy.x, z: that.guy.z, angle: -that.guy.angle+Math.PI/2});
		}
		if (this.actif==1) {
			this.blowup();
		}
		if (this.actif==1) {
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 0});
		}
		if (this.actif>0) {
			this.actif -= 1;
		}
	}

	this.blowup = function() {
		for (var i=0 ; i<this.guy.game.champions.length ; i++) {
			var cible = this.guy.game.champions[i];
			if (Math.pow(cible.x-this.guy.x, 2)+Math.pow(cible.z-this.guy.z, 2) < Math.pow(1+cible.hitRange, 2)) {
				this.affect(cible);
			}
		}
		for (var i=0 ; i<this.guy.game.campsMonstres.length ; i++) {
			for (var j=0 ; j<this.guy.game.campsMonstres[i].monstres.length ; j++) {
				var cible = this.guy.game.campsMonstres[i].monstres[j];
				if (Math.pow(cible.x-this.guy.x, 2)+Math.pow(cible.z-this.guy.z, 2) < Math.pow(1+cible.hitRange, 2)) {
					this.affect(cible);
				}
			}
		}
	}

	this.affect = function(cible) {
		cible.hurt(200+1.7*this.guy.dp, 0, 0, 0, this.guy);
		if (cible.team != this.guy.team) {
			cible.etats.setDuring(1, 1.5*20);
		}
	}

	this.cast = function(data) {
		this.data = data;
		if (this.avalaible==0 && !this.guy.game.map.checkMur(data.mouseX, data.mouseY)) {
			this.incantation = this.incant+1;
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 7});
			that.guy.resetPos();
			that.guy.action = "stay";

			var dist;
			this.guy.angle = (function(x, z, data) {
				dist = Math.sqrt(Math.pow(x-data.mouseX, 2)+Math.pow(z-data.mouseY, 2));
				if (dist!=0) {
					return Math.acos((data.mouseX-x)/dist) * sign(data.mouseY-z);
				} else {
					return 0;
				}
			})(this.guy.x, this.guy.z, this.data);

			this.guy.game.emit("position", {id: that.guy.idclient, x: that.guy.x, z: that.guy.z, angle: -that.guy.angle+Math.PI/2});
			this.dist = dist;
		}
	}

}