var socket = io.connect(document.location.href);

$("#creerS").on("click", function() {
	var nom = prompt("Choose a name");
	socket.emit("createPrepa", nom);
	initPrepa();
	$("#startGame").css("display", "inline");
});

$("#startGame").on("click", function() {
	socket.emit("startGame");
});

$(".select").on("click", function() {
	socket.emit("pickChampion", this.id);
	$("#championSelect").html(this.id);
});

$("#quitPrepa").on("click", function() {
	socket.emit("quitPrepa");
	document.location.href = document.location.href;
})

$("#chatteur").on("submit", function(ev) {
	ev.preventDefault();
	socket.emit("MsgAll", document.getElementById("text").value);
	document.getElementById("text").value = "";
});

$("#switchTeam").on("click", function() {
	document.getElementById("team1").innerHTML = "";
	document.getElementById("team2").innerHTML = "";
	socket.emit("switchTeam");
});

function initPrepa() {
	$("#Menu").css("display", "none");
	$("#Prepa").css("display", "inline");
	$("#banniere").css("display", "none");
	document.getElementById("team1").innerHTML = "";
	document.getElementById("team2").innerHTML = "";
}

socket.on("addJoueur", function(obj) {
	if (obj.team==1) {
		document.getElementById("team1").innerHTML += "<div>" + obj.pseudo + "</div>";
	} else {
		document.getElementById("team2").innerHTML += "<div>" + obj.pseudo + "</div>";
	}
});

socket.on("newPrepa", function(nom) {
	document.getElementById("serveursdispos").innerHTML += "<div class='nomServer'>" + nom + "</div>";
	$(".nomServer").on("click", function() {
		socket.emit("joinPrepa", this.innerHTML.split(">")[1].split("<")[0]);
		$("#switchTeam").css("display", "inline");
		$("#quitPrepa").css("display", "inline");
		initPrepa();
	});
});

socket.on("debutJeu", function(initial) {
	$("#Prepa").css("display", "none");
	var game = new Jeu.Map.View(initial, socket);
});

socket.on("MsgAll", function(msg) {
	document.getElementById("textPosition").innerHTML += msg + "<br />";
});

socket.on("removeJoueur", function(obj) {
	document.getElementById("team"+obj.team).removeChild(document.getElementById("team"+obj.team).childNodes[obj.index]);
});

socket.on("pseudo", function(pseudo) {
	$("#pseudo").html(pseudo);
});