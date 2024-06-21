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
    //get ticket
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
    const ws_url = new URL(API_URL);
    ws_url.pathname = '/api/vpn/v2/ws';
    ws_url.protocol = NODE_ENV === 'development' ? 'ws:' : 'wss:';
    ws_url.searchParams.append('ticket', data.data?.ticket ?? '');
    const tmp_ws = new WebSocket(ws_url);

    tmp_ws.addEventListener('open', () => {
        console.log("WebSocket Connected")
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
            console.log("WebSocket Authentication successful")
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
