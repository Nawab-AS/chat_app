const userlist = document.getElementById("userlist");
const greeting = document.getElementById("greeting");
const sendMessage = document.getElementById("sendMessage");
const textarea = sendMessage.querySelector("textarea");

greeting.innerHTML = localStorage.username;

sendMessage.addEventListener("submit", (e) => {
	e.preventDefault();
	if (textarea.value == "") return;
});

textarea.addEventListener('input', () => {
  //textarea.style.height = `${textarea.scrollHeight-30}px`;
});

function addUser(username) {
	var li = document.createElement("li");
	var icon = document.createElement("icon");
	var p = document.createElement("p");
	icon.innerHTML = username.charAt(0).toUpperCase();
	p.innerHTML = username;
	li.appendChild(icon);
	li.appendChild(p);
	userlist.appendChild(li);

	li.name = username;
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

function nameClicked(event) {
	let name = event.target.name || event.target.parentElement.name;
	console.log(name, "clicked");
}

addUser("Sam");
addUser("Jack");
addUser("Alice");
addUser("Mark");
addUser("John");
addUser("Martha");
addUser("MrSuperLongName");
