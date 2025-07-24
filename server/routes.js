//         routes.js
//
// This is the routing module
//     for the server.

import { existsSync, readFile } from "fs";
import { fileURLToPath } from 'url';
import axios from 'axios';
import bodyParser from "body-parser"
import { dirname, join as joinPath } from 'path';
import * as database from "./database.js";
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

import 'dotenv/config'
const SESSION_SECRET = process.env.SECRET_KEY;
const CAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;
const CAPTCHA_SITE_KEY = process.env.CAPTCHA_SITE_KEY;
const useCaptcha = (CAPTCHA_SITE_KEY && CAPTCHA_SECRET_KEY);
if (useCaptcha) {
  console.log("Captcha will be used");
} else {
  console.log("CAPTCHA_SITE_KEY and/or CAPTCHA_SECRET_KEY not set, captcha will not be used");
}
// get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url))
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
  }, (_, __) => {});

  // Chat page
  app.get("/chat", redirectToLogin, (req, res) => {
    res.sendFile(__publicDirname + "/chat/index.html");
  });

  // terms and conditions page
  app.get("/terms", (req, res) => {
    res.sendFile(__publicDirname + "/terms/index.html");
  });

  // Login page (basic string manipulation to add captcha)
  let loginStr = "";
  readFile(joinPath(__publicDirname, "/login/index.html"), (err, file)=>{
    if (err) throw new Error(err);

    if (useCaptcha) {
      loginStr = file.toString().split("<site-key>").join(CAPTCHA_SITE_KEY);
    } else {
      loginStr = file.toString().split(/<captcha(.|\n)*?<\/captcha>/).join("");
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
      if (useCaptcha) {
        const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          secret: CAPTCHA_SECRET_KEY,
          response: turnstileToken
        }, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
        
        if (!response.data.success) return res.redirect("/login?error=2"); // captcha failed
      }
      // captcha passed (or not used), authenticate user
      if (!username || !password) return res.redirect("/login?error=1");
      const status = await database.authenticateLogin(username, password);
      if (status.includes("locked")) return res.redirect("/login?error=3"); // locked account
      if (!status.includes("success")) return res.redirect("/login?error=1"); // invalid login
      const user_id = await database.getIdFromUsername(username);
      if (!user_id) return res.redirect("/login?error=1");
      
      createToken({user_id: user_id}, res);
      res.redirect("/chat");
    } catch (error) {
      console.error('Error verifying Turnstile:', error);
      res.redirect("/login?error=2"); // captcha failed
    }
  });

  // signup page

  let signupStr = "";
  readFile(joinPath(__publicDirname, "/signup/index.html"), (err, file)=>{
    if (err) throw new Error(err);

    if (useCaptcha) {
      signupStr = file.toString().split("<site-key>").join(CAPTCHA_SITE_KEY);
    } else {
      signupStr = file.toString().split(/<captcha(.|\n)*?<\/captcha>/).join("");
    }
  });
  app.get("/signup", redirectToHome, (req, res) => {
    res.send(signupStr);
  });

  // signup request
  app.post("/signup", redirectToHome, async (req, res) => {
    const turnstileToken = req.body['cf-turnstile-response'];
    const ip = req.body['CF-Connecting-IP'];
    const { username, password } = req.body;

     
      if (useCaptcha) {
        const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          secret: CAPTCHA_SECRET_KEY,
          response: turnstileToken,
          remoteip: ip
        }, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
        
        if (!response.data.success) return res.redirect("/signup?error=2");

      }
      // captcha passed (or not used), authenticate user
      if (!username || !password) return res.redirect("/signup?error=1");
    try {
      
      const validSignup = await database.validSignup(username, password);
      if (!validSignup.username.allowed || !validSignup.password.allowed) return res.redirect("/signup?error=1"); // invalid signup info
      const user_id = await database.addUser(username, password);
      
      createToken({user_id: user_id}, res);
      res.redirect("/chat");
    } catch (error) {
      console.error('Error verifying Turnstile:', error);
      res.redirect("/signup?error=2"); // captcha failed
    }
  });

  // Logout request
  app.post("/logout", (req, res) => {
    res.clearCookie("authToken");
    res.redirect("/login")
  });

  // Chat messages API
  app.get("/api/userdata", async (req, res) => {
    const authData = verifyToken(req, res);
    if (!authData) return res.status(401).send("Unauthorized"); // invalid token
    res.json(await database.getUserData(authData.user_id));
  });

  // chat messages API
  app.get("/api/messages", async (req, res) => {
    const authData = verifyToken(req, res);
    if (!authData) return res.status(401).send("Unauthorized");
    
    const message_count = parseInt(req.query.msg_count);
    const to = parseInt(req.query.to);
    if (isNaN(message_count) || isNaN(to)) return res.status(400).send("Bad Request");

    res.json(await database.getMessages([authData.user_id, to], message_count));
  });

  // chat user search API
  app.get("/api/usersearch", async (req, res) => {
    const authData = verifyToken(req, res);
    if (!authData) return res.status(401).send("Unauthorized");

    const username = req.query.username;
    if (!username) return res.status(400).send("Bad Request");

    res.json(await database.userSearch(username));
  });

  // username check API
  app.get("/api/validsignup", async (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
    
    res.json(await database.validSignup(username, password));
  });
  
  // add friend API
  app.post("/api/addfriend", async (req, res) => {
    const authData = verifyToken(req, res);
    if (!authData) return res.status(401).send("Unauthorized");

    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).send("Bad Request");

    await database.addFriend(authData.user_id, user_id);
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
  await database.onSIGINT();
  console.log("database connection closed");
}

let _saveMessage = database.saveMessage;
export { _saveMessage as saveMessage };