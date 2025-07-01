//         database.js
//
// handles all database operations

import pkg from "pg";
const { Pool } = pkg;
import { detect as profanityDetect } from 'curse-filter';
import 'dotenv/config'

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
  ssl: {
    rejectUnauthorized: false
  }
});

delete DATABASE_URI.password;

// low-level db functions
async function queryDatabase(query, params=[]) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error(err);
  }
}


// high-level db functions
export async function authenticateLogin(username, password) {
  return (await queryDatabase("SELECT chat.AUTHENTICATE($1, $2)", [username, password]))[0]?.authenticate;
}

export async function getIdFromUsername(username){
  return (await queryDatabase("SELECT user_id FROM chat.USERS WHERE username = $1", [username]))[0]?.user_id;
}

export async function getUserData(user_id) {
  return {userData: (await queryDatabase("SELECT * FROM chat.USERDATA($1)", [user_id]))[0],
    friends: (await queryDatabase("SELECT * FROM chat.GET_FRIEND_DATA($1)", [user_id]))};
}


export async function getMessages(user_id, message_count) {
  return { messages: await queryDatabase("SELECT * FROM chat.get_messages($1, $2, $3)", [user_id[0], user_id[1], message_count]), 
           count: await queryDatabase("SELECT chat.NUM_MESSAGES($1, $2)", [user_id[0], user_id[1]]) };
}

export async function saveMessage(message, to, from) {
  await queryDatabase("CALL chat.ADD_MESSAGE($1, $2, $3)", [message, from, to]);
}

export async function userSearch(username) {
  if (username.length <= 5) return [];
  return (await queryDatabase("SELECT username, user_id FROM chat.users WHERE username ILIKE $1",["%"+username+"%"]));
}

export async function addFriend(friend1, friend2) {
  return (await queryDatabase("CALL chat.ADD_FRIEND($1, $2)",[friend1, friend2]));
}

export async function addUser(username, password) {
  await queryDatabase("CALL chat.ADD_USER($1, $2)",[username, password]);
  return (await queryDatabase("SELECT user_id FROM chat.users WHERE username = $1", [username]))[0].user_id;
}


export async function validSignup(username, password){
  let usernameError = !username ? {allowed:false, hint:"Enter a username"} : await (async()=>{
    if (username.length < 7) return {allowed:false, hint:"Username must be at least 7 characters long"};
    if (username.length > 20) return {allowed:false, hint:"Username must be less than 20 characters long"};
    if (!/^[a-z0-9_-]+$/.test(username)) return {allowed:false, hint:"Username can only contain lowercase letters, numbers, underscores and hyphens"}
    if (username.includes("admin") || username.includes("administrator")) return {allowed:false, hint:"Username is not allowed"};
    if (await(profanityDetect(username, { rigidMode: true }))) return {allowed:false, hint:"Username cannot contain profanity"};
    if ((await queryDatabase("SELECT user_id FROM chat.users WHERE username = $1", [username])).length > 0) return {allowed:false, hint:"Username is already taken"};
    
    return {allowed:true, hint:""};
  })();

  let passwordError = !password ? {allowed:false, hint:"Enter a password"} : await (async()=>{
    if (password.length < 7) return {allowed:false, hint:"Password must be at least 7 characters long"};
    if (password.length > 20) return {allowed:false, hint:"Password must be less than 20 characters long"};
    if (!/^[a-zA-Z0-9_]+$/.test(password)) return {allowed:false, hint:"Password can only contain lowercase letters, numbers and underscores"}
    if (password == username) return {allowed:false, hint:"Password cannot be the same as username"};
    
    if (await(profanityDetect(password, { rigidMode: true }))) return {allowed:false, hint:"Password cannot contain profanity"};
    
    return {allowed:true, hint:""};
  })();
  
  return {username: usernameError, password: passwordError};
}


// handle SIGINT
export async function onSIGINT() {
  await pool.end();
  console.log('Pool has ended');
}