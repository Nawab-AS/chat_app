const userlist = document.getElementById("userlist");
const greeting = document.getElementById("greeting");
const sendMessage = document.getElementById("sendMessage");
const textarea = sendMessage.querySelector("textarea");
const messageArea = document.getElementById("messages");
const cookies = new URLSearchParams(document.cookie.replaceAll("; ", "&"));
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
		currentChat = friends[0].user_id;
		for (let i = 0; i < friends.length; i++) {
			addUser(friends[i]);
		}
		loadChat(friends[0].username, friends[0].user_id);
		document.getElementById("loadingGIF").style.display = "none";
		messageArea.style.display = "flex";
});


// UI functions

function onSendMessage() {
	if (!WS_sendData) return;
	if (textarea.value == "") return;
	WS_sendData({type: "message", message: textarea.value, to: currentChat, from: userData.user_id});
	textarea.value="";
};

textarea.addEventListener('keydown', function(event) {
	if (event.key === 'Enter') {
		if (event.shiftKey) return; // Allow new line with Shift + Enter
    event.preventDefault(); // Prevent the default newline
		document.getElementById("sendMessageButton").click() // Trigger the form submission
  }
});

function nameClicked(event) {
	let name = event.target.name || event.target.parentElement.name;
	let user_id = event.target.user_id || event.target.parentElement.user_id;
	console.log(name, "clicked");
	currentChat = user_id;
	loadChat(name, user_id);
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
	li.user_id = userData.user_id;
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

function loadChat(name, id, msgCount=0) {
	document.getElementById("loadingGIF").style.display = "block";
	messageArea.style.display = "none";
	userlist.querySelectorAll("li").forEach((li) => {
		li.id = name == li.name ? "selected":"";
	})
	
	document.getElementsByTagName("titlebar")[0].innerHTML = name;
	messageArea.innerHTML = "";
	currentChat = id;
	fetch(`/api/messages.json?msg_count=${msgCount}&to=${id}`)
		.then((res) => res.json())
		.then((data) =>{
			//console.log("loaded messages", data);
			messages = data.sort((a, b) => Math.sign(Date.parse(a.sent_at) - Date.parse(b.sent_at)));
			for (let i = 0; i < messages.length; i++) {
				addMessage(messages[i].message_text, messages[i].sender_id == userData.user_id);
			}
			messageArea.scrollTo(0, messageArea.scrollHeight+1000000);
			
			document.getElementById("loadingGIF").style.display = "none";
			messageArea.style.display = "flex";

		});
}

function addMessage(message, byMe){
	const p = document.createElement("p");
	if (byMe) p.classList.add("ByMe");
	p.innerHTML = message;
	messageArea.appendChild(p);
}

// Websocket functions
function setup_WS_client(websocket) {
	websocket.addEventListener("message", (rawData)=>{
		let data;
		try {
			data = JSON.parse(rawData.data);
		} catch (e) {return}

		if (data.type == "message") {
			if (data.from == currentChat || data.to == currentChat) {
				addMessage(data.message, data.to == currentChat);
			}
			if (data.from != currentChat){
				// TODO: notify user
			}
			if(data.from == userData.user_id){
				messageArea.scrollTo({top: messageArea.scrollHeight+1000000, behavior: "smooth"});
			}
		}
	})
}