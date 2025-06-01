let error = new URLSearchParams(document.location.search).get("error")
let errorBox = document.getElementById("error");

if (error == 1){
	errorBox.style.display = "block";
	errorBox.children[0].innerHTML = "Invalid Username or Password";
}

if (error == 2){
	errorBox.style.display = "block";
	errorBox.children[0].innerHTML = "Captcha Failed";
}