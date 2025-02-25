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


// routes
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => { // home page
    res.sendFile(__dirname + "/public/home/index.html");
});

function circularReplacer() {
  const seen = new WeakSet(); // object
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}

app.use(function (req, res) { // other files
    
    res.json(JSON.parse(JSON.stringify(obj, circularReplacer())));
    /*if (fs.existsSync(__dirname + "/public" + req.url)){
        res.sendFile(__dirname + "/public" + req.url); // send file if path exists
    } else {
        res.sendFile(__dirname + "/public/404.html"); // send 404 if path doesn't exist
    }*/
});


// socket.io
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
