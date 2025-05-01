const express = require("express");
var app = express();
const WebSocket = require("ws");
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;
const dev = process.env.ENVIRONMENT == "DEV";
// file = "";

// debug logs
function debug(message) {
  if (dev) {
    console.log(message);
  }
};
debug("DEVELOPMENT MODE");

// use routes.js for routes
app.use("/", require("./routes.js")(WS_PORT, app).router());

// listen fot https requests
app.listen(PORT, () => {
    console.log("express listening on *:" + PORT);
});


// socket.io
// io.on("connection", (socket) => {
//     debug("User connected");
//     let auth = false;

//     socket.on("auth", (data) => {
//         if (data.password == PASSWORD) {
//             auth = true;
//             io.emit("edit", { text: file, id: "null" });
//         } else {
//             socket.disconnect();
//         }
//     });

//     socket.on("sync", (data) => {
//         if (auth) {
//             io.emit("edit", { text: data.text, id: data.id });
//             file = data.text;
//         }
//     });
// });

// Websocket
const Websocket = new WebSocket.Server({ port: WS_PORT });

Websocket.on("connection", (client) => {
    console.log("new websocket connection");
    client.on("message", (data) => {
        debug(data);
        try {
            JSON.parse(data);
        } catch(e){ // data is a string
            return;
        }
        // data is a json object
        let packet = JSON.parse(data);
        debug("json");
        if (packet.type == "echo") {
            Websocket.clients.forEach((otherClient) => {
                otherClient.send(packet.data);
            });
        }
        console.log("received: %s", packet);
    });
});
console.log("websocket listening on *:" + WS_PORT);
