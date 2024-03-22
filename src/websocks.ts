import {API_URL, TOKEN} from "./App";
import {VMData} from "./Menu";

type websocketData = {
    url: string,
    data: VMData,
}

const NODE_ENV = process.env.NODE_ENV || 'development';
let websocket: WebSocket;

interface IWS_ticket {
    data?: {
        ticket: string
    }
}

const connectWebsocket = async () => {
    let data: IWS_ticket;
    try {
        const res = await fetch(API_URL + "/vpn/ws/ticket", {
            method: "GET",
            credentials: "include",
            redirect: "error",
            headers: {
                "Cf-Access-Jwt-Assertion": TOKEN,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        if (!res.ok) {
            setTimeout(connectWebsocket, 5000) //reconnect at 5s
            return;
        }
        data = await res.json();
    } catch (err: any) {
        setTimeout(connectWebsocket, 5000) //reconnect at 5s
        return;
    }

    //connect to websocket server
    if (NODE_ENV === 'development') {
        websocket = new WebSocket("ws://localhost:8088/vpn/ws");
    } else {
        websocket = new WebSocket("wss://api.cocomine.cc/vpn/ws");
    }

    websocket.onopen = () => {
        console.log("WebSocket Connected")
        websocket.send(data.data?.ticket || "")
    }
    websocket.onclose = () => {
        console.warn("WebSocket Disconnected. Reconnect in 5s.")
        setTimeout(connectWebsocket, 5000) //reconnect at 5s
    }
    websocket.onerror = (event) => {
        console.error(event)
    }
    websocket.onmessage = (event) => {
        console.debug("Received message from server: " + event.data)
    }
}


export {connectWebsocket, websocket};
export type {websocketData};
