import express, { urlencoded } from "express";
import { createServer } from 'http'
import bodyParser from "body-parser";
import { router, onSIGINT, saveMessage} from "./routes.js"
import { runWSserver } from "./WS-server.js"
import 'dotenv/config'
const PORT = process.env.PORT || 3000;
var app = express();


// setup middleware


// listen fot https requests
router(app);
const server = createServer(app);
runWSserver(server, saveMessage);
server.listen(PORT, '0.0.0.0', () => {
  console.log("express and websocket listening on *:" + PORT);
});


// handle SIGINT
process.on('SIGINT', async ()=>{
  console.log("\nSIGINT received, shutting down");
  await onSIGINT();
  process.exit(0);
});
