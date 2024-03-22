import {API_URL, TOKEN} from "./App";

type websocketData = {
    url: string,
    data: any,
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
    let tmp_ws: WebSocket;
    if (NODE_ENV === 'development') {
        tmp_ws = new WebSocket("ws://localhost:8088/vpn/ws");
    } else {
        tmp_ws = new WebSocket("wss://api.cocomine.cc/vpn/ws");
    }

    tmp_ws.addEventListener('open', () => {
        console.log("WebSocket Connected")
        tmp_ws.send(data.data?.ticket || "")
    });
    tmp_ws.addEventListener('error', (event) => {
        console.error(event)
    });
    tmp_ws.addEventListener('close', (event) => {
        console.warn("WebSocket Disconnected. Reconnect in 5s.")
        setTimeout(connectWebsocket, 5000) //reconnect at 5s
    });
    tmp_ws.addEventListener('message', (event) => {
        const data: websocketData = JSON.parse(event.data);
        console.debug(data)
        if (data.data.auth) {
            websocket = tmp_ws;
        }
    });
}


export {connectWebsocket, websocket};
export type {websocketData};
