//         database.js
//
// handles all database operations

// import pkg from "pg";
// const { Pool } = pkg;

// let DATABASE_URI = new URL(process.env.DATABASE_URI);
// const pool = new Pool({
//   user: DATABASE_URI.username,
//   host: DATABASE_URI.host,
//   database: DATABASE_URI.pathname.slice(1),
//   password: DATABASE_URI.password,
//   port: DATABASE_URI.port
// });

// delete DATABASE_URI.password;
// delete process.env.DATABASE_URI;

let users = [
  { id: 1, username: "james1234", password: "password1234" },
  { id: 2, username: "billy101", password: "mypassword" },
  { id: 3, username: "max469", password: "secret" },
];

let messages = [
  { message: "Hello", from: 1, to: 2 },
  { message: "Hello again", from: 2, to: 1 },
  { message: "are you there?", from: 1, to: 2}
];

export function authenticateLogin(username, password) {
  // TODO: connect to database
  if (!username || !password) return false;
  let userData = getUserDataFromUsername(username);
  if (!userData) return false; // invalid username
  
  if (userData.password === password) {
    return true;
  }
  return false;
}

function getUserDataFromUsername(username) {
  // TODO: connect to database
  let user = users.find((user) => user.username === username);
  if (user) return user;
  return false;
}

export function getUserDataFromId(userId) {
  // TODO: connect to database
  return {messages: getUserchats(userId), friends: ["Sam", "Jack", "Alice", "Mark", "John", "Martha"]};
}

function getUserchats(userId) {
  // TODO: connect to database
  let userMessages = messages.filter((message) => message.from === userId || message.to === userId);
  return userMessages;
}

async function queryDatabase(query) {
  const client = await pool.connect()

}

export function saveMessage(message, to, from) {
  // TODO: connect to database
  messages.push({ message: message, from: from, to: to});
}