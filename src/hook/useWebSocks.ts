import {useEffect, useState} from "react";
import {API_URL, NODE_ENV, TOKEN} from "../constants/GlobalVariable";
import {WebSocketDataType} from "../constants/Type";
import {I_WebSocketTicket} from "../constants/Interface";


let websocket: WebSocket | null = null;
const listeners = new Set<(ws: WebSocket) => void>(); // 儲存訂閱者

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
        const res = await fetch(API_URL + "/vpn/v2/ws/ticket", {
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
        console.warn("WebSocket Disconnected. Reconnect in 1s.")
        websocket = null; // 清空
        listeners.forEach(l => l(null as any)); // 通知斷線 (如果需要處理斷線狀態)
        setTimeout(connectWebsocket, 1000); //reconnect at 1s
    });
    tmp_ws.addEventListener('message', (event) => {
        const data: WebSocketDataType = JSON.parse(event.data);
        console.debug(data)

        if (data.url === "/ping") {
            // 回應 ping
            tmp_ws.send(JSON.stringify({url: "/pong", data: null}));
        }

        websocket = tmp_ws;
        console.log("WebSocket Authorized successful")
        // 通知所有 Hook 更新狀態
        listeners.forEach(listener => listener(websocket!));
    });
}

/**
 * Custom hook to manage WebSocket connection state.
 *
 * This hook initializes the WebSocket state and updates it whenever the global `websocket` variable changes.
 **/
function useWebSocket() {
    const [ws, setWebSocket] = useState<WebSocket | null>(websocket);

    useEffect(() => {
        // 當 WebSocket 改變時的處理函式
        const handler = (newWs: WebSocket) => {
            setWebSocket(newWs);
        };

        // 註冊監聽
        listeners.add(handler);

        // 如果當前已經有連線，直接設定 (避免 Hook 載入時錯過事件)
        if (websocket) {
            setWebSocket(websocket);
        }

        // Cleanup: 移除監聽
        return () => {
            listeners.delete(handler);
        };
    }, []);

    return ws;
}

export {connectWebsocket};
export default useWebSocket;
