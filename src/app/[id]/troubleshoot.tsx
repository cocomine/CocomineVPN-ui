import React, {useEffect, useRef, useState} from "react";
import {useBlocker, useNavigate, useOutletContext} from "react-router-dom";
import {PostMessageData, ProfileContextType} from "../../constants/Type";
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
    const execute = useTurnstile();
    const navigate = useNavigate();
    const lock = useRef(false)

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
            const step1: TroubleshootResponse = {
                id: id_counter++,
                status: 'pending',
                message: '檢查網絡連接...',
                timestamp: new Date().toISOString(),
            };
            setSteps([step1]);

            await delay(500);
            try {
                await fetch('https://1.1.1.1', {method: 'HEAD', mode: 'no-cors'});
                step1.status = 'success';
                step1.message = '網絡連接正常';
                setSteps(prev => [...prev.filter(s => s.id !== step1.id), step1]);
            } catch (error) {
                step1.status = 'failed';
                step1.message = '無法連接到互聯網, 請檢查您的網絡設置';
                setSteps(prev => [...prev.filter(s => s.id !== step1.id), step1]);
                return;
            }

            // Step 2: Check VPN server status
            const step2: TroubleshootResponse = {
                id: id_counter++,
                status: 'pending',
                message: '正在請求檢查節點狀態...',
                timestamp: new Date().toISOString(),
            };
            setSteps(prev => [...prev, step2]);

            await delay(1000);
            const serverSide = async (): Promise<boolean> => {
                let isFinished = false;
                try {
                    const response = await fetch(API_URL + `/vpn/${data._id}/troubleshoot`);
                    if (!response.ok) {
                        //handle turnstile challenge
                        if (response.status === 403 && response.headers.has('cf-mitigated') && response.headers.get('cf-mitigated') === 'challenge') {
                            try {
                                await execute()
                                return await serverSide(); // retry
                            } catch (e) {
                                step2.status = 'failed';
                                step2.message = '無法通過防火牆驗證, 請稍後再試';
                                setSteps(prev => [...prev.filter(s => s.id !== step2.id), step2]);
                                console.error(e)
                                return false;
                            }
                        }

                        toastHttpError(response.status); // other errors
                        throw response;
                    }

                    if (!response.body) {
                        console.error("ReadableStream not supported or verified.");
                        throw response;
                    }

                    step2.status = 'success';
                    step2.message = '節點狀態檢查請求已發送';
                    setSteps(prev => [...prev.filter(s => s.id !== step2.id), step2]);

                    //Step 2.1: process ndjson response
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = '';

                    while (true) {
                        const {value, done} = await reader.read(); // read the chunk
                        if (done) break; // read complete

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
                                console.debug(data);
                                data.id += id_counter;
                                setSteps(prev => [...prev.filter(s => s.id !== data.id), data]);

                                if (data.status === 'finished') {
                                    id_counter = data.id + 1;
                                    isFinished = true;
                                }
                            } catch (e) {
                                step2.status = 'failed';
                                step2.message = '無法解析伺服器回應, 請稍後再試';
                                setSteps(prev => [...prev.filter(s => s.id !== step2.id), step2]);
                                console.error("解析 JSON 失敗:", trimmedLine, e);
                                throw e;
                            }
                        }
                    }
                } catch (error) {
                    step2.status = 'failed';
                    step2.message = '無法請求檢查節點狀態, 請稍後再試';
                    setSteps(prev => [...prev.filter(s => s.id !== step2.id), step2]);
                    console.error(error)
                }
                return isFinished;
            }
            if (!await serverSide()) return;

            // Step 3: Check browser VPN extension
            const step3: TroubleshootResponse = {
                id: id_counter++,
                status: 'pending',
                message: '檢查是否有安裝覽器VPN擴充...',
                timestamp: new Date().toISOString(),
            };
            setSteps(prev => [...prev, step3]);

            await delay(1000);
            const extensionSide = new Promise((resolve, reject) => {
                // callback function
                let step3_1: TroubleshootResponse, timer: NodeJS.Timeout;

                async function callback(e: MessageEvent<PostMessageData>) {
                    if (e.source !== window) {
                        return;
                    }

                    // check for extension installed message
                    if ((e.data.type === 'ExtensionInstalled') && !e.data.ask) {
                        if (!e.data.data.installed) {
                            step3.status = 'info';
                            step3.message = '未偵測到安裝Cocomine VPN擴充';
                            setSteps(prev => [...prev.filter(s => s.id !== step3.id), step3]);
                            removeListener()
                            return resolve('Extension not installed');
                        }

                        // check extension version
                        if (e.data.data.version < '2.2.0') {
                            step3.status = 'warning';
                            step3.message = '偵測到Cocomine VPN擴充版本過舊, 請更新至最新版本以獲得最佳使用體驗';
                            setSteps(prev => [...prev.filter(s => s.id !== step3.id), step3]);
                            removeListener();
                            return reject('Extension outdated');
                        }

                        // extension is installed and up-to-date
                        step3.status = 'success';
                        step3.message = '已偵測到安裝Cocomine VPN擴充';
                        setSteps(prev => [...prev.filter(s => s.id !== step3.id), step3]);
                        await delay(1000);

                        // Step 3.1: Check VPN connection status through extension
                        step3_1 = {
                            id: id_counter,
                            status: 'pending',
                            message: '透過擴充重新連線VPN...',
                            timestamp: new Date().toISOString(),
                        };
                        setSteps(prev => [...prev, step3_1]);
                        await delay(1000);

                        window.postMessage({type: 'ConnectByExtension', ask: true});
                    }

                    if ((e.data.type === 'ConnectByExtension') && !e.data.ask) {
                        if (!e.data.data.isConnect) {
                            const step3_1: TroubleshootResponse = {
                                id: id_counter++,
                                status: 'warning',
                                message: 'VPN目前未連線, 請手動嘗試連線',
                                timestamp: new Date().toISOString(),
                            };
                            setSteps(prev => [...prev, step3_1]);
                            removeListener()
                            return reject('VPN not connected');
                        }
                        window.postMessage({type: 'Connect', ask: true, data});
                    }

                    // receive connect response
                    if ((e.data.type === 'Connect') && !e.data.ask) {
                        let step3_2: TroubleshootResponse;
                        if (e.data.data.connected) {
                            step3_2 = {
                                id: id_counter++,
                                status: 'success',
                                message: 'VPN重新連線成功',
                                timestamp: new Date().toISOString(),
                            };
                            resolve('VPN reconnect successful');
                        } else {
                            step3_2 = {
                                id: id_counter++,
                                status: 'failed',
                                message: 'VPN重新連線失敗, 請手動嘗試連線',
                                timestamp: new Date().toISOString(),
                            };
                            reject('VPN reconnect failed');
                        }
                        setSteps(prev => [...prev.filter(s => s.id !== step3_2.id), step3_2]);
                        removeListener()
                    }
                }

                function removeListener() {
                    window.removeEventListener('message', callback);
                    clearTimeout(timer)
                }

                // timeout handler, in case no response from extension
                timer = setTimeout(() => {
                    step3.status = 'info';
                    step3.message = '未偵測到安裝Cocomine VPN擴充';
                    setSteps(prev => [...prev.filter(s => s.id !== step3.id), step3]);
                    return resolve('Extension not installed');
                }, 5000); // timeout after 5 seconds

                window.addEventListener('message', callback);
                window.postMessage({type: 'ExtensionInstalled', ask: true});
            });
            try {
                await extensionSide;
            } catch (e) {
                console.error(e);
            }
            await delay(1000);

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
    }, [data._id]);

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
 * Intentionally creating delays to make the process look more comfortable.
 * @param ms - milliseconds to delay
 */
async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default Troubleshoot;
