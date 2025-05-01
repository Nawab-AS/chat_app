//         routes.js
//
// This is the routing module
//     for the server.

var fs = require("fs");
const Session = require("express-session");
const bodyParser = require("body-parser");
const Router = require("express").Router();
const SESSION_SECRET = process.env.SESSION_SECRET || "testing123";
const dev = process.env.ENVIRONMENT == "DEV";

if (SESSION_SECRET == "testing123") {
  throw new Error("CRITICAL SECURITY ERROR: No session secret set");
}

// debug logs
function debug(message) {
  if (dev) {
    console.log(message);
  }
};

// authentication
let users = [
  { id: 1, username: "james1234", password: "password1234" },
  { id: 2, username: "billy101", password: "mypassword" },
  { id: 3, username: "max469", password: "secret" },
];
function authenticateLogin(username, password) {
  if (username && password) {
    let user = users.find((user) => user.username === username);
    if (user && user.password === password) {
      return user.id;
    }
  }
  return false;
}

const redirectToLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login");
  } else {
    next();
  }
};

const redirectToHome = (req, res, next) => {
  if (req.session.userId) {
    res.redirect("/");
  } else {
    next();
  }
}

module.exports = function (WS_PORT, app) {
  var routerModule = {
    router: function () {
      // use session middleware
      app.use(
        Session({
          secret: SESSION_SECRET,
          resave: false,
          saveUninitialized: false,
          cookie: {
            sameSite: "strict",
            secure: false,
            maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
          },
        }),
      );
      app.use(bodyParser.urlencoded({ extended: true }));

      // Home page
      Router.get("/", redirectToLogin, (req, res) => {
        const { userId } = req.session;
        debug(userId);
        res.sendFile(__dirname + "/public/chat/index.html");
      });

      // Chat page
      Router.get("/chat", redirectToLogin, (req, res) => {
        const { userId } = req.session;
        debug(userId);
        res.sendFile(__dirname + "/public/chat/index.html");
      });

      // Login page
      Router.get("/login", redirectToHome, (req, res) => {
        const { userId } = req.session;
        debug(userId);
        res.sendFile(__dirname + "/public/login/index.html");
      });

      // Login request
      Router.post("/login", (req, res) => {
        const { username, password } = req.body;
        const userId = authenticateLogin(username, password);
        if (userId) {
          req.session.userId = userId;
          res.redirect("/chat");
          debug("login successful");
        } else {
          res.redirect("/login?error=1");
        }
      });

      // Logout request
      Router.post("/logout", (req, res) => {
        req.session.destroy((err) => {
          if (err) {
            console.log(err);
            res.redirect("/login?error=1");
          } else {
            res.redirect("/login");
          }
        });
      });

      // Serve Other files
      Router.use(function (req, res) {
        if (fs.existsSync(__dirname + "/public" + req.url)) {
          // send file if path exists
          res.sendFile(__dirname + "/public" + req.url);
        } else {
          // otherwise send 404
          res.status(404).sendFile(__dirname + "/public/404.html");
        }
      });

      Router.get("/websocket", (req, res) => {
        res.redirect("/chat");
      });

      // WS Port api as .js file
      Router.get("/WEBSOCKET_PORT.js", (req, res) => {
        res.send("const WEBSOCKET_PORT = " + WS_PORT + ";");
      });

      return Router;
    },
  };

  // Export the Router
  return routerModule;
};
