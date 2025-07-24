let { createApp, ref } = Vue;

const error = ref(new URLSearchParams(document.location.search).get("error") || false);
const username = ref('');
const password = ref('');
const captcha = ref(false);

function enableSubmit(token) {
	document.getElementById("turnstile-response").value = token;
	captcha.value = true;
}

const app = createApp({
	setup() {
		return {
			error,
			username,
			password,
			captcha
		}
	}
});
app.config.compilerOptions.isCustomElement = tag => (tag === 'captcha' || tag === 'script');
app.mount('body');