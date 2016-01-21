var objets_speciaux = [];

objets_speciaux["Champions/Mage/feu"] = function() {

			var map = THREE.ImageUtils.loadTexture( "/graphismes/Champions/Mage/boule_feu.png" );
			var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
			var sprite = new THREE.Sprite( material );

			sprite.scale.x = 0.6;
			sprite.scale.y = 0.7;

			sprite.position.y = +2;
			sprite.visible = false;

			sprite.animations = [];
			sprite.animations[0] = {
				update: function(mesh, delta) {
					return mesh;
				},
				play: function(mesh) {
					mesh.visible = false;
					return mesh;
				}
			};
			sprite.animations[1] = {
				update: function(mesh, delta) {
					return mesh;
				},
				play: function(mesh) {
					mesh.visible = true;
					return mesh;
				}
			};
			return {mesh: sprite};

}

objets_speciaux["Champions/Mage/feu_particle"] = function() {

		var particleCount = 40,
		    particles = new THREE.Geometry(),
			pMaterial = new THREE.ParticleBasicMaterial({
			  color: 0xFFFFFF,
			  size: 0.7,
			  map: THREE.ImageUtils.loadTexture(
			    "/graphismes/Champions/Mage/feu_particle.png"
			  ),
			  blending: THREE.AdditiveBlending,
			  transparent: true
			});

			// now create the individual particles
			for (var p = 0; p < particleCount; p++) {

			  // create a particle with random
			  // position values, -250 -> 250
			  var pteta = Math.random() * 360,
			  	  pphi = Math.random() * 180,
			  	  pl = 0.2 + Math.random() * 0.1;

			  var pX = pl * Math.cos(pphi) * Math.cos(pteta),
			      pY = pl * Math.cos(pphi) * Math.sin(pteta),
			      pZ = pl * Math.sin(pphi),
			      particle = new THREE.Vertex(
			        new THREE.Vector3(pX, pY, pZ)
			      );

			  // add it to the geometry
			  particles.vertices.push(particle);
			}

			// create the particle system
			particleSystem = new THREE.ParticleSystem(
			    particles,
			    pMaterial);


			// also update the particle system to
			// sort the particles which enables
			// the behaviour we want
			particleSystem.sortParticles = true;

			particleSystem.position.y = +2;
			particleSystem.visible = false;

			particleSystem.animations = [];
			particleSystem.animations[0] = {
				update: function(mesh, delta) {
					return mesh;
				},
				play: function(mesh) {
					mesh.visible = false;
					return mesh;
				}
			};
			particleSystem.animations[1] = {
				update: function(mesh, delta) {
					mesh.time += delta;
					if (mesh.time<=0.42) {
						mesh.position.y = -Math.pow((mesh.time-0.21), 2)*4/Math.pow(0.21, 2) + 2 + 4;
					} else {
						mesh.position.y = 2;
					}
					return mesh;
				},
				play: function(mesh) {
					mesh.time = 0;
					mesh.scale.x = 1;
					mesh.scale.z = 1;
					mesh.position.y = +2;
					mesh.visible = true;
					return mesh;
				}
			};
			particleSystem.animations[2] = {
				update: function(mesh, delta) {
					mesh.time += delta;
					console.log(mesh.time);
					if (mesh.time<=0.04) {
						mesh.scale.x = (1 / 0.3) * (mesh.time / 0.04);
						mesh.scale.z = (1 / 0.3) * (mesh.time / 0.04);
					} else {
						mesh.scale.x = (1 / 0.3) * 1;
						mesh.scale.z = (1 / 0.3) * 1;
					}
					return mesh;
				},
				play: function(mesh) {
					mesh.time = 0;
					mesh.position.y = +2;
					return mesh;
				}
			};
			return {mesh: particleSystem};

}

objets_speciaux["Champions/Nova/light_particle"] = function() {

		var particleCount = 30,
		    particles = new THREE.Geometry(),
			pMaterial = new THREE.ParticleBasicMaterial({
			  color: 0xFFFFFF,
			  size: 0.7,
			  map: THREE.ImageUtils.loadTexture(
			    "/graphismes/Champions/Nova/light_particle.png"
			  ),
			  blending: THREE.AdditiveBlending,
			  transparent: true
			});

			// now create the individual particles
			for (var p = 0; p < particleCount; p++) {

			  // create a particle with random
			  // position values, -250 -> 250
			  var pteta = Math.random() * 360,
			  	  pphi = Math.random() * 180,
			  	  pl = 0.2 + Math.random() * 0.1;

			  var pX = pl * Math.cos(pphi) * Math.cos(pteta),
			      pY = pl * Math.cos(pphi) * Math.sin(pteta),
			      pZ = pl * Math.sin(pphi),
			      particle = new THREE.Vertex(
			        new THREE.Vector3(pX, pY, pZ)
			      );

			  // add it to the geometry
			  particles.vertices.push(particle);
			}

			// create the particle system
			particleSystem = new THREE.ParticleSystem(
			    particles,
			    pMaterial);

			// also update the particle system to
			// sort the particles which enables
			// the behaviour we want
			particleSystem.sortParticles = true;

			particleSystem.position.y = +2;
			particleSystem.visible = false;

			particleSystem.animations = [];
			particleSystem.animations[0] = {
				update: function(mesh, delta) {
					return mesh;
				},
				play: function(mesh) {
					mesh.visible = false;
					return mesh;
				}
			};
			particleSystem.animations[1] = {
				update: function(mesh, delta) {
					mesh.rotation.y += 10;
					return mesh;
				},
				play: function(mesh) {
					mesh.visible = true;
					return mesh;
				}
			};

			return {mesh: particleSystem};

}