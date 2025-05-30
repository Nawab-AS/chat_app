let WS_sendData = undefined;
if (true) { // create a hidden scope
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
            
            if (typeof setup_WS_client === 'function') {
                WS_sendData({ type: "auth", token: cookies.get("authToken")});
                setup_WS_client(websocket);
            } else {
                console.info('setup_WS_client is not defined');
            }
            
            websocket.addEventListener("close", () => {
                console.log("WebSocket connection closed, attempting to reconnect...");
                WS_sendData = undefined;
                connect();
                if (typeof close_WS_client === 'function') {
                    close_WS_client(websocket);
                } else {
                    console.info('close_WS_client is not defined');
                }
            });
            console.log("Connected to WebSocket server successfully");
        });
    };
    
    connect();
};
