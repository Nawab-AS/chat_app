import { createApp, ref } from 'vue';

const dataChanged = ref(false);
const username = ref("");
const password = ref("");
const password2 = ref("");
const terms = ref(false);
const error = ref({password:"Enter a password", username:"Enter a username"});

let signupError = new URLSearchParams(document.location.search).get("error");
if (signupError == 1) alert("there was an error signing up, please try again later\nif the problem persists, contact the nawab-as@hackclub.app");
if (signupError == 2) alert("captcha failed, please try again");

window.app = {username, dataChanged, password, password2, error, terms};

setInterval(()=>{
	if (dataChanged.value){
		dataChanged.value = false;
		fetch(`/api/validsignup?username=${username.value}&password=${password.value}`).then((res)=>res.json()).then((response)=>{
			error.value.username = response.username.allowed ? "" : response.username.hint;
			error.value.password = response.password.allowed ? "" : response.password.hint;
			if (password.value != password2.value && response.password.allowed) error.value.password = "Passwords do not match";
		});
	}
}, 500);

// mount vue app
const app = {
	setup() {
		return {
			username,
			password,
			password2,
			terms,
			error,
			dataChanged
		}
	}
};
createApp(app).mount('#app');