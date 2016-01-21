exports.Etats = function(guy) {
	this.guy = guy;
	var that = this;

	this.init = function() {
		this.etats = [];
		this.etats.push(new Mort(that.guy));
		this.etats.push(new Stun(that.guy));
		this.etats.push(new Aveugle(that.guy));
		this.etats.push(new Push(that.guy));
	}

	this.verifier = function(action) {
		for (var i=0 ; i<this.etats.length ; i++) {
			action = this.etats[i].update(action);
		}
		return action;
	}

	this.checkOne = function(num) {
		return (this.etats[num].actif != 0)
	}

	this.canCast = function() {
		if (this.etats[0].actif!=0 ||this.etats[1].actif!=0) {
			return false;
		}
		return true;
	}

	this.setDuring = function(num, time) {
		this.etats[num].setDuring(time);
	}

	this.init();

}


var Etat = function(guy) {
	this.guy = guy;
	this.actif = 0;
	var that = this;

	this.callback = function() {}

	this.setDuring = function(time) {
		this.actif = time;
		// this.guy.action = "stay";
	}

	this.update = function(action) {
		if (this.actif > 0) {
			this.actif--;
			if (this.actif==0) {
				this.callback();
			}
			return this.verifier(action);
		} else {
			return action;
		}
	}

	this.verifier = function(action) {
		return action;
	}
}

var Mort = function(guy) {
	Etat.call(this, guy);
	var that =this;
	
	this.setDuring = function(time) {
		this.actif = time;
		this.guy.action = "stay";
	}
	
	this.verifier = function(action) {
		if ((that.actif*60) % 1000 < 60) {
			that.guy.game.emit("mort", {id: that.guy.idclient, val: Math.floor(that.actif*60/1000)});
		}
		return "stay";
	}

	this.callback = function() {
		this.guy.game.emit("mort", {id: that.guy.idclient, val: 0});
		this.guy.respawn();
	}
}

var Stun = function(guy) {
	Etat.call(this, guy);
	var that = this;

	this.setDuring = function(time) {
		this.actif = time;
		this.guy.game.emit("etat", {id: that.guy.idclient, val: true, num: 1});
	}

	this.callback = function() {
		this.guy.game.emit("etat", {id: that.guy.idclient, val: false, num: 1});
	}

	this.verifier = function() {
		return "stay";
	}
}

var Aveugle = function(guy) {
	Etat.call(this, guy);

	this.verifier = function(action) {
		if (action == "attack") {
			return "stay";
		} else {
			return action;
		}
	}
}

var Push = function(guy) {
	Etat.call(this, guy);
	var that = this;

	this.setDuring = function(obj) {
		this.actif = obj.time;
		this.direction = obj.direction;
		this.vitesse = obj.vitesse;
		this.guy.game.emit("etat", {id: that.guy.idclient, val: true, num: 1});
	}

	this.callback = function() {
		this.guy.game.emit("etat", {id: that.guy.idclient, val: false, num: 1});
	}

	this.update = function(action) {
		if (this.actif > 0) {
			this.actif--;
			if (this.actif==0) {
				this.callback();
			}
			return this.verifier(action);
		} else {
			return action;
		}
	}

	this.verifier = function() {
		if (!this.guy.game.map.checkMur(
			this.guy.x + this.vitesse * Math.cos(this.direction),
			this.guy.z + this.vitesse * Math.sin(this.direction)
		)) {
			this.guy.x += this.vitesse * Math.cos(this.direction);
			this.guy.z += this.vitesse * Math.sin(this.direction);
			this.guy.game.emit("position", {id: this.guy.idclient, x: this.guy.x, z: this.guy.z, angle: -this.guy.angle+Math.PI/2});
		}
		return "stay";
	}
}