alert("Connecting to server...");
const socket = io();
const text = document.getElementById("text");
let prevText = "";
let first = true;
password = prompt("Connection successful\nauthorizing user\nPASSWORD:");

socket.emit("auth", {password:password});

setInterval(()=>{
    if (text.value != prevText){
        prevText = text.value;
        socket.emit("sync", {text:prevText, id:socket.id});
        console.log("sync");
    }
},100);

socket.on("edit", (data)=>{
    if(first){
        alert("Authorization Complete, loading files");
    }
    if (data.text != text.value && data.id != socket.id || first){
        first=false;
        console.log("edit");
        prevText = data.text;
        text.value = data.text;
    }
});


socket.on("disconnect", ()=>{alert("disconnected")});
