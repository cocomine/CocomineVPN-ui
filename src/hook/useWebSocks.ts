import {useEffect, useState} from "react";
import {API_URL, NODE_ENV, TOKEN} from "../constants/GlobalVariable";
import {WebSocketDataType} from "../constants/Type";
import {I_WebSocketTicket} from "../constants/Interface";

let websocket: WebSocket;

/**
 * Connects to the WebSocket server.
 *
 * This function first fetches a ticket from the server and then uses it to establish a WebSocket connection.
 * It handles reconnection attempts in case of failure and sets up event listeners for WebSocket events.
 */
const connectWebsocket = async () => {
    //get ticket
    let data: I_WebSocketTicket;
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
    const ws_url = new URL(API_URL + '/vpn/v2/ws');
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
        const data: WebSocketDataType = JSON.parse(event.data);
        console.debug(data)
        if (data.data.auth) {
            websocket = tmp_ws;
            console.log("WebSocket Authentication successful")
        }
    });
}

/**
 * Custom hook to manage WebSocket connection state.
 *
 * This hook initializes the WebSocket state and updates it whenever the global `websocket` variable changes.
 **/
function useWebSocket() {
    const [ws, setWebSocket] = useState<WebSocket>(websocket);

    useEffect(() => {
        setWebSocket(websocket)
        // eslint-disable-next-line
    }, [websocket]);

    return ws;
}

export {connectWebsocket};
export default useWebSocket;
