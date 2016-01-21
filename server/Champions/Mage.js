var Objects = require("../objetserveur.js");

exports.Champion = function(game, nom, idclient, socket, team) {
	Objects.Champion.call(this, game, nom, idclient, socket, team);
	var that = this;

	this.initParam(250, 320, 700, 0, 12, 12, 3, 180, 5, 28, 4, 0.4);

	setTimeout(function() {
		that.game.emit("setMovementSpeed", {id: that.idclient, speed: 180});
	}, 5000);

	this.levelGrid = [0, 100, 300, 600, 900, 1300, 1900, 2900, -1];
	this.pvgrid = [250, 275, 300, 325, 350, 375, 400, 450];
	this.dpgrid = [320, 330, 340, 350, 360, 370, 380, 400];
	this.epgrid = [700, 750, 800, 850, 900, 1000, 1100, 1250];
	this.gpgrid = [0, 0, 0, 0, 0, 0, 0, 0];
	this.drgrid = [12, 12, 13, 13, 14, 14, 15, 16];
	this.ergrid = [12, 12, 13, 13, 14, 14, 15, 16];
	this.grgrid = [3, 3, 3, 3, 3.5, 3.5, 3.5, 4];

	this.addSomeMesh = function(game) {
		game.initial.click.push({nom: "Champions/Mage/feu", x: 0, z: 0, rot: 0, idserveur: null, particleSys: true});
		game.initial.click.push({nom: "Champions/Mage/feu_particle", x: 0, z: 0, rot: 0, idserveur: null, particleSys: true});
		this.idboulefeu2 = game.newid+1;
		game.initial.click.push({nom: "Champions/Mage/feu", x: 0, z: 0, rot: 0, idserveur: null, particleSys: true});
		game.initial.click.push({nom: "Champions/Mage/feu", x: 0, z: 0, rot: 0, idserveur: null, particleSys: true});
		game.initial.click.push({nom: "Champions/Mage/feu", x: 0, z: 0, rot: 0, idserveur: null, particleSys: true});
		this.initSpells(game.newid);
		game.newid += 5;
	}

	this.initSpells = function(idboulefeu) {
		this.spells = [];
		this.spells.push(new Spell0(that, idboulefeu));
		this.spells.push(new Objects.Spell(that, 0, 0, 1));
		this.spells.push(new Spell2(that));
		this.spells.push(new Spell3(that, idboulefeu+2));
	}

}

var Spell0 = function(guy, id, angleInit) {
	Objects.Spell.call(this, guy, 0, 20*10, 0);
	var that = this;
	this.actif = 0;
	this.id = id;
	this.data;
	this.x = 0;
	this.y = 0;
	this.angle = 0;
	this.anim = 0;
	this.lance = true;
	this.angleInit = angleInit;
	this.tirable = true;

	this.action = function(data) {
		this.lance = true;
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
		this.guy.game.emit("anim", {id: that.guy.idclient, val: 5});
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
		if (this.actif > 1 && this.lance) {
			this.x += 0.5*Math.cos(this.angle);
			this.z += 0.5*Math.sin(this.angle);
		}
		if (this.actif > 1 && !this.lance) {
			this.angle += 0.2/3*Math.PI;
			this.x = this.guy.x + 1*Math.cos(this.angle);
			this.z = this.guy.z + 1*Math.sin(this.angle);
		}
		if (this.actif > 1) {
			for (var i=0 ; i<this.guy.game.champions.length ; i++) {
				var cible = this.guy.game.champions[i];
				if (Math.pow(cible.x-this.x, 2)+Math.pow(cible.z-this.z, 2) < Math.pow(0.3+cible.hitRange, 2) && cible.team!=this.guy.team && cible.pv!=0) {
					this.blowup(cible);
				}
			}
			for (var i=0 ; i<this.guy.game.campsMonstres.length ; i++) {
				for (var j=0 ; j<this.guy.game.campsMonstres[i].monstres.length ; j++) {
					var cible = this.guy.game.campsMonstres[i].monstres[j];
					if (Math.pow(cible.x-this.x, 2)+Math.pow(cible.z-this.z, 2) < Math.pow(0.3+cible.hitRange, 2) && cible.pv!=0) {
						this.blowup(cible);
					}
				}
			}
			this.guy.game.emit("position", {id: that.id, x: this.x, z: this.z, angle: 0});
		}
		if (this.actif==1) {
			this.blowup(null);
		}
		if (this.actif>0) {
			this.actif -= 1;
		}
	}

	this.blowup = function(cible) {
		this.tirable = false;
		this.guy.game.emit("anim", {id: that.id, val: 0});
		if (cible!=null) {
			cible.hurt(0, 150 + 1.5*this.guy.ep, 0, 0, this.guy);
		}
		this.actif = 0;
		this.guy.spells[3].checkBlows();
	}

	this.cast = function(data) {
		this.data = data;
		if (this.avalaible==0) {
			this.incantation = this.incant+1;
			that.guy.resetPos();
			that.guy.action = "stay";
		}
	}

	this.castViaUlt = function() {
		this.tirable = true;
		this.lance = false;
		this.angle = this.guy.angle+this.angleInit;
		this.x = this.guy.x + 0.7*Math.cos(this.angle);
		this.z = this.guy.z + 0.7*Math.sin(this.angle);
		this.actif = 20*10;
		this.guy.game.emit("anim", {id: that.id, val: 1});
		this.guy.game.emit("position", {id: that.id, x: this.x, z: this.z, angle: 0});
	}
}

var Spell2 = function(guy) {
	Objects.Spell.call(this, guy, 0, 20*15, 2);
	var that = this;
	this.actif = false;
	this.data;
	this.x = 0;
	this.y = 0;
	this.angle = 0;
	this.anim = 0;
	this.vitesse;

	this.action = function() {
		var dist;
		this.angle = (function(x, z, data) {
			dist = Math.sqrt(Math.pow(x-data.mouseX, 2)+Math.pow(z-data.mouseY, 2));
			if (dist!=0) {
				return Math.acos((data.mouseX-x)/dist) * sign(data.mouseY-z);
			} else {
				return 0;
			}
		})(this.guy.x, this.guy.z, this.data);
		this.x = this.guy.x + 0.7*Math.cos(this.angle);
		this.z = this.guy.z + 0.7*Math.sin(this.angle);
		dist = Math.sqrt(Math.pow(this.x-this.data.mouseX, 2)+Math.pow(this.z-this.data.mouseY, 2));
		this.vitesse = dist / 8;
		this.guy.game.emit("anim", {id: that.guy.idboulefeu2, val: 1});
		this.guy.game.emit("position", {id: that.guy.idboulefeu2, x: this.x, z: this.z, angle: 0});
		this.guy.game.emit("position", {id: that.guy.idclient, x: that.guy.x, z: that.guy.z, angle: -that.angle+Math.PI/2});
		this.guy.angle = this.angle;
		this.actif = 10;
		this.guy.etats.setDuring(1, 8);
	}

	this.update = function() {
		this.incanter();
		if (this.anim > 0) {
			this.anim -= 1;
			if (this.anim == 0 && this.guy.action=="stay") {
				this.guy.game.emit("anim", {id: that.guy.idclient, val: 0});
			}
		}
		if (this.actif > 2) {
			this.x += this.vitesse*Math.cos(this.angle);
			this.z += this.vitesse*Math.sin(this.angle);
			this.guy.game.emit("position", {id: that.guy.idboulefeu2, x: this.x, z: this.z, angle: 0});
		}
		if (this.actif == 2) {
			this.guy.game.emit("anim", {id: that.guy.idboulefeu2, val: 2});
		}
		if (this.actif==1) {
			this.blowup();
		}
		if (this.actif==1) {
			setTimeout(function() {
				that.guy.game.emit("anim", {id: that.guy.idboulefeu2, val: 0});
			}, 120);
		}
		if (this.actif>0) {
			this.actif -= 1;
		}
	}

	this.blowup = function() {
		for (var i=0 ; i<this.guy.game.champions.length ; i++) {
			var cible = this.guy.game.champions[i];
			if (Math.pow(cible.x-this.x, 2)+Math.pow(cible.z-this.z, 2) < Math.pow(1+cible.hitRange, 2)) {
				this.affect(cible);
			}
		}
		for (var i=0 ; i<this.guy.game.campsMonstres.length ; i++) {
			for (var j=0 ; j<this.guy.game.campsMonstres[i].monstres.length ; j++) {
				var cible = this.guy.game.campsMonstres[i].monstres[j];
				if (Math.pow(cible.x-this.x, 2)+Math.pow(cible.z-this.z, 2) < Math.pow(1+cible.hitRange, 2)) {
					this.affect(cible);
				}
			}
		}
	}

	this.affect = function(cible) {
		var angle = (function(x, z, cx, cz) {
			var dist = Math.sqrt(Math.pow(x-cx, 2)+Math.pow(z-cz, 2));
			if (dist!=0) {
				return Math.acos((cx-x)/dist) * sign(cz-z);
			} else {
				return 0;
			}
		})(this.x, this.z, cible.x, cible.z);
		cible.etats.setDuring(3, {time: 4, direction: angle, vitesse: 0.75});
		cible.hurt(0, 200+3*this.guy.ep, 0, 0, this.guy);
	}

	this.cast = function(data) {
		this.data = data;
		if (this.avalaible==0) {
			this.incantation = this.incant+1;
			this.guy.game.emit("anim", {id: that.guy.idclient, val: 5});
			this.anim = 10;
			that.guy.resetPos();
			that.guy.action = "stay";
		}
	}
}

var Spell3 = function(guy, id0) {
	Objects.Spell.call(this, guy, 0, 20*45, 3);
	this.etat = "none";
	this.id0 = id0;
	var that = this;
	this.toSend;

	this.cast = function(data) {
		if (this.etat != "none") { // Tirer une boule
			if (this.boules[this.toSend].tirable == true) {
				this.boules[this.toSend].action(data);
				this.boules[this.toSend].tirable = false;
				this.toSend++;
			} else if (this.toSend!=2) { // Cette boule a déjà explosé, on passe à la suivante
				this.toSend++;
				this.cast(data);
			}
			// this.checkBlows();
		}
		if (this.avalaible==0 && this.etat=="none") { // Lancement du sort
			this.etat = "actif";
			this.actif = 20*10;
			this.boules[0].castViaUlt();
			this.boules[1].castViaUlt();
			this.boules[2].castViaUlt();
			this.toSend = 0;
		}
	}

	this.init = function() {
		this.boules = [];
		this.boules.push(new Spell0(that.guy, that.id0, 0));
		this.boules.push(new Spell0(that.guy, that.id0+1, 2*Math.PI/3));
		this.boules.push(new Spell0(that.guy, that.id0+2, 4*Math.PI/3));
	}

	this.update = function() {
		if (this.avalaible>0) {
			this.avalaible--;
			if (this.guy.socket != null) {
				this.guy.socket.emit("cooldown", {id: that.idspell, ratio: that.avalaible / that.cooldown});
			}
		}
		this.boules[0].update();
		this.boules[1].update();
		this.boules[2].update();
		if (this.actif > 0) {
			this.actif--;
			if (this.actif == 0) {
				this.etat = "none";
				this.toSend = 0;
				this.avalaible = this.cooldown;
			}
		}
	}

	this.checkBlows = function() {
		if (!this.boules[0].tirable && !this.boules[1].tirable && !this.boules[2].tirable && this.avalaible==0) {
			this.etat = "none";
			this.actif = 0;
			this.avalaible = this.cooldown;
		}
	}

	this.init();
}