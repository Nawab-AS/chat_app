//         routes.js
//
// This is the routing module
//     for the server.

import { existsSync, readFile } from "fs";
import { fileURLToPath } from 'url';
import axios from 'axios';
import bodyParser from "body-parser"
import { dirname, join as joinPath } from 'path';
import { authenticateLogin, getUserData, getMessages, onSIGINT as onSIGINT_database, saveMessage as _saveMessages} from "./database.js"
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import 'dotenv/config'
const SESSION_SECRET = process.env.SESSION_SECRET;
const CAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;
const CAPTCHA_SITE_KEY = process.env.CAPTCHA_SITE_KEY;

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
  app.use(bodyParser.urlencoded({ extended: true }));

  // Home page (will always redirect to login or chat)
  app.get("/", (req, res, _) => {
    if (verifyToken(req, res)) {
      res.redirect("/chat");
    } else {
      res.redirect("/login");
    }
  }, (req, res) => {});

  // Chat page
  app.get("/chat", redirectToLogin, (req, res) => {
    res.sendFile(__publicDirname + "/chat/index.html");
  });

  // Login page
  let loginStr = "";
  const useCaptcha = (CAPTCHA_SITE_KEY && CAPTCHA_SECRET_KEY)
  readFile(joinPath(__publicDirname, "/login/index.html"), (err, file)=>{
    if (err) throw new Error(err);
    
    if (useCaptcha) {
      loginStr = file.toString().replace("<site-key>", CAPTCHA_SITE_KEY);
    } else {
      console.warn("WARNING: captcha site key and/or secret key is not set, captcha will not be used");
      loginStr = file.toString().split(/<captcha>(.|\n)*?<\/captcha>/).join("");
    }
  });
  app.get("/login", redirectToHome, (req, res) => {
    res.send(loginStr);
  });

  // Login request
  app.post("/login",  async (req, res) => {
    const turnstileToken = req.body['cf-turnstile-response'];
    const { username, password } = req.body;

    try {      
      const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        secret: CAPTCHA_SECRET_KEY,
        response: turnstileToken
      }, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
      
      if (!response.data.success) return res.redirect("/login?error=2"); // captcha failed

      // captcha passed, authenticate user
      if (!username || !password) return res.redirect("/login?error=1");
      const userId = await authenticateLogin(username, password);
      if (!userId) return res.redirect("/login?error=1");
      createToken({userId: userId}, res);
      res.redirect("/chat");
    } catch (error) {
      console.error('Error verifying Turnstile:', error.message);
      res.redirect("/login?error=2"); // captcha failed
    }
  });

  // signup page
  app.get("/signup", redirectToHome, (req, res) => {
    res.sendFile(__publicDirname + "/signup/index.html");
  });

  // signup request
  // app.post("/login",  async (req, res) => {
  //   const { username, password } = req.body;
  //   const userId = await authenticateLogin(username, password);
  //   if (!userId) {
  //     return res.redirect("/login?error=1");
  //   }
  //   createToken({userId: userId}, res);
  //   res.redirect("/chat");
  // });

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