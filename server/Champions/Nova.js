var Objects = require("../objetserveur.js");

exports.Champion = function(game, nom, idclient, socket, team) {
	Objects.Champion.call(this, game, nom, idclient, socket, team);
	var that = this;

	this.initParam(250, 320, 0, 100, 10, 10, 4, 180, 4, 24, 4, 0.4);

	setTimeout(function() {
		that.game.emit("setMovementSpeed", {id: that.idclient, speed: 180});
	}, 5000);

	this.levelGrid = [0, 100, 300, 600, 900, 1300, 1900, 2900, -1];
	this.pvgrid = [250, 275, 300, 325, 350, 375, 400, 450];
	this.dpgrid = [320, 330, 340, 350, 360, 370, 380, 400];
	this.epgrid = [0, 0, 0, 0, 0, 0, 0, 0];
	this.gpgrid = [100, 120, 140, 170, 200, 225, 250, 300];
	this.drgrid = [10, 10, 11, 11, 12, 12, 13, 14];
	this.ergrid = [10, 10, 11, 11, 12, 12, 13, 14];
	this.grgrid = [4, 4, 4, 4, 4.5, 4.5, 5, 6];

	this.addSomeMesh = function() {
		game.initial.click.push({nom: "Champions/Nova/SuperNova", x: 0, z: 0, rot: 0, idserveur: null});
		game.initial.click.push({nom: "Champions/Nova/SuperNova", x: 0, z: 0, rot: 0, idserveur: null});
		game.initial.click.push({nom: "Champions/Nova/light_particle", x: 0, z: 0, rot: 0, idserveur: null, particleSys: true});
		var supernovaid = game.newid;
		game.newid += 3;
		this.spells = [];
		this.spells.push(new Spell0(that, supernovaid+1));
		this.spells.push(new Spell1(that, supernovaid+2));
		this.spells.push(new Objects.Spell(that, 0, 0, 1));
		this.spells.push(new Spell3(that, supernovaid));
	}
}

var Spell0 = function(guy, id) {
	Objects.Spell.call(this, guy, 0, 20*10, 0);
	this.x;
	this.z;
	this.id = id;
	var that = this;

	this.update = function() {
		this.incanter();
		if (this.actif == 1) {
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 0});
			this.guy.game.emit("anim", {id: that.id, val: 0});
		}
		if (this.actif > 0) {
			this.actif--;
		}
	}

	this.affect = function(cible) {
		cible.hurt(0, 0, 30 + 1 * this.guy.gp, 0, this.guy);
	}

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
			this.x = data.mouseX;
			this.z = data.mouseY;
			this.incantation = this.incant+1;
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 2});
			this.guy.game.emit("position", {id: that.guy.idclient, x: that.guy.x, z: that.guy.z, angle: -that.guy.angle+Math.PI/2});
			that.guy.resetPos();
			that.guy.action = "stay";
		}
	}

	this.action = function() {
		this.guy.game.emit("position", {id: that.id, x: that.x, z: that.z, angle: 0});
		this.guy.game.emit("anim", {id: that.id, val: 1});
		this.actif = 12;
		this.guy.etats.setDuring(1, 14);
		for (var i=0 ; i<this.guy.game.champions.length ; i++) {
			var cible = this.guy.game.champions[i];
			if (Math.pow(cible.x-this.guy.x, 2)+Math.pow(cible.z-this.guy.z, 2) < Math.pow(2+cible.hitRange, 2)) {
				this.affect(cible);
			}
		}
	}
}

var Spell1 = function(guy, id) {
	Objects.Spell.call(this, guy, 0, 20*12, 1);
	var that = this;
	this.actif = 0;
	this.id = id;
	this.data;
	this.x = 0;
	this.y = 0;
	this.angle = 0;
	this.anim = 0;

	this.action = function(data) {
		if (data!=null) {
			this.data = data;
		}
		this.angle = (function(x, z, data) {
			var dist = Math.sqrt(Math.pow(x-data.mouseX, 2)+Math.pow(z-data.mouseY, 2));
			if (dist!=0) {
				return Math.acos((data.mouseX-x)/dist) * sign(data.mouseY-z);
			} else {
				return 0;
			}
		})(this.guy.x, this.guy.z, this.data);
		this.guy.game.emit("anim", {id: that.id, val: 1});
		this.x = this.guy.x + 0.2*Math.cos(this.angle);
		this.z = this.guy.z + 0.2*Math.sin(this.angle);
		this.guy.game.emit("position", {id: that.id, x: this.x, z: this.z, angle: 0});
		this.guy.game.emit("position", {id: that.guy.idclient, x: that.guy.x, z: that.guy.z, angle: -that.angle+Math.PI/2});
		this.guy.angle = this.angle;
		this.actif = 10;
		this.guy.etats.setDuring(1, 8);
		this.guy.game.emit("anim", {id: that.guy.idclient, val: 2});
		this.anim = 8;
	}

	this.update = function() {
		this.incanter();
		if (this.anim > 0) {
			this.anim -= 1;
			if (this.anim == 0 && this.guy.action=="stay") {
				this.guy.game.emit("anim", {id: that.guy.idclient, val: 0});
			}
		}
		if (this.actif > 1) {
			this.x += 0.5*Math.cos(this.angle);
			this.z += 0.5*Math.sin(this.angle);
		}
		if (this.actif > 1) {
			for (var i=0 ; i<this.guy.game.champions.length ; i++) {
				var cible = this.guy.game.champions[i];
				if (Math.pow(cible.x-this.x, 2)+Math.pow(cible.z-this.z, 2) < Math.pow(0.3+cible.hitRange, 2) && cible.team!=this.guy.team && cible.pv!=0) {
					this.affect(cible);
				}
			}
			this.guy.game.emit("position", {id: that.id, x: this.x, z: this.z, angle: 0});
		}
		if (this.actif==1) {
			this.blowup();
		}
		if (this.actif>0) {
			this.actif -= 1;
		}
	}

	this.blowup = function(cible) {
		this.guy.game.emit("anim", {id: that.id, val: 0});
		this.actif = 0;
	}

	this.affect = function(cible) {
		cible.hurt(0, 0, 40+0.3*this.guy.gp, 0, this.guy);
		cible.etats.setDuring(1, 20*1.5);
	}

	this.cast = function(data) {
		this.data = data;
		if (this.avalaible==0) {
			this.incantation = this.incant+1;
			that.guy.resetPos();
			that.guy.action = "stay";
		}
	}

}

var Spell3 = function(guy, id) {
	Objects.Spell.call(this, guy, 0, 20*40, 3);
	this.x;
	this.z;
	this.id = id;
	var that = this;

	this.update = function() {
		this.incanter();
		if (this.actif > 0) {
			for (var i=0 ; i<this.guy.game.champions.length ; i++) {
				var cible = this.guy.game.champions[i];
				if (Math.pow(cible.x-this.x, 2)+Math.pow(cible.z-this.z, 2) < Math.pow(2+cible.hitRange, 2)) {
					this.affect(cible);
				}
			}
		}
		if (this.actif == 68) {
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 0});
		}
		if (this.actif == 1) {
			this.guy.game.emit("anim", {id: that.id, val: 0});
		}
		if (this.actif > 0) {
			this.actif--;
		}
	}

	this.affect = function(cible) {
		cible.hurt(0, 0, 2 + 0.06 * this.guy.gp, 0, this.guy);
	}

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
			this.x = data.mouseX;
			this.z = data.mouseY;
			this.incantation = this.incant+1;
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 2});
			this.guy.game.emit("position", {id: that.guy.idclient, x: that.guy.x, z: that.guy.z, angle: -that.guy.angle+Math.PI/2});
			that.guy.resetPos();
			that.guy.action = "stay";
		}
	}

	this.action = function() {
		this.guy.game.emit("position", {id: that.id, x: that.x, z: that.z, angle: 0});
		this.guy.game.emit("anim", {id: that.id, val: 1});
		this.actif = 80;
		this.guy.etats.setDuring(1, 14);
	}
}