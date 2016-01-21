exports.Map = function() {

	this.init = function() {
		this.noeuds = [];
		this.murs = [];
		var data = require("./MapData.js").data;
		for (var i=0 ; i<data.noeuds.length ; i++) {
			this.noeuds.push(new Noeud(data.noeuds[i].x/25-20, data.noeuds[i].z/25-10, new Zone(data.noeuds[i].zones), data.noeuds[i].voisins));
		}
		for (var i=0 ; i<data.murs.length ; i++) {
			this.murs.push(new Zone(data.murs[i]));
		}
	}

	this.cheminDirect = function(xi, zi, xf, zf) {
		var dist, angle;
		dist = Math.sqrt(Math.pow(xf-xi, 2)+Math.pow(zf-zi, 2));
		angle = Math.acos((xf-xi)/dist) * sign(zf-zi);
		for (var i=0 ; i<=dist ; i+=0.1) {
			if (this.checkMur(xi + i*Math.cos(angle), zi + i*Math.sin(angle))) {
				return false;
			}
		}
		return true;
	}

	this.checkMur = function(x, z) {
		if (Math.abs(x) > 20 || Math.abs(z) > 10) {
			return true;
		}
		for (var i=0 ; i<this.murs.length ; i++) {
			if (this.murs[i].checkInZone(x, z)) {
				return true;
			}
			if (this.murs[i].checkInZone(-x, -z)) {
				return true;
			}
		}
		return false;
	}

	this.recalculate = function(x, z, xi, zi) { //Normalement, ne depend pas de xi et zi
		for (var i=0 ; i<this.murs.length ; i++) {
			if (this.murs[i].checkInZone(x, z)) { //Devrait impliquer un produit scalaire
				return {x: xi, z: zi};
			}
		}
		return {x: x, z: z};
	}

	this.findPath = function(xi, zi, type, destination) {
		var xf = destination.x;
		var zf = destination.z;
		var obj = this.recalculate(xf, zf, xi, zi); //Normalement, ne depend pas de xi et zi. Normalement..
		xf = obj.x;
		zf = obj.z;
		if (xi==xf && zi==zf) {
			return [{type: "position", x: xf, z: zf}];
		}
		if (this.cheminDirect(xi, zi, xf, zf)) {
			if (type=="position") {
				return [{type: "position", x: xf, z: zf}];
			} else {
				return [{type: "ennemi", cible: destination}];
			}
		} else {
			var noeudI = new Noeud(xi, zi, new Zone([]));
			var noeudF = new Noeud(xf, zf, new Zone([]));
			var sousgraphe = [];

			for (var i=0 ; i<this.noeuds.length ; i++) {
				sousgraphe.push([-1, 10000]);
			}
			sousgraphe.push([-1, 0]);
			sousgraphe.push([-1, 10000]);
			var retour = this.initdijksta(noeudI, noeudF, sousgraphe);
			if (type == "position") {
				retour.push({type: "position", x: xf, z: zf});
			} else {
				retour.push({type: "ennemi", cible: destination});
			}
			if (retour.length == 1) {
				retour = [{type: "position", x: xi, z: zi}];
			}
			return retour;
		}
	}

	this.initdijksta = function(noeudI, noeudF, sousgraphe) {
		var min = 0;
		for (var i=0 ; i<this.noeuds.length ; i++) {
			if (this.noeuds[i].zone.checkInZone(noeudI.x, noeudI.z)) {
				var dist = Math.sqrt( Math.pow(noeudI.x-this.noeuds[i].x ,2) + Math.pow(noeudI.z-this.noeuds[i].z ,2) );
				sousgraphe[i] = [sousgraphe.length-2, dist];
			}
		}
		return this.dijkstra(this.newMin(min, sousgraphe), noeudI, noeudF, sousgraphe );
	}

	this.dijkstra = function(min, noeudI, noeudF, sousgraphe) {
		console.log(sousgraphe);
		if (min>=sousgraphe[sousgraphe.length-1][1]) {
			return this.finir(sousgraphe);
		}
		for (var i=0 ; i<sousgraphe.length ; i++) {
			if (sousgraphe[i][1] == min) {
				for (var j=0 ; j<this.noeuds[i].voisins.length ; j++) {
					var voisin = this.noeuds[i].voisins[j];
					var dist = Math.sqrt( Math.pow(this.noeuds[voisin].x-this.noeuds[i].x,2) + Math.pow(this.noeuds[voisin].z-this.noeuds[i].z,2) );
					if (sousgraphe[voisin][1] > sousgraphe[i][1]+dist) {
						sousgraphe[voisin] = [i, sousgraphe[i][1]+dist];
					}
				}
				if (this.noeuds[i].zone.checkInZone(noeudF.x, noeudF.z)) {
					var dist = Math.sqrt( Math.pow(noeudF.x-this.noeuds[i].x,2) + Math.pow(noeudF.z-this.noeuds[i].z,2) );
					if (sousgraphe[sousgraphe.length-1][1] > sousgraphe[i][1]+dist) {
						sousgraphe[sousgraphe.length-1] = [i, sousgraphe[i][1]+dist];
					}
				}
			}
		}
		return this.dijkstra(this.newMin(min, sousgraphe), noeudI, noeudF, sousgraphe );
	}

	this.finir = function(sousgraphe) {
		// console.log(sousgraphe);
		if (sousgraphe[sousgraphe.length-1][0] == -1) {
			return []; //This must never happen
		}
		var chaineInverse = [sousgraphe.length-1];
		while (chaineInverse[chaineInverse.length-1] != sousgraphe.length-2) {
			chaineInverse.push(sousgraphe[chaineInverse[chaineInverse.length-1]][0]);
		}
		var valeurRetour = [];
		for (var i=chaineInverse.length-2 ; i>0 ; i--) {
			valeurRetour.push({type: "position", x: this.noeuds[chaineInverse[i]].x, z: this.noeuds[chaineInverse[i]].z});
		}
		return valeurRetour;
	}

	this.newMin = function(minActu, sousgraphe) {
		var min = 10000;
		for (var i=0 ; i<sousgraphe.length ; i++) {
			if (sousgraphe[i][1] > minActu && sousgraphe[i][1] < min) {
				min = sousgraphe[i][1];
			}
		}
		return min;
	}

	this.init();
}

var Zone = function(zones) {
	this.zones_convexes = [];
	for (var i=0 ; i<zones.length ; i++) {
		this.zones_convexes.push(new Zone_Convexe(zones[i]));
	}

	this.checkInZone = function(x, z) {
		for (var i=0 ; i<this.zones_convexes.length ; i++) {
			if (this.zones_convexes[i].checkInZone(x, z)) {
				return true;
			}
		}
		return false;
	}
}

// Attention a bien donner les points dans l'ordre trigonometrique. Zone convexe uniquement
var Zone_Convexe = function(points) {
	this.reperes = [];

	this.equationner = function(p1, p2) {
		if (p1 != p2) {
			var obj = {};
			obj.x = p1[0]/25-20;
			obj.z = p1[1]/25-10;
			var dist = Math.sqrt( Math.pow(p2[0]-p1[0], 2) + Math.pow(p2[1]-p1[1], 2) );
			obj.angle = Math.acos( (p2[0]-p1[0]) / dist );
			if (p2[1]<p1[1]) {
				obj.angle = -obj.angle;
			}
			this.reperes.push(obj);
		}
	}

	this.checkInZone = function(x, z) {
		for (var i=0 ; i<this.reperes.length ; i++) {
			var dist = Math.sqrt( Math.pow(x-this.reperes[i].x, 2) + Math.pow(z-this.reperes[i].z, 2) );
			var angle = Math.acos( (x-this.reperes[i].x) / dist );
			if (z<this.reperes[i].z) {
				angle = -angle;
			}
			var ecartAng = (angle - this.reperes[i].angle + 2*Math.PI) % (2*Math.PI);
			if (ecartAng > Math.PI) {
				return false;
			}
		}
		return true;
	}

	for (var i=0 ; i<points.length-1 ; i++) {
		this.equationner(points[i], points[i+1]);
	}
	this.equationner(points[points.length-1], points[0]);

}

// Un noeud est représenté par un point (X, Z) et une zone. Tous les points dans cette zone sont voisin.
var Noeud = function(x, z, zone, voisins) {
	this.x = x;
	this.z = z;
	this.zone = zone;
	this.voisins = voisins;
}