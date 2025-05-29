const userlist = document.getElementById("userlist");
const greeting = document.getElementById("greeting");
const sendMessage = document.getElementById("sendMessage");
const textarea = sendMessage.querySelector("textarea");
const messageArea = document.getElementById("messages");
const cookies = new URLSearchParams(document.cookie.replaceAll("; ", "&"));
const messageTemplate = document.getElementsByTagName("message-template").innerHTML;
var currentChat;
var messages;
var friends;
var userData;


// load messages
fetch("/api/userdata.json")
	.then((res) => res.json())
	.then((data) =>{
		console.log("loaded userdata", data);
		userData = data.userData;
		greeting.innerHTML = "Hello, " + userData.username;
		friends = data.friends;
		for (let i = 0; i < friends.length -1; i++) {
			addUser(friends[i]);
		}
		loadChat(friends[0].username);
		document.getElementById("loadingGIF").style = "none";
		messageArea.style = "";
});


// UI functions

sendMessage.addEventListener("submit", (e) => {
	e.preventDefault();
	if (!WS_sendData) return;
	if (textarea.value == "") return;
	WS_sendData({type: "message", message: textarea.value, to: currentChat, from: cookies.get("username")});
	textarea.value="";
	textarea.blur();
});

textarea.addEventListener('keydown', function(event) {
	if (event.key === 'Enter') {
		if (event.shiftKey) return; // Allow new line with Shift + Enter
    event.preventDefault(); // Prevent the default newline
		sendMessage.dispatchEvent(new Event("submit")) // Trigger the form submission
  }
});

function nameClicked(event) {
	let name = event.target.name || event.target.parentElement.name;
	console.log(name, "clicked");
	loadChat(name);
}

function addUser(userData) {
	var li = document.createElement("li");
	var icon = document.createElement("icon");
	var p = document.createElement("p");
	icon.innerHTML = userData.username.charAt(0).toUpperCase();
	p.innerHTML = userData.username;
	li.appendChild(icon);
	li.appendChild(p);
	userlist.appendChild(li);

	li.name = userData.username;
	li.userId = userData.user_id;
	li.addEventListener("click", nameClicked);
}

function removeUser(username) {
	for (let i = 0; i < userlist.children.length; i++) {
		if (userlist.children[i].children[1].innerHTML == username) {
			userlist.removeChild(userlist.children[i]);
			return true;
		}
	}
	return false;
}

function loadChat(name) {
	document.getElementById("loadingGIF").style.display = "none";
	document.getElementsByTagName("titlebar")[0].innerHTML = name;
	document.querySelector("#messages").style.display = "none";
	//messageArea.innerHTML = "";
}

// Websocket functions
function setup_WS_client(websocket) {
	
}