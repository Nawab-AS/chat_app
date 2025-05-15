//         routes.js
//
// This is the routing module
//     for the server.

import { existsSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname, join as joinPath } from 'path';
import { authenticateLogin, getUserDataFromId } from "./database.js"
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { Router as _router } from "express";
const Router = _router();
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
    res.clearCookie("authToken")
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


export function router(WS_PORT, app) {
  // use session middleware
  app.use(cookieParser());

  // Home page
  Router.get("/", redirectToLogin, (req, res) => {
    res.sendFile(__publicDirname + "/chat/index.html");
  });

  // Chat page
  Router.get("/chat", redirectToLogin, (req, res) => {
    res.sendFile(__publicDirname + "/chat/index.html");
  });

  // Login page
  Router.get("/login", redirectToHome, (req, res) => {
    res.sendFile(__publicDirname + "/login/index.html");
  });

  // Login request
  Router.post("/login", (req, res) => {
    const { username, password } = req.body;
    const userId = authenticateLogin(username, password);
    if (!userId) {
      return res.redirect("/login?error=1");
    }
    createToken({userId: userId}, res);
    res.cookie("username", username, cookieOptions);
    res.redirect("/chat");
  });

  // Logout request
  Router.post("/logout", (req, res) => {
    res.clearCookie("authToken");
    res.redirect("/login")
  });

  // WS Port api
  Router.get("/WS-PORT", (req, res) => {
    res.send(WS_PORT + "");
  });

  // Chat messages API
  Router.get("/chat/api/userdata.json", (req, res) => {
    let authData = verifyToken(req, res);
    if (!authData) return res.status(401).send("Unauthorized"); // invalid token
    let userData = getUserDataFromId(authData.userId);
    res.json(userData);
  });

  // Serve Other files
  Router.use(function (req, res) {
    if (existsSync(__publicDirname + req.url)) {
      // send file if path exists
      res.sendFile(__publicDirname + req.url);
    } else {
      // otherwise send 404
      res.status(404).sendFile(__publicDirname + "/404.html");
    }
  });

  return Router;
};