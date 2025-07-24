let { createApp, ref, nextTick } = Vue; // destructure Vue


const textarea = ref("");
const messages = ref([]);
const moreMessages = ref(false);
const currentChat = ref(null);
const friends = ref([]);
const userData = ref({1:2});
const loadingMessages = ref(true);
const popupValue = ref('');
const addFriendResults = ref([]);
const addFriendInput = ref('');
var messageCount = 0;


// load userdata
fetch("/api/userdata")
	.then((res) => res.json())
	.then((data) =>{
		//console.log("loaded userdata", data); // debug
		userData.value = data.userData;
		friends.value = data.friends;
		if (friends.value.length > 0) { // if user has friends, load chat with first friend
			loadChat(friends.value[0].user_id);
		}
		
		loadingMessages.value = false;
});


// send message
function sendMessage (event) {
	if (!WS_sendData) return alert("disconnected from server. Wait a moment and try again"); // websocket not connected
	//console.log("sending message", textarea.value, "to", currentChat.value, "from", userData.value.user_id); // debug
	if (event.shiftKey) return;
	event.preventDefault();
	
	if (!textarea.value.trim() || !userData.value.user_id || !currentChat.value) return; // invalid message
	if (textarea.value.length > 1000 || textarea.value.trim().split('\n').length-1 > 10) return alert('the message is too long');
	
	WS_sendData({type: "message", message: textarea.value.trim(), to: currentChat.value, from: userData.value.user_id});
	textarea.value="";
};


function loadChat(id) {
	if (currentChat.value == id) return;
	currentChat.value = id;
	loadingMessages.value = true;
	messageCount = 0;
	currentChat.value = id;

	fetch(`/api/messages?msg_count=0&to=${id}`)
		.then((res) => res.json())
		.then((data) =>{
			if (data.count[0].num_messages > 50) moreMessages.value = true;

			messages.value = data.messages.sort((a, b) => Math.sign(Date.parse(a.sent_at) - Date.parse(b.sent_at)))
				.map((message) => {return {message_text: message.message_text, from: message.sender_id,
																	 to: message.recever_id, byMe: message.sender_id == userData.value.user_id}}
			);

			loadingMessages.value = false;
			scrollToBottom(false);
	});
}

function searchFriends() {	
	fetch(`/api/usersearch?username=${addFriendInput.value.trim()}`)
		.then((res) => res.json())
		.then((data) =>{
			addFriendResults.value = data.filter((result) => (result.user_id != userData.value.user_id));
	});
}

function addFriend(user_id) {
	if (isNaN(user_id)) return;
	
	fetch(`/api/addfriend?user_id=${user_id}`, {method:"POST"});
	
	setTimeout(()=>{ // wait for database to update THEN load new friends
		fetch("/api/userdata")
			.then((res) => res.json())
			.then((data) =>{
				friends.value = data.friends;
		});
	}, 1000);
}

function loadMoreMessages() {
	loadingMessages.value = true;
	messageCount++;
	fetch(`/api/messages?msg_count=${messageCount}&to=${currentChat.value}`)
		.then((res) => res.json())
		.then((data) =>{
			//console.log("loaded messages", data);
			if (!(data.count[0].num_messages > (messageCount)*25)) moreMessages.value = false;
			
			let newMessages = data.messages.sort((a, b) => Math.sign(Date.parse(a.sent_at) - Date.parse(b.sent_at)))
				.map((message) => {return {message_text: message.message_text, from: message.sender_id,
																	 to: message.recever_id, byMe: message.sender_id == userData.value.user_id}}
			);
			messages.value = newMessages.concat(messages.value);
			
			loadingMessages.value = false;
	});
}


function scrollToBottom(smooth=true) {
	// wait for the DOM to update with IIFE
	(async()=>{
		await nextTick();
		const messageArea = document.querySelector("#messages");
		messageArea.scrollTo({top: messageArea.scrollHeight, behavior: smooth?'smooth':'auto'});
	})();
}


// Websocket functions
function on_WS_message(rawData) {
	//console.log("received message", rawData); // debug
	if (rawData == 'closeClient') {
		popupValue.value = 'hide';
		alert("Your account has been logged in from another device/window. You will be disconnected from this current session.");
	};
	
	let data;
	try {
		data = JSON.parse(rawData);
	} catch (e) {return} // data is not a stringified json object
	if (!data?.type) return; // data is not a valid message

	if (data.type == "message") {
		if (data.sender_id == currentChat.value || data.sender_id == userData.value.user_id) {
			let message = {message_text: data.message_text, from: data.sender_id, to: data.recever_id, byMe: data.sender_id == userData.value.user_id};
			messages.value.push(message);
			scrollToBottom();
		}
	}
}
setupWS(on_WS_message);



// mount vue app
const app = {
	setup() {
		return {
			messages, 
			moreMessages, 
			friends, 
			currentChat, 
			userData, 
			loadChat,
			loadingMessages, 
			sendMessage, 
			textarea, 
			popupValue,
			addFriendResults,
			searchFriends,
			addFriend,
			addFriendInput,
			loadMoreMessages
		}
	},
	components : {
		test:{props:["show", "name"],template: `<transition name="fade"><div class="popups" v-if="show"><div id="popup" :class="name"><slot></slot></div></div></transition>`}
	}
};
createApp(app).mount('body');