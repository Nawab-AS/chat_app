//         routes.js
//
// This is the routing module
//     for the server.

import { existsSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname, join as joinPath } from 'path';
import { authenticateLogin, getUserData, getMessages, onSIGINT as onSIGINT_database, saveMessage as _saveMessages} from "./database.js"
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
const SESSION_SECRET = process.env.SESSION_SECRET;

// get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)
const __publicDirname = joinPath(__dirname, "..", "public");

if (SESSION_SECRET == undefined) {
  throw new Error("CRITICAL SECURITY ERROR: No session secret set");
}

// token management
const cookieOptions = {
  httpOnly: false,
  sameSite: "strict",
  secure: false,
  maxAge: 1000 * 60 * 60 * 24 * 3 // 3 days -> ms
}

function createToken(data, res){
  const authToken = jwt.sign(data, SESSION_SECRET, {expiresIn: cookieOptions.maxAge /1000});
  res.cookie("authToken", authToken, cookieOptions);
}


function verifyToken(req, res){
  const token = req.cookies.authToken;
  if (!token) return; false // no token
  let data;
  try {
    data = jwt.verify(token, SESSION_SECRET);
  } catch (err) {
    res.clearCookie("authToken");
    return false; // invalid token
  }
  if (!data) return false; // token has no data
  return data;
}


const redirectToLogin = (req, res, next) => {
  if (!verifyToken(req, res)) {
    res.redirect("/login");
  } else {
    next();
  }
};

const redirectToHome = (req, res, next) => {
  if (verifyToken(req, res)) {
    res.redirect("/chat");
  } else {
    next();
  }
};


export function router(app) {
  // use session middleware
  app.use(cookieParser());

  // Home page
  app.get("/", redirectToLogin, (req, res) => {
    res.sendFile(__publicDirname + "/chat/index.html");
  });

  // Chat page
  app.get("/chat", redirectToLogin, (req, res) => {
    res.sendFile(__publicDirname + "/chat/index.html");
  });

  // Login page
  app.get("/login", redirectToHome, (req, res) => {
    res.sendFile(__publicDirname + "/login/index.html");
  });

  // Login request
  app.post("/login",  async (req, res) => {
    const { username, password } = req.body;
    const userId = await authenticateLogin(username, password);
    if (!userId) {
      return res.redirect("/login?error=1");
    }
    createToken({userId: userId}, res);
    res.redirect("/chat");
  });

  // Logout request
  app.post("/logout", (req, res) => {
    res.clearCookie("authToken");
    res.redirect("/login")
  });

  // Chat messages API
  app.get("/api/userdata.json", async (req, res) => {
    const authData = verifyToken(req, res);
    if (!authData) return res.status(401).send("Unauthorized"); // invalid token
    res.json(await getUserData(authData.userId[0].user_id));
  });

  app.get("/api/messages.json", async (req, res) => {
    const authData = verifyToken(req, res);
    if (!authData) return res.status(401).send("Unauthorized");
    
    const message_count = parseInt(req.query.msg_count);
    const to = parseInt(req.query.to);
    if (isNaN(message_count) || isNaN(to)) return res.status(400).send("Bad Request");

    res.json(await getMessages([authData.userId[0].user_id, to], message_count));
  });
  

  // Serve Other files
  app.use(function (req, res) {
    if (existsSync(__publicDirname + req.url)) {
      // send file if path exists
      res.sendFile(__publicDirname + req.url);
    } else {
      // otherwise send 404
      res.status(404).sendFile(__publicDirname + "/404.html");
    }
  });
};


// handle SIGINT
export async function onSIGINT() {
  console.log("closing database connection...");
  await onSIGINT_database();
  console.log("database connection closed");
}

export { _saveMessages as saveMessage };