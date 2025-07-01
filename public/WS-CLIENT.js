let WS_sendData = undefined;
function setupWS(on_WS_message) { // create a hidden scope
    const cookies = new URLSearchParams(document.cookie.replaceAll("; ", "&"));
    let allowReconnect = true;
    let connect = () => {
        // Connect to the WebSocket server
        const websocketURL = "wss://" + window.location.hostname +(window.location.port != '' ? ":" + window.location.port: '');
        let websocket;
        try {
            websocket = new WebSocket(websocketURL);
        } catch (e) {
            return connect();
        }
        // initialise the websocket client after connection
        websocket.addEventListener("open", (_) => {
            WS_sendData = (data) => {
                websocket.send(JSON.stringify(data));
            };
            WS_sendData({ type: "auth", token: cookies.get("authToken")});
            websocket.addEventListener("message", (rawData) =>{
                if (rawData.data == "closeClient"){
                    // WebSocket connection closed by server (reconnection not allowed
                    allowReconnect = false;
                    websocket.close();
                }
                on_WS_message(rawData.data);
            })
            
            websocket.addEventListener("close", () => {
                WS_sendData = undefined;
                if (!allowReconnect) return;
                console.log("WebSocket connection closed, attempting to reconnect...");
                connect();
                if (typeof close_WS_client === 'function') {
                    close_WS_client(websocket);
                }
            });
            console.log("Connected to WebSocket server successfully");
        });
    };
    
    connect();
};
