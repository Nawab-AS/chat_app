//         database.js
//
// handles all database operations

import pkg from "pg";
const { Pool } = pkg;
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
  if (!username || !password) return false;
  const userData = await queryDatabase("SELECT chat.AUTHENTICATE($1, $2)", [username, password]);
  if (userData[0].authenticate) return await queryDatabase("SELECT user_id FROM chat.USERS WHERE username = $1", [username]);
  return false;
}

export async function getUserData(user_id) {
  return {userData: (await queryDatabase("SELECT * FROM chat.USERDATA($1)", [user_id]))[0],
    friends: (await queryDatabase("SELECT * FROM chat.GET_FRIEND_DATA($1)", [user_id]))};
}


export async function getMessages(user_id, message_count) {
  return (await queryDatabase("SELECT * FROM chat.get_messages($1, $2, $3)", [user_id[0], user_id[1], message_count]));
}

export async function saveMessage(message, to, from) {
  await queryDatabase("CALL chat.ADD_MESSAGE($1, $2, $3)", [message, from, to]);
}


// test
// (async ()=>{
//   console.table(await queryDatabase("SELECT * FROM chat.GET_FRIEND_DATA(11)"));
// })();


// handle SIGINT
export async function onSIGINT() {
  await pool.end();
  console.log('Pool has ended');
}