// connect of websocket
const websocketURL = "wss://" + window.location.hostname + ":" + WEBSOCKET_PORT;

// websocket event handlers
var Websocket = new WebSocket(websocketURL);
Websocket.addEventListener("open", () => {
	console.log("connected to websocket server");
});

Websocket.addEventListener("close", () => {
	console.log("disconnected from websocket server");
});

Websocket.addEventListener("message", (data) => {
	console.log(data);
	alert(data);
});

// when the tab is closed
window.addEventListener("beforeunload", function (e) {
	Websocket.send(JSON.stringify({ type: "echo", data: "user disconnected" }));
});

var button = document.getElementById("send");
button.addEventListener("click", () => {
	let input = document.getElementById("input");
	let text = input.value;
	input.value = "";
	Websocket.send(text);
	console.log(text);
});
