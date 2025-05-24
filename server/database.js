//         database.js
//
// handles all database operations

import pkg from "pg";
const { Pool } = pkg;

// setup database connection
const DATABASE_URI = new URL(process.env.DATABASE_URI);
const pool = new Pool({
  user: DATABASE_URI.username,
  host: DATABASE_URI.host.split(":")[0],
  database: DATABASE_URI.pathname.slice(1),
  password: DATABASE_URI.password,
  port: DATABASE_URI.port,
  max: 20,
  idleTimeoutMillis: 30000,
  ssl: { // TODO: remove this in production (SECURITY RISK)
    rejectUnauthorized: false
  }
});

delete DATABASE_URI.password;

async function queryDatabase(query) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(query);
    return result.rows;
  } catch (e) {
    console.error(e);
  } finally {
    if (client) client.release();
  }
}


// high-level db functions
export function authenticateLogin(username, password) {
  if (!username || !password) return false;
  let userData = getUserDataFromUsername(username);
  if (!userData) return false; // invalid username
  
  if (userData.password === password) {
    return userData;
  }
  return false;
}

function getUserDataFromUsername(username) {
  // TODO: connect to database
  let users = queryDatabase("SELECT * FROM users WHERE username = $1");
  let user = users.find((user) => user.username === username);
  if (user) return user;
  return false;
}

export function getUserDataFromId(userId) {
  // TODO: connect to database
  return {messages: getUserchats(userId), friends: [{name: "billy101", id: 2}, {name: "max469", id: 3}]};
}

function getUserFriends(userId) {
  // TODO: connect to database
  let userFriends = friends.filter((friend) => friend.user1 === userId || friend.user2 === userId);
  userFriends.forEach((friend) => {
    if (friend.user1 === userId) {
    } else if (friend.user2 === userId) {
    }
  })
}

function getUserchats(userId) {
  // TODO: connect to database
  let userMessages = messages.filter((message) => message.from === userId || message.to === userId);
  return userMessages;
}

export function saveMessage(message, to, from) {
  // TODO: connect to database
  messages.push({ message: message, from: from, to: to});
}

// test
// (async () =>{
//   const result = await queryDatabase("SELECT AUTHENTICATE('MrPotato', 'password123')");
//   console.log(result[0]);
// })()


//

// handle SIGINT
export async function onSIGINT() {
  await pool.end();
  console.log('Pool has ended');
}