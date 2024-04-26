import {API_URL, TOKEN} from "./App";
import {useEffect, useState} from "react";

type websocketData = {
    url: string,
    data: any,
}

interface IWS_ticket {
    data?: {
        ticket: string
    }
}

const NODE_ENV = process.env.NODE_ENV || 'development';
let websocket: WebSocket;

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
        tmp_ws = new WebSocket("ws://192.168.0.102:8088/vpn/ws");
    } else {
        tmp_ws = new WebSocket("wss://api.cocomine.cc/vpn/ws");
    }

    tmp_ws.addEventListener('open', () => {
        console.log("WebSocket Connected")
        tmp_ws.send(data.data?.ticket || "") //send ticket
    });
    tmp_ws.addEventListener('error', (event) => {
        console.error(event)
    });
    tmp_ws.addEventListener('close', () => {
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

function useWebsocket() {
    const [ws, setWebSocket] = useState<WebSocket>(websocket);

    useEffect(() => {
        setWebSocket(websocket)
        // eslint-disable-next-line
    }, [websocket]);

    return ws;
}

export {connectWebsocket, useWebsocket};
export type {websocketData};
