Jeu.Interface = {};

Jeu.Interface.View = Backbone.View.extend({
	el: $("#interface"),

	initialize: function() {
		$(this.el).css("display", "inline");
		document.getElementById("interface").width = $(document).width();
		document.getElementById("interface").height = $(document).height();
		this.context = document.querySelector("#interface").getContext("2d");
		this.context.fillStyle = "white";
		this.context.font = "20px Arial";
		this.preload();
	},

	preloading: function(path) {
		img = new Image();
		img.src = path;
		var that = this;
		img.onload = function() {
			that.nbloaded++;
			if (that.nbloaded==1) {
				that.load();
			}
		}
		return img;
	},

	preload: function() {
		this.nbloaded = 0;
		this.img_bas = this.preloading("../graphismes/2D/barre_bas.png");
	},

	load: function() {
		var x = 0,
			y = document.getElementById("interface").height - document.getElementById("interface").width / 5,
			w = document.getElementById("interface").width,
			h = document.getElementById("interface").width / 5;
		this.context.drawImage(this.img_bas, x, y, w, h);
		this.setIPS(60);
	},

	setIPS: function(val) {
		this.context.fillStyle = "white";
		this.context.font = "20px Arial";
		var x = document.getElementById("interface").width - 120,
			y = 25;
		this.context.clearRect(x, 0, 120, 27);
		this.context.fillText("IPS : " + val, x, y);
	},

	setDeathCount: function(val) {
		var x = document.getElementById("interface").width / 2,
			y = document.getElementById("interface").height / 2;
		this.context.clearRect(x-60, y-50, +100, +80);
		if (val!=0) {
			this.context.fillStyle = "white";
			this.context.font = "60px Arial";
			this.context.fillText(val + "", x-50, y);
		}
	},

	setCoolDown: function(num, ratio) {
		var c = document.getElementById("interface").width / 40;
		var x = document.getElementById("interface").width / 2 + (num-1.5)*57.91 - c / 2,
			y = document.getElementById("interface").height - document.getElementById("interface").width / 5 * (1-0.876) - c/2;

		this.context.fillStyle = "white";
		this.context.fillRect(x, y, c, c); // A reajuster peut-etre un peu, mais en gros ca va
		this.context.fillStyle = "rgba(0, 0, 0, 0.4)";
		this.context.fillRect(x, y + c*(1-ratio), c, c*ratio);
	}

});