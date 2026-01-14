import React, {useEffect, useRef, useState} from "react";
import {useBlocker, useNavigate, useOutletContext} from "react-router-dom";
import {PostMessageData, ProfileContextType, TurnstileContextType, VMInstanceDataType} from "../../constants/Type";
import {Col, Modal, Row, Spinner} from "react-bootstrap";
import {TroubleshootResponse} from "../../constants/Interface";
import {API_URL} from "../../constants/GlobalVariable";
import {toastHttpError} from "../../components/ToastHttpError";
import {useTurnstile} from "../../hook/Turnstile";

/**
 * Profile component
 *
 * This component displays a modal with VPN profiles for a specific virtual machine (VM).
 * It sets the document title based on the VM name and blocks navigation when the modal is open.
 * Path: /:id/profile
 *
 */
const Troubleshoot: React.FC = () => {
    const [show, setShow] = useState(true);
    const {data} = useOutletContext<ProfileContextType>()
    const [steps, setSteps] = useState<TroubleshootResponse[]>([]);
    const navigate = useNavigate();
    const lock = useRef(false)
    const execute = useTurnstile();

    // set title
    useEffect(() => {
        document.title = data._name + " Troubleshoot - Cocomine VPN"
    }, [data]);

    // block navigation when modal is open
    let blocker = useBlocker(() => {
        setShow(false)
        return true
    });

    // redirect to home page after modal close animation
    useEffect(() => {
        if (show) return
        const id = setTimeout(() => {
            if (blocker.state === "blocked") blocker.proceed()
        }, 150);
        return () => clearTimeout(id);
    }, [show, blocker]);

    // start troubleshoot on component mount
    useEffect(() => {
        if (lock.current) return;
        lock.current = true;

        (async () => {
            let id_counter = 0;

            // Step 1: Check internet connectivity
            try {
                id_counter = await step1_CheckInternet(id_counter, (step) => {
                    setSteps(prev => [...prev.filter(s => s.id !== step.id), step]);
                });
            } catch {
                return; // stop further steps if internet check failed
            }

            // Step 2: Check VPN server status
            try {
                id_counter = await step2_ServerSideCheck(id_counter, data, execute, (step) => {
                    setSteps(prev => [...prev.filter(s => s.id !== step.id), step]);
                });
                await delay(500);
            } catch {
                return; // stop further steps if server-side check failed
            }

            // Step 3: Check browser VPN extension
            try {
                id_counter = await step3_ExtensionCheck(id_counter, data, (step) => {
                    setSteps(prev => [...prev.filter(s => s.id !== step.id), step]);
                });
                await delay(500);
            } catch {
                return; // stop further steps if server-side check failed
            }

            // Final Step: Troubleshoot complete
            const finalStep1: TroubleshootResponse = {
                id: id_counter++,
                status: 'finished',
                message: '所有診斷完成',
                timestamp: new Date().toISOString(),
            };
            setSteps(prev => [...prev, finalStep1]);
            await delay(500);
            const finalStep2: TroubleshootResponse = {
                id: id_counter++,
                status: 'info',
                message: '關於VPN程式的使用問題請參閱該程式的支援頁面 或 Discord Cocomine',
                timestamp: new Date().toISOString(),
            };
            setSteps(prev => [...prev, finalStep2]);
        })()
    }, [data, execute]);

    return (
        <>
            <Modal show={show} onHide={() => navigate('..')} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>排解疑難 <small style={{color: "darkgray", fontSize: "x-small"}}>
                        ({data._name})
                    </small></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className={"justify-content-center g-3"}>
                        {steps
                            .sort((a, b) => a.id - b.id)
                            .map((step) => (
                                <TroubleshootStep key={step.id} data={step}/>
                            ))
                        }
                    </Row>
                </Modal.Body>
            </Modal>
        </>
    );
};

/**
 * Troubleshoot step component
 * @param data - Troubleshoot step data
 * @constructor
 */
const TroubleshootStep: React.FC<{ data: TroubleshootResponse }> = ({data}) => {
    return (
        <Col xs={12} className={"text-center troubleshoot-step"} style={{fontSize: '1.1em'}}>
            <div>
                {data.status === 'pending' &&
                    <span className={'text-secondary'}><Spinner animation="border" size="sm"/> {data.message}</span>}
                {data.status === 'success' &&
                    <span className={'text-success'}><i className="bi bi-check-circle-fill"></i> {data.message}</span>}
                {data.status === 'failed' &&
                    <span className={'text-danger'}><i className="bi bi-x-circle-fill"></i> {data.message}</span>}
                {data.status === 'info' &&
                    <span className={'text-info'}><i className="bi bi-info-square-fill"></i> {data.message}</span>}
                {data.status === 'warning' &&
                    <span className={'text-warning'}><i className="bi bi-exclamation-triangle-fill"></i> {data.message}</span>}
                {data.status === 'finished' &&
                    <span className={'text-primary'}><i className="bi bi-check2-all"></i> {data.message}</span>}
            </div>
        </Col>
    );
}

/**
 * Step 1: Check internet connectivity
 * @param id_counter - Current step ID counter
 * @param stepMessageCallback - Callback to update step message
 * @returns Promise<number> - Updated step ID counter
 */
function step1_CheckInternet(id_counter: number, stepMessageCallback: (step: TroubleshootResponse) => void) {
    return new Promise<number>(async (resolve, reject) => {
        stepMessageCallback({
            id: id_counter,
            status: 'pending',
            message: '檢查網絡連接...',
            timestamp: new Date().toISOString(),
        })
        await delay(1000);

        try {
            await fetch('https://1.1.1.1', {method: 'HEAD', mode: 'no-cors'});
            stepMessageCallback({
                id: id_counter,
                status: 'success',
                message: '網絡連接正常',
                timestamp: new Date().toISOString(),
            })
        } catch (error) {
            stepMessageCallback({
                id: id_counter,
                status: 'failed',
                message: '無法連接到互聯網, 請檢查您的網絡設置',
                timestamp: new Date().toISOString(),
            })
            console.error(error)
            reject(++id_counter) // stop further steps
            return;
        }
        resolve(++id_counter); // proceed to next step
    })
}

/**
 * Step 2: Check VPN server status
 * @param id_counter - Current step ID counter
 * @param data - VM instance data
 * @param execute - Turnstile execute function
 * @param stepMessageCallback - Callback to update step message
 * @returns Promise<number> - Updated step ID counter
 */
function step2_ServerSideCheck(id_counter: number, data: VMInstanceDataType, execute: TurnstileContextType, stepMessageCallback: (step: TroubleshootResponse) => void) {
    return new Promise<number>(async (resolve, reject) => {
        stepMessageCallback({
            id: id_counter,
            status: 'pending',
            message: '正在請求檢查節點狀態...',
            timestamp: new Date().toISOString(),
        });
        await delay(1000);

        // Step 2.1: request server-side troubleshoot
        const serverSide = () => new Promise<Response>(async (resolve1, reject1) => {
            try {
                const response = await fetch(API_URL + `/vpn/${data._id}/troubleshoot`);
                if (!response.ok) {
                    //handle turnstile challenge
                    if (response.status === 403 && response.headers.has('cf-mitigated') && response.headers.get('cf-mitigated') === 'challenge') {
                        try {
                            await execute()
                        } catch (e) {
                            stepMessageCallback({
                                id: id_counter,
                                status: 'failed',
                                message: '無法通過防火牆驗證, 請稍後再試',
                                timestamp: new Date().toISOString(),
                            });
                            console.error(e)
                            reject1(e)
                            return;
                        }
                        resolve1(await serverSide()); // retry
                    }

                    // other errors
                    toastHttpError(response.status);
                    reject1(response);
                    return;
                }

                resolve1(response); // return the response for further processing
            } catch (error) {
                stepMessageCallback({
                    id: id_counter,
                    status: 'failed',
                    message: '無法請求檢查節點狀態, 請稍後再試',
                    timestamp: new Date().toISOString(),
                });
                console.error(error)
                reject1(error)
            }
        });

        //Step 2.2: process ndjson response
        try {
            const response = await serverSide()

            // verify ReadableStream support
            if (!response.body) {
                console.error("ReadableStream not supported or verified.");
                reject(++id_counter);
                return;
            }
            const reader = response.body.getReader();

            stepMessageCallback({
                id: id_counter++,
                status: 'success',
                message: '節點狀態檢查請求已送出',
                timestamp: new Date().toISOString(),
            });

            const decoder = new TextDecoder("utf-8");
            let buffer = '';
            let internal_id_counter = id_counter;
            while (true) {
                const {value, done} = await reader.read(); // read the chunk
                // read complete
                if (done) break;

                // decode the chunk and append to buffer
                const chunk = decoder.decode(value, {stream: true});
                buffer += chunk;

                // split buffer into lines
                const lines = buffer.split('\n');

                // keep the last partial line in the buffer for the next chunk
                buffer = lines.pop() || '';

                // process each complete line
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue; // skip empty lines

                    try {
                        const data: TroubleshootResponse = JSON.parse(trimmedLine);
                        internal_id_counter = id_counter + data.id;
                        stepMessageCallback({
                            ...data,
                            id: internal_id_counter,
                        });
                        console.debug(data);

                        if (data.status === 'finished') {
                            resolve(++internal_id_counter); // proceed to next step
                            return;
                        }

                        if (data.status === 'pending') await delay(1000);

                        // stop further steps on failure
                        if (data.status === 'failed') {
                            reject(++internal_id_counter); // stop further steps
                            return;
                        }

                    } catch (e) {
                        stepMessageCallback({
                            id: internal_id_counter,
                            status: 'failed',
                            message: '伺服器回應格式錯誤, 請稍後再試',
                            timestamp: new Date().toISOString(),
                        });
                        reject(++internal_id_counter) // stop further steps
                        return;
                    }
                }
            }
        } catch (e) {
            stepMessageCallback({
                id: id_counter,
                status: 'failed',
                message: '無法解析伺服器回應, 請稍後再試',
                timestamp: new Date().toISOString(),
            });
            reject(++id_counter) // stop further steps
            return;
        }
    });
}

/**
 * Step 3: Check browser VPN extension
 * @param id_counter
 * @param data
 * @param stepMessageCallback
 */
function step3_ExtensionCheck(id_counter: number, data: VMInstanceDataType, stepMessageCallback: (step: TroubleshootResponse) => void) {
    return new Promise<number>(async (resolve, reject) => {
        stepMessageCallback({
            id: id_counter,
            status: 'pending',
            message: '檢查是否有安裝覽器VPN擴充...',
            timestamp: new Date().toISOString(),
        });
        await delay(1000);

        // callback function
        let timer: NodeJS.Timeout;

        async function callback(e: MessageEvent<PostMessageData>) {
            if (e.source !== window) return;

            // check for extension installed message
            if ((e.data.type === 'ExtensionInstalled') && !e.data.ask) {
                if (!e.data.data.installed) {
                    stepMessageCallback({
                        id: id_counter,
                        status: 'info',
                        message: '檢查是否有安裝覽器VPN擴充...',
                        timestamp: new Date().toISOString(),
                    });
                    removeListener()
                    return resolve(++id_counter);
                }

                // check extension version
                if (e.data.data.version < '2.2.0') {
                    stepMessageCallback({
                        id: id_counter,
                        status: 'warning',
                        message: '偵測到Cocomine VPN擴充版本過舊, 請更新至最新版本以獲得最佳使用體驗',
                        timestamp: new Date().toISOString(),
                    });
                    removeListener();
                    return resolve(++id_counter);
                }

                // extension is installed and up-to-date
                stepMessageCallback({
                    id: id_counter++,
                    status: 'success',
                    message: '已偵測到安裝Cocomine VPN擴充',
                    timestamp: new Date().toISOString(),
                });
                await delay(1000);

                // Step 3.1: Check VPN connection status through extension
                stepMessageCallback({
                    id: id_counter,
                    status: 'pending',
                    message: '透過擴充插件重新連線VPN...',
                    timestamp: new Date().toISOString(),
                });
                await delay(1000);
                window.postMessage({type: 'ConnectByExtension', ask: true});
            }

            if ((e.data.type === 'ConnectByExtension') && !e.data.ask) {
                if (!e.data.data.connectByExtension) {
                    stepMessageCallback({
                        id: id_counter,
                        status: 'warning',
                        message: 'VPN目前未連線, 請手動嘗試連線',
                        timestamp: new Date().toISOString(),
                    });
                    removeListener()
                    return resolve(++id_counter);
                }
                window.postMessage({type: 'Connect', ask: true, data});
            }

            // receive connect response
            if ((e.data.type === 'Connect') && !e.data.ask) {
                if (e.data.data.connected) {
                    stepMessageCallback({
                        id: id_counter,
                        status: 'success',
                        message: 'VPN重新連線成功',
                        timestamp: new Date().toISOString(),
                    });
                    resolve(++id_counter);
                } else {
                    stepMessageCallback({
                        id: id_counter,
                        status: 'failed',
                        message: 'VPN重新連線失敗, 請手動嘗試連線',
                        timestamp: new Date().toISOString(),
                    });
                    reject(++id_counter);
                }
                removeListener()
            }
        }

        function removeListener() {
            window.removeEventListener('message', callback);
            clearTimeout(timer)
        }

        // timeout handler, in case no response from extension
        timer = setTimeout(() => {
            stepMessageCallback({
                id: id_counter,
                status: 'info',
                message: '未偵測到安裝Cocomine VPN擴充',
                timestamp: new Date().toISOString(),
            });
            removeListener();
            resolve(++id_counter);
        }, 5000); // timeout after 5 seconds

        window.addEventListener('message', callback);
        window.postMessage({type: 'ExtensionInstalled', ask: true});
    })
}

/**
 * Intentionally creating delays to make the process look more comfortable.
 * @param ms - milliseconds to delay
 */
async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default Troubleshoot;
