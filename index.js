let express = require("express");
var app = express();
var http = require("http").createServer(app);
let io = require("socket.io")(http);
let fs = require("fs");
const PASSWORD = process.env.PASSWORD;
let file = "";

if (PASSWORD == undefined) {
    console.log("ERROR: No password set");
}

app.use(express.static(__dirname + "/public"));
app.use(function (req, res) {
    url = new URL("http://localhost:80"+req.url)
    if (fs.existsSync(__dirname + "/public" + url.pathname)){
    res.sendFile(__dirname + "/public" + req.url);
    } else {
        res.sendFile(__dirname + "/public/404.html");
    }
});

io.on("connection", (socket) => {
    console.log("User connected");
    let auth = false;

    socket.on("auth", (data) => {
        if (data.password == PASSWORD){
            auth = true;
            io.emit("edit", {text:file, id:"null"});
        } else {
            socket.disconnect();
        }
    });

    socket.on("sync", (data)=>{
        if (auth){
            io.emit("edit", {text:data.text, id:data.id});
            file = data.text;
        }
    });
});

http.listen(process.env.PORT || 8080, function () {
    console.log("http listening on *:" + (process.env.PORT || 8080));
});
