var Etats = require("./Etats.js");
var Monstres = require("./monstres.js").monstres;

// Un objet serveur traduit la présence d'un mesh indépendant côté client.
var Objet = exports.Objet = function(game, nom, idclient) {
	this.game = game;
	this.nom = nom;
	this.idclient = idclient; //id client possede deux attributs : num(int) et click(bool), qui forment une cle unique

	this.move = function() { //Fonction appelee a chaque iteration

	}
}

// Une entite est un objet ayant des pv, des dégats d'attaque, des sorts, etc...
var Entite = exports.Entite = function(game, nom, idclient, team) {
	Objet.call(this, game, nom, idclient);
	this.team = team;
	this.estMort = false;
	this.action = "stay"; //Action en cours d'execution, qui definit si il peut effectuer une autre action, ou non.
	this.xpworth = 0;
	this.goldworth = 0;
	this.xp = 0;
	this.gold = 0;
	var that = this;
	//Difference entre une action et un etat : une action peut etre remplacee par une autre a tout instant et est unique.
	//Actions : stay, move, hit
	//Etats : mort, stun, cage, silence, ether, invisible

	this.initSpawn = function(spawnX, spawnZ) {
		this.spawnX = spawnX;
		this.spawnZ = spawnZ;
		this.x = spawnX;
		this.z = spawnZ;
		this.angle = 0;
	}

	this.initParam = function(pvmax, dp, ep, gp, dr, er, gr, vitesse, portee, attackSpeed, hitTime, hitRange) {
		this.pvmax = pvmax;
		this.pv = pvmax;
		this.destinations = [{type: "position", x: this.x, z: this.z}];
		this.dp = dp; //damage power
		this.ep = ep; //elemental power
		this.gp = gp; //god power
		this.dr = dr; //damage resistance
		this.er = er; //elemental resistance
		this.gr = gr; //god resistance

		this.vitesse = vitesse * 0.002;
		that.game.emit("setMovementSpeed", {id: that.idclient, speed: vitesse});
		this.portee = portee;
		this.attackSpeed = attackSpeed;
		this.hitTime = hitTime; //Instant de l'animation auquel on prend le coup
		this.attackStage = 0;
		this.hitRange = hitRange;

		this.level = 1;
		this.levelGrid = [-1];
		this.dpgrid = [1];
		this.epgrid = [1];
		this.gpgrid = [1];
		this.drgrid = [1];
		this.ergrid = [1];
		this.grgrid = [1];

	}

	this.getXPGold = function(xp, gold) {
		this.xp += xp;
		this.gold += gold;
		if (this.xp >= this.levelGrid[this.level] && this.levelGrid[this.level] != -1) {
			this.levelUp();
		}
	}

	this.levelUp = function() {
		this.pvmax = this.pvgrid[this.level];
		this.pv += this.pvmax - this.pvgrid[this.level-1];
		this.dp = this.dpgrid[this.level];
		this.ep = this.epgrid[this.level];
		this.gp = this.gpgrid[this.level];
		this.dr = this.drgrid[this.level];
		this.er = this.ergrid[this.level];
		this.gr = this.grgrid[this.level];
		this.level += 1;
		this.game.emit("lvlup", {id: that.idclient, val: that.level});
		this.game.emit("hurt", {id: that.idclient, ratio: that.pv / that.pvmax});
	}

	this.resetPos = function() {
		this.destinations = [{type: "position", x: this.x, z: this.z}];
	}

	this.move = function() {

		//On détermine dist et angle
		var dist, angle;
		var destX, destZ;
		(function(destination, x, z, angle2) {
			if (destination.type == "position") {
				destX = destination.x;
				destZ = destination.z;
			} else if (destination.type=="ennemi") {
				destX = destination.cible.x;
				destZ = destination.cible.z;
			}
			dist = Math.sqrt(Math.pow(x-destX, 2)+Math.pow(z-destZ, 2));
			if (dist!=0) {
				angle = Math.acos((destX-x)/dist) * sign(destZ-z);
			} else {
				angle = angle2;
			}
		})(this.destinations[0], this.x, this.z, this.angle);

		//Determine la nouvelle action
		var action;
		(function(destination, vitesse, portee) {
			if (destination.type == "position" && dist > 0) {
				action = "move";
			} else if (destination.type == "position") {
				action = "stay";
			} else if (destination.type == "ennemi" && dist > (portee+destination.cible.hitRange)) {
				action = "move";
			} else if (destination.type == "ennemi") {
				action = "attack";
			}
		})(this.destinations[0], this.vitesse, this.portee);

		//Verifie la possibilite de l'action vis-a-vis de l'etat du joueur
		action = this.etats.verifier(action);

		//Modification de l'action et emission de l'animation
		if (this.action != action) {
			if (action=="stay") {this.game.emit("anim", {id: this.idclient, val: 0}); }
			if (action=="move") {this.game.emit("anim", {id: this.idclient, val: 1}); }
			if (action=="attack") {this.game.emit("anim", {id: this.idclient, val: 2}); }
			this.action = action;
			if (this.action == "attack" && this.attackStage < this.hitTime) {
				this.attackStage = 0;
			}
		}

		if (this.action=="move") {
			if (dist <= this.vitesse) {
				this.x = destX;
				this.z = destZ;
				if (this.destinations.length > 1) {
					this.destinations.splice(0, 1);
				}
			} else {
				this.x += this.vitesse*Math.cos(angle);
				this.z += this.vitesse*Math.sin(angle);
			}
			this.game.emit("position", {id: this.idclient, x: this.x, z: this.z, angle: -angle+Math.PI/2});
			this.angle = angle;
		} else if (this.action=="attack") {
			if (angle != this.angle) {
				this.game.emit("position", {id: this.idclient, x: this.x, z: this.z, angle: -angle+Math.PI/2}); //L'angle peut changer
				this.angle = angle;
			}
			this.autoAttack();
		}
		if (this.action!="attack" && this.attackStage!=0) {
			this.attackStage = (this.attackStage+1)%this.attackSpeed;
		}

	}

	this.autoAttack = function() {
		this.attackStage++;
		if (this.attackStage == this.hitTime) {
			this.destinations[0].cible.hurt(this.dp, 0, 0, 0, this);
		}
		if (this.attackStage >= this.attackSpeed) {
			this.attackStage -= this.attackSpeed;
			this.game.emit("anim", {id: this.idclient, val: 2});
		}
	}

	this.takeDegats = function(dp, ep, gp, bp, mechant) {
		if (this.pv > 0) {
			var expv = this.pv;
			if (mechant.team != this.team) {
				this.pv -= dp/this.dr + ep/this.er + bp;
				if (this.team!= 0) {
					this.pv -= gp/this.gr;
				}
			} else {
				this.pv += gp;
			}
			if (this.pv <= 0) {
				this.mourir(mechant);
			}
			if (this.pv > this.pvmax) {
				this.pv = this.pvmax;
			}
			if (this.pv != expv) {
				this.game.emit("hurt", {id: this.idclient, ratio: this.pv / this.pvmax});
			}
		}
	}

	this.hurt = function(dp, ep, gp, bp, mechant) {
		this.takeDegats(dp, ep, gp, bp, mechant);
	}

	this.mourir = function(mechant) {
		this.pv = 0;
		this.game.emit("anim", {id: that.idclient, val: 3});
		this.game.emit("mort", {id: that.idclient, val: 24});
		setTimeout(function() {
			that.game.emit("anim", {id: that.idclient, val: 4});
		}, 3000);
		this.etats.setDuring(0, 20*20);
		for (var i=0 ; i<this.game.champions.length ; i++) {
			if (this.game.champions[i].team == mechant.team) {
				this.game.champions[i].getXPGold(this.xpworth, this.goldworth);
			}
		}
		for (var i=0 ; i<this.game.champions.length ; i++) {
			var champ = this.game.champions[i];
			if (champ.destinations[0].type == "ennemi") {
				if (champ.destinations[0].cible == this) {
					champ.destinations = [{type: "position", x: champ.x, z: champ.z}];
				}
			}
		}
		for (var i=0 ; i<this.game.campsMonstres.length ; i++) {
			this.game.campsMonstres[i].stopKillTheDead(this);
		}
		for (var i=0 ; i<this.game.batiments.length ; i++) {
			var champ = this.game.batiments[i];
			if (champ.destinations[0].type == "ennemi") {
				if (champ.destinations[0].cible == this) {
					champ.destinations = [{type: "position", x: champ.x, z: champ.z}];
				}
			}
		}
	}

	this.respawn = function() {
		that.x = that.spawnX;
		that.z = that.spawnZ;
		that.pv = that.pvmax;
		that.destinations = [{type: "position", x: that.x, z: that.z}];
		that.game.emit("hurt", {id: that.idclient, ratio: 1});
		that.game.emit("anim", {id: that.idclient, val: 0});
		that.game.emit("position", {id: that.idclient, x: that.x, z: that.z, angle: 0});
	}


	this.etats = new Etats.Etats(this);
	this.spells = [];
	this.spells.push(new Spell(0));
	this.spells.push(new Spell(0));
	this.spells.push(new Spell(0));
	this.spells.push(new Spell(0));

	this.addSomeMesh = function(game) {};
}

var CampMonstre = exports.CampMonstre = function(game, listeDuCamp, newid) {
	this.monstres = [];
	var that = this;
	for (var i=0 ; i<listeDuCamp.length ; i++) {
		var monstre = Monstres[listeDuCamp[i].id];
		this.monstres.push(new Monstre(game, monstre.nom, newid+i ));
		this.monstres[i].initParam(
			monstre.pvmax,
			monstre.dp,
			monstre.ep,
			monstre.gp,
			monstre.dr,
			monstre.er,
			monstre.gr,
			220,
			1,
			monstre.attackSpeed,
			monstre.hitTime,
			0.6
		);
		setTimeout(function() {
			game.emit("setMovementSpeed", {id: newid+i, speed: 220});
		}, 5000);
		this.monstres[i].initSpawn(listeDuCamp[i].x, listeDuCamp[i].z);
		this.monstres[i].xpworth = monstre.xpworth;
	}

	this.update = function() {
		for (var i=0 ; i<this.monstres.length ; i++) {
			var monstre = this.monstres[i];
			monstre.move();
			if (Math.pow(monstre.x - monstre.spawnX, 2) + Math.pow(monstre.z - monstre.spawnZ, 2) > 16) {
				monstre.pv = monstre.pvmax;
				monstre.destinations = [{type: "position", x: monstre.spawnX, z: monstre.spawnZ}]
				game.emit("hurt", {id: monstre.idclient, ratio: 1});
			}
		}
	}

	this.stopKillTheDead = function(victime) {
		for (var i=0 ; i<this.monstres.length ; i++) {
			var monstre = this.monstres[i];
			if (monstre.destinations[0].type=="ennemi") {
				if (monstre.destinations[0].cible==victime) {
					monstre.destinations = [{type: "position", x: monstre.spawnX, z: monstre.spawnZ}];
				}
			}
		}
	}
}

//Un monstre est une entite qui va te defoncer la gueule si tu l'attaques
var Monstre = function(game, nom, idclient) {
	Entite.call(this, game, nom, idclient, 0);

	this.hurt = function(dp, ep, gp, bp, mechant) {
		this.takeDegats(dp, ep, gp, bp, mechant);
		if (this.destinations[0].type == "position") {
			// this.destinations = this.game.map.findPath(this.x, this.z, "ennemi", mechant);
			this.destinations = [{type: "ennemi", cible: mechant}];
		}
	}
}

//Un champion est une entite avec un socket
var Champion = exports.Champion = function(game, nom, idclient, socket, team) {
	Entite.call(this, game, nom, idclient, team);
	this.socket = socket;
	this.initParam(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
	this.xpworth = 150;
	if (team==1) {
		this.initSpawn(-19, 0);
	} else {
		this.initSpawn(19, 0);
	}
	var that = this;

	socket.on("move", function(pos) {
		if (!that.estMort) {
			that.destinations = that.game.map.findPath(that.x, that.z, "position", {x: pos.x, z: pos.z});
		}
	});

	socket.on("select", function(idserveur) {
		if (idserveur.type=="champion") {
			var cible = that.game.champions[idserveur.num];
		} else if (idserveur.type=="monstre") {
			var cible = that.game.campsMonstres[idserveur.numCamp].monstres[idserveur.num];
		} else if (idserveur.type=="batiment") {
			var cible = that.game.batiments[idserveur.num];
		}
		if (cible.team != that.team) {
			that.destinations = that.game.map.findPath(that.x, that.z, "ennemi", cible);
		}
	});

	socket.on("spell", function(obj) {
		if (that.etats.canCast()) {
			that.spells[obj.val].cast(obj.data);
		}
	});
}

var Spell = exports.Spell = function(guy, incant, cooldown, idspell) {
	this.guy = guy;
	this.incant = incant;
	this.cooldown = cooldown;
	this.avalaible = 0; // Egal au cooldown lorsque le sort est lance
	this.incantation = 0;
	this.idspell = idspell;
	var that = this;

	this.action = function() {
		//Fonction executee apres un temps egal a incant (! en ms)
	}

	this.update = function() {
		//Fonction executee a chaque iteration de champion.move
		this.incanter();
	}

	this.incanter = function() {
		if (this.avalaible!=0) {
			this.avalaible -= 1;
			if (this.guy.socket != null) {
				this.guy.socket.emit("cooldown", {id: that.idspell, ratio: this.avalaible / this.cooldown});
			}
		}
		if (this.incantation!=0) {
			this.incantation -= 1;
			if (this.incantation==0) {
				this.avalaible = this.cooldown;
				this.action();
			} else if (this.guy.action != "stay") {
				this.incantation = 0;
			}
		}
	}

	this.cast = function(data) {
		//Fonction appelee a l'execution
		if (this.avalaible==0) {
			this.incantation = this.incant+1;
		}
	}
}

var Tower = exports.Tower = function(game, idclient, team) {
	Entite.call(this, game, "Tower", idclient, team);
	this.initSpawn(18 * (team == 1 ? -1 : 1), 0);
	this.initParam(2000, 0, 0, 100, 10, 10, 10, 0, 2, 0, 0, 1);

	this.mourir = function() {
		for (var i=0 ; i<this.game.champions.length ; i++) {
			var champ = this.game.champions[i];
			if (champ.team==this.team) {
				champ.socket.emit("endOfGame", false);
			} else {
				champ.socket.emit("endOfGame", true);
			}
		}
	}

	this.update = function() {
		protecteur = this.game.batiments[4-this.team];
		if (Math.pow(protecteur.x-this.x, 2) + Math.pow(protecteur.z-this.z, 2) <= 12 && !protecteur.etats.checkOne(0) ) {
			protecteur.hurt(0, 0, 10, 0, this)
		} else {
			for (var i=0 ; i<this.game.champions.length ; i++) {
				var champ = this.game.champions[i];
				if (Math.pow(champ.x-this.x, 2) + Math.pow(champ.z-this.z, 2) <= 5) {
					champ.hurt(0, 0, 10, 0, this);
				}
			}
		}
	}
}

var Protecteur = exports.Protecteur = function(game, idclient, team) {
	Entite.call(this, game, "Protecteur", idclient, team)
	this.initSpawn(16 * (team == 1 ? -1 : 1), 0);
	this.initParam(600, 700, 0, 0, 20, 10, 10, 80, 1.8, 40, 4, 1.2);
	this.xpworth = 200;
	this.count = 0;
	this.etats.setDuring(0, 2000);

	this.update = function() {
		this.count = (this.count + 1) % 2000; // 2 minutes
		switch (this.count) {
			case 1900:
				if (!this.etats.checkOne(0)) {
					this.hurt(0, 0, 0, this.pvmax, this.game.batiments[2-this.team]);
				}
				break;
			case 1996:
				this.pvmax += 200;
				this.dp += 10;
				this.x = this.spawnX;
				this.z = this.spawnZ;
				this.etats.etats[0].actif = 1;
				break;
			case 1999:
				this.destinations = [
					{type: "position", x: -2*(this.team==1 ? 1 : -1), z: -2*(this.team==1 ? 1 : -1)},
					{type: "ennemi", cible: game.batiments[4-team]}
				];
				break;
		}
		if (this.destinations.length != 0 && this.destinations[this.destinations.length-1].type == "position") {
			this.destinations = [
				{type: "position", x: +2*(this.team==1 ? 1 : -1), z: +2*(this.team==1 ? 1 : -1)},
				{type: "ennemi", cible: game.batiments[2-team]}
			];
		}
		this.move();
	}

	this.hurt = function(dp, ep, gp, bp, mechant) {
		this.takeDegats(dp, ep, gp, bp, mechant);
		if (this.etats.checkOne(0)) {
			this.etats.setDuring(0, 2000); // A modifier des que je peux choisir le temps mort a la mano
		}
	}

}
