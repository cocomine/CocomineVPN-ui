const NODE_ENV = process.env.NODE_ENV || 'development';
let websocket: WebSocket;

const connectWebsocket = () => {
    if (NODE_ENV === 'development') {
        websocket = new WebSocket("ws://localhost:8088/vpn/ws");
    } else {
        websocket = new WebSocket("wss://vpn.cocomine.cc/api/vpn/ws");
    }

    websocket.onopen = () => {
        console.log("WebSocket Connected")
        websocket.send("Ping!")
    }
    websocket.onclose = () => {
        console.warn("WebSocket Disconnected. Reconnect in 5s.")
        //reconnect at 5s
        setTimeout(connectWebsocket, 5000)
    }
    websocket.onerror = (event) => {
        console.error(event)
    }
    websocket.onmessage = (event) => {
        console.debug("Received message from server: " + event.data)
    }
}


export {connectWebsocket, websocket}