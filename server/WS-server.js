import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import 'dotenv/config'
import { Filter } from 'bad-words';
const filter = new Filter();
const SESSION_SECRET = process.env.SESSION_SECRET;


export const runWSserver = (server, saveMessage) => {
	const Websocket = new WebSocketServer({ server });
	var onlineUsers = {};

	Websocket.on("connection", (client) => {
		let auth = false;
		let userId = undefined;
		
		client.on("message", (rawData) => {
			let data;
			try {
				data = JSON.parse(rawData);
			} catch (e) {return} // data is not a json object

			if (!auth) {
				if (data.type == "auth") {
					try {
				    data = jwt.verify(data.token, SESSION_SECRET);
						if (data) auth = true;
						userId = data.userId[0].user_id;
						if (userId in onlineUsers){
							onlineUsers[userId].push(client);
						} else {
							onlineUsers[userId] = [client];
						}
				  } catch (err) {
				    client.close();
				  }
				}
				return;
			} else {
				if (data.type == "message") {
					let message = {type: "message", message: filter.clean(data.message), from: data.from, to: data.to}
					saveMessage(message.message, data.to, data.from);
					message = JSON.stringify(message);
					client.send(message);
					if(data.to in onlineUsers) onlineUsers[data.to].forEach((to)=>to.send(message));
				}
			}
		});

		client.on("close", () =>{
			try {
					onlineUsers[userId].splice(onlineUsers[userId].indexOf(client), -1);
			} catch (e) {return}
		})
	});
};
