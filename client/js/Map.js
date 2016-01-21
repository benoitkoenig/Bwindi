Jeu.Map = {};

Jeu.Map.View = Backbone.View.extend({
	el: $("#canvas"),

	initialize: function(i, s) {
		var socket;
		this.initial = i;
		socket = s;
		this.load();
	},

	initCamSceneRendererLightMap: function() {

		$(this.el).css("display", "inline");
		document.getElementById("canvas").width = $(document).width();
		document.getElementById("canvas").height = $(document).height();

		this.camera;
		this.scene;
		this.renderer;
		this.light;
		this.light2;
		this.map;

		this.clock = new THREE.Clock();
		this.clock.start();

		this.w = window.innerHeight / window.innerWidth;
		this.camera = new THREE.OrthographicCamera(-20/2, 20/2, this.w*20/2, -this.w*20/2, 1, 10000);
		// this.camera = new THREE.PerspectiveCamera(55, 1 / this.w, 1, 1000);

		this.camera.position.x = this.initial.initial.click[this.initial.id].x;
		this.camera.position.y = 10;
		this.camera.position.z = this.initial.initial.click[this.initial.id].z + 6;
		this.camera.rotation.x = -1;

		this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer({antialias: true});
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.setClearColor(0x003300, 0.6)

		document.body.appendChild( this.renderer.domElement );

		this.renderer.domElement.style.position = "absolute";
		this.renderer.domElement.style.top  = 0;
		this.renderer.domElement.style.left = 0;

		this.light2 = new THREE.PointLight(0xffffff, 1, 100);
		this.light2.position.x = this.initial.initial.click[this.initial.id].x;
		this.light2.position.y = 10;
		this.light2.position.z = this.initial.initial.click[this.initial.id].z + 6;

		this.light = new THREE.AmbientLight(0xffffff);

		this.loader = new THREE.JSONLoader();
		var that = this;
		this.loader.load("graphismes/map.js", function(geometry, materials) {
			that.map = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
			that.scene.add(that.map);
		});

		this.scene.add(this.camera);
		this.scene.add(this.light);
		this.scene.add(this.light2);

		//I'm creating this to make the champion-click possible.
		this.projector = new THREE.Projector();
	},

	initObjets: function() {
		this.objets = new Jeu.Objets.Collection();
		this.objets.create(this.initial, this.scene, this.imgportevie, this.imgvie, this.imgmana);
		this.identite = this.initial.id;
	},

	initInterface: function() {
		this.interface = new Jeu.Interface.View();
		this.ips = 0;
		var that = this;
		setInterval(function() {
			that.interface.setIPS(that.ips / 4);
			that.ips = 0;
		}, 4000);
	},

	initEvents: function(socket) {
		this.mouseX = 0;
		this.mouseY = 0;
		var that = this;

		/*$(window).on("resize", function() {
			document.getElementById("canvas").width = $(document).width();
			document.getElementById("canvas").height = $(document).height();
			this.renderer.setSize( window.innerWidth, window.innerHeight );
		});*/

		$(window).on("keydown", function(ev) {
			//65, 90, 69, 82
			if (ev.keyCode==65) {
				socket.emit("spell", {val: 0, data: {mouseX: that.mouseX, mouseY: that.mouseY}});
			}
			if (ev.keyCode==90) {
				socket.emit("spell", {val: 1, data: {mouseX: that.mouseX, mouseY: that.mouseY}});
			}
			if (ev.keyCode==69) {
				socket.emit("spell", {val: 2, data: {mouseX: that.mouseX, mouseY: that.mouseY}});
			}
			if (ev.keyCode==82) {
				socket.emit("spell", {val: 3, data: {mouseX: that.mouseX, mouseY: that.mouseY}});
			}
		});

		$(window).on("click", function(ev2) {
			ev2.preventDefault();
			//we see if he selected anyone :-)

			var idZ = -1;
			(function() {
				var mouseX = ((ev2.clientX) / (document.getElementById("canvas").width)) * 2 - 1;
				var mouseY = - ((ev2.clientY) / (document.getElementById("canvas").height)) * 2 + 1;
				var vector = new THREE.Vector3(mouseX, mouseY, 0.5);
				var ray = that.projector.pickingRay(vector, that.camera);
				var minZ = -10000;
				for (var i=0 ; i<that.objets.length ; i++) {
					if (that.objets.models[i].idserveur) { // if it can be selected
						var intersects = ray.intersectObject(that.objets.models[i].mesh);
						if (intersects.length > 0) {
							if (that.objets.models[i].mesh.position.z > minZ && !that.objets.models[i].estMort) {
								minZ = that.objets.models[i].mesh.position.z;
								idZ = i;
							}
						}
					}
				}
			})();

			if (idZ != -1) { //The player clicked on an ennemy.
				socket.emit("select", that.objets.models[idZ].idserveur);
			} else {
				var newPos;
				(function() { //Calcul de newPos
					var ev = {};
					ev.x = ( (ev2.clientX) / (document.getElementById("canvas").width) - 0.5 ) * 20;
					ev.z = ( (ev2.clientY) / (document.getElementById("canvas").height) - 0.5 ) * 20*that.w;
					newPos = {};
					newPos.x = ev.x + that.camera.position.x;
					newPos.z = ev.z + ( that.camera.position.z - 10/Math.tan(1) );
					newPos.type = "position"; //le type détermine si on vise une position ou une unité
				})();
				socket.emit("move", newPos);
			}
		});

		$(window).on("mousemove", function(ev2) {
			var evx = ( (ev2.clientX) / (document.getElementById("canvas").width) - 0.5 ) * 20;
			var evz = ( (ev2.clientY) / (document.getElementById("canvas").height) - 0.5 ) * 20*that.w;
			that.mouseX = evx + that.camera.position.x;
			that.mouseY = evz + ( that.camera.position.z - 10/Math.tan(1) );
		});
	},

	initSockets: function(socket) { // Gerer les sockets de facon plus propre pls :)
		var that = this;

		socket.on("position", function(obj) {
			if (obj.id==that.identite) {
				that.camera.position.x = obj.x;
				that.camera.position.z = obj.z+6;
				that.light2.position.x = obj.x;
				that.light2.position.z = obj.z+6;
				that.objets.View2D.setCam(obj.x, obj.z);
			}
			that.objets.setPos(obj.id, obj.x, obj.z, obj.angle, that.camera.position.x, that.camera.position.z);
		});

		socket.on("anim", function(obj) {
			that.objets.setAnim(obj.id, obj.val);
		});

		socket.on("hurt", function(obj) {
			that.objets.setLife(obj.id, obj.ratio);
		});

		socket.on("lvlup", function(obj) {
			that.objets.lvlup(obj.id, obj.val);
		});

		socket.on("etat", function(obj) {
			that.objets.setEtat(obj.id, obj.num, obj.val);
		});

		socket.on("setMovementSpeed", function(obj) {
			that.objets.setMovementSpeed(obj.id, obj.speed);
		});

		socket.on("cooldown", function(obj) {
			that.interface.setCoolDown(obj.id, obj.ratio);
		});

		socket.on("endOfGame", function(victoire) {
			if (victoire) {
				alert("Victoire !");
			} else {
				alert("Défaite..");
			}
			document.location.href=document.location.href;
		});

		socket.on("mort", function(obj) {
			that.objets.models[obj.id].estMort = (obj.val!=0);
			if (obj.id==that.identite) {
				that.interface.setDeathCount(obj.val);
			}
		});
	},

	initRender: function(that) {
		var that = this;
		var render = function() {
			requestAnimationFrame(render);
			var delta = that.clock.getDelta();
			that.objets.update(delta);
			that.renderer.render(that.scene, that.camera);
			that.ips++;
		}
		render();
	},

	load: function() {
		this.initCamSceneRendererLightMap();
		this.initObjets();
		this.initInterface();
		this.initEvents(socket);
		this.initSockets(socket);
		this.initRender();
	}

});