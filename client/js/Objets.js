var Jeu = {};
Jeu.Objets = {};
Jeu.Objets.Objet = Backbone.Model.extend({

	enableSkinning: function(skinnedMesh) {
		var materials = skinnedMesh.material.materials;
		for (var i = 0,length = materials.length; i < length; i++) {
			var mat = materials[i];
			mat.skinning = true;
		}
	},

	initialize: function(nom, scene, x, z, rot, idserveur, particleSys) {
		this.init(nom, scene, x, z, rot, idserveur, particleSys);
	},

	init: function(nom, scene, x, z, rot, idserveur, particleSys) {
		this.isEntite = false;
		this.scene = scene;
		this.nom = nom;
		this.estMort = false; //if it is true, the mesh can not be selected
		this.idserveur = idserveur; //Peut etre null
		this.particleSys = particleSys;
		this.initMesh(x, z, rot, particleSys);
	},

	initMesh: function(x, z, rot, particleSystem) {
		if (particleSystem) {
			objet_special = objets_speciaux[this.nom]();
			this.mesh = objet_special.mesh;
			this.scene.add(this.mesh);
			this.current_animation = 0;
			this.animations = objet_special.animations;
			this.setPos(x, z, rot);
		} else {
			var loader = new THREE.JSONLoader();
			var that = this;
			loader.load("graphismes/"+that.nom+".js", function(geometry, materials) {

				that.mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(materials));
				that.enableSkinning(that.mesh);
				that.scene.add(that.mesh);
				for (var i=0 ; i<that.mesh.geometry.animations.length ; i++) {
					THREE.AnimationHandler.add(that.mesh.geometry.animations[i]); //I should only do this here for the champs. But it is too soon to do it now
				}
				that.animations = [];
				for (var i=0 ; i<that.mesh.geometry.animations.length ; i++) {
					that.animations.push( new THREE.Animation(that.mesh, that.mesh.geometry.animations[i].name, THREE.AnimationHandler.CATMULLROM) );
				}
				that.current_animation = 0;
				that.animations[that.current_animation].play();
				that.setPos(x, z, rot);
			});
		}
	},

	setPos: function(x, z, rot) {
		this.mesh.position.x = x;
		this.mesh.position.z = z;
		this.mesh.rotation.y = rot;
	},

	setAnim: function(val) {
		if (!this.particleSys) {
			this.animations[this.current_animation].stop();
			this.current_animation = val;
			this.animations[this.current_animation].play();
		} else {
			this.current_animation = val;
			this.mesh = this.mesh.animations[this.current_animation].play(this.mesh);
		}
	},

	update: function(delta) {
		if (!this.particleSys) {
			if (this.current_animation != 1) {
				this.animations[this.current_animation].update(delta);
			} else { // The entity is moving, so we fix it's movement speed
				this.animations[this.current_animation].update(delta * this.movementSpeed);
			}
			
		} else {
			this.mesh = this.mesh.animations[this.current_animation].update(this.mesh, delta);
		}
	}

});

Jeu.Objets.Entite = Jeu.Objets.Objet.extend({

	initialize: function(nom, scene, x, z, rot, idserveur, imgportevie, imgvie, imgmana) {
		this.init(nom, scene, x, z, rot, idserveur, false);
		this.isEntite = true;
		this.vie = 1;
		this.mana = 1;
		this.level = 1;
		this.etats = [false, false, false];
		this.vieux_x = -200;
		this.vieux_y = -200;
		this.movementSpeed = 1;
	},

	lvlup: function(val) {
		this.level = val;
	},

	setLife: function(ratio) {
		this.vie = ratio;
	},

	setEtat: function(num, val) {
		this.etats[num] = val;
	},

	setMovementSpeed: function(val) {
		this.movementSpeed = val / 100;
	}

});

Jeu.Objets.View_Entites = Backbone.View.extend({
	el: $("#canvas"),

	initialize: function() {
		this.context = document.querySelector("#canvas").getContext("2d");
		this.context.fillStyle = "white";
		this.context.font = "20px Arial";
		this.preload();
		this.camX = 0;
		this.camZ = 0;
	},

	preloading: function(path) {
		img = new Image();
		img.src = path;
		var that = this;
		img.onload = function() {
			that.nbloaded++;
			if (that.nbloaded==4) {
				that.load();
			}
		}
		return img;
	},

	preload: function() {
		this.nbloaded = 0;
		this.imgportevie = this.preloading("../graphismes/2D/porteVie.png");
		this.imgvie = this.preloading("../graphismes/2D/vie.png");
		this.imgmana = this.preloading("../graphismes/2D/mana.png");
		this.imgstun = this.preloading("../graphismes/2D/stun.png");
		// this.imgbas = this.preloading("../graphismes/2D/barre_bas.png");
		// this.imgcooldown = this.preloading("../graphismes/2D/cooldown.png");
	},

	load: function() {
		// Nan bin on fait rien. C'est cool.
	},

	clear_2D: function(entite) {
		// this.context.clearRect(entite.vieux_x-1, entite.vieux_y-1, 120+2, 33+2);
		this.context.clearRect(entite.vieux_x-1, entite.vieux_y-1, 120+2, 71+2);
		// Attention a bien calculer la taille a clean, trop clean c'est des ressources de perdu !
	},

	afficher_2D: function(entite) {
		var x_3D_relatif = entite.mesh.position.x - this.camX;
		var z_3D_relatif = entite.mesh.position.z - this.camZ;
		var w = document.getElementById("canvas").height / document.getElementById("canvas").width;
		var x = ((x_3D_relatif / 20) + 0.5) * document.getElementById("canvas").width - 60;
		var y = ((z_3D_relatif / 20 / w) + 0.5) * document.getElementById("canvas").height - 120;

		if (!entite.estMort) {
			if (entite.etats[1]) {
				this.context.drawImage(this.imgstun, x+10, y+10);
			}
			this.context.drawImage(this.imgvie, x+39, y+11, 75 * entite.vie, 6);
			this.context.drawImage(this.imgmana, x+39, y+16, 70 * entite.mana, 6);
			this.context.drawImage(this.imgportevie, x, y);
			this.context.fillText(entite.level+"", x+19, y+23);
		}

		entite.vieux_x = x;
		entite.vieux_y = y;
	},

	setCam: function(x, z) {
		this.camX = x;
		this.camZ = z;
	}

});

Jeu.Objets.Collection = Backbone.Collection.extend({
	model: Jeu.Objets.Objet,

	initialize: function() {
		this.View2D = new Jeu.Objets.View_Entites();
	},

	create: function(initial, scene, imgportevie, imgvie, imgmana) {
		for (var i=0 ; i<initial.initial.click.length ; i++) { // Pour l'instant on prends le barbare : que des clicks
			var c = initial.initial.click[i];
			var nvObjet;
			if (c.classe == "entite") {
				nvObjet = new Jeu.Objets.Entite(c.nom, scene, c.x, c.z, c.rot, c.idserveur, imgportevie, imgvie, imgmana);
			} else {
				nvObjet = new Jeu.Objets.Objet(c.nom, scene, c.x, c.z, c.rot, c.idserveur, c.particleSys);
			}
			this.add(nvObjet);
		}
		var that = this;
	},

	update: function(delta) {
		for (var i=0 ; i<this.length ; i++) {
			this.models[i].update(delta);
		}
		for (var id=0 ; id<this.length ; id++) {
			if (this.models[id].isEntite) {
				this.View2D.clear_2D(this.models[id]);
			}
		}
		for (var id=0 ; id<this.length ; id++) {
			if (this.models[id].isEntite) {
				this.View2D.afficher_2D(this.models[id]);
			}
		}
	},

	setPos: function(id, x, z, angle, camX, camZ) {
		this.models[id].setPos(x, z, angle, camX, camZ);
	},

	setAnim: function(id, val) {
		this.models[id].setAnim(val);
	},

	setLife: function(id, val) {
		this.models[id].setLife(val);
	},

	lvlup: function(id, val) {
		this.models[id].lvlup(val);
	},

	setEtat: function(id, num, val) {
		this.models[id].setEtat(num, val);
	},

	setMovementSpeed: function(id, val) {
		this.models[id].setMovementSpeed(val);
	}
});