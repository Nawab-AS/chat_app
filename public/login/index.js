if (new URLSearchParams(document.location.search).get("error")){
	errorBox = document.getElementById("error");
	errorBox.style.display = "block";
	errorBox.children[0].innerHTML = "Invalid username or password";
}

const form = document.getElementById("form");
form.addEventListener("submit", (event) =>{
	localStorage.username = form.username.value;
});