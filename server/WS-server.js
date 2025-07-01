import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import 'dotenv/config'
import { filter } from 'curse-filter';
const SESSION_SECRET = process.env.SESSION_SECRET;


export const runWSserver = (server, saveMessage) => {
	const Websocket = new WebSocketServer({ server });
	var onlineUsers = {};

	Websocket.on("connection", (client) => {
		let auth = false;
		let user_id = undefined;
		
		client.on("message", async (rawData) => {
			let data;
			try {
				data = JSON.parse(rawData);
			} catch (e) {return} // data is not a json object
			if (!data?.type) return;

			if (!auth) {
				if (data.type == "auth") {
					try {
						if (!data?.token) return;
						
				    const authData = jwt.verify(data.token, SESSION_SECRET);
						if (!authData?.user_id) return; // invalid user_id
						auth = true;
						user_id = authData.user_id;
						
						if (user_id in onlineUsers){
							onlineUsers[user_id].send("closeClient");
						}
						onlineUsers[user_id] = client;
				  } catch (e){return}
				}
				return;
			} else {
				if (data.type == "message") {
					if (!(data?.message && data?.to && data?.from)) return; // invalid message
					if (data?.message?.length > 1000) return;
					if (data.from != user_id) return;
					//console.log(data, user_id);
					
					let message = {type: "message", message_text: await filter(data.message, { rigidMode: false }), sender_id: data.from, recever_id: data.to};
					saveMessage(message.message_text, data.to, data.from);
					message = JSON.stringify(message);
					//console.log(onlineUsers[data.from].length);
					client.send(message);
					// onlineUsers[data.from].forEach((from)=>from.send(message));
					if(data.to in onlineUsers) onlineUsers[data.to].send(message);
				}
			}
		});

		client.on("close", () =>{
			try {
					delete onlineUsers[user_id];
			} catch (e) {return}
		})
	});
};
