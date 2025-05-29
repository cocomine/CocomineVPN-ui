import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button, Col, Modal, Ratio, Row, Spinner} from "react-bootstrap";
import {
    Link,
    Navigate,
    Outlet,
    useBlocker,
    useLoaderData,
    useLocation,
    useNavigate,
    useOutletContext
} from "react-router-dom";
import {toast} from "react-toastify";
import power from "../../assets/images/svg/power.svg";
import tools from "../../assets/images/svg/tools.svg";
import moment from "moment/moment";
import {API_URL, TOKEN} from "../../constants/GlobalVariable";
import {ContextType, VMDataType} from "../../constants/Type";
import {toastHttpError} from "../../components/ToastHttpError";
import {
    I_Connect_PostMessageData,
    I_ExtensionInstalled_PostMessageData,
    I_PostMessageData,
    I_PowerControl
} from "../../constants/Interface";
import {fetchVMData} from "../../hook/Loader";
import ReactGA from "react-ga4";


/**
 * VMAction component
 *
 * This component handles the actions related to a virtual machine (VM), such as power control and extending time.
 * It uses various hooks to manage state, navigation, and side effects.
 *
 * Path: `/:id`
 */
const VMAction: React.FC = () => {
    const {vmData} = useLoaderData() as { vmData: VMDataType };
    const location = useLocation();
    const navigate = useNavigate();
    const [show, setShow] = useState(true);
    const {statusUpdateCallback} = useOutletContext<ContextType>()
    //const revalidator = useRevalidator();

    // power action
    const powerAction = useCallback(async (power: boolean) => {
        // Google Analytics
        ReactGA.event('vm_power_action', {
            vm_name: vmData._name,
            vm_id: vmData._id,
            power: power ? "ON" : "OFF"
        })

        try {
            const res = await fetch(API_URL + "/vpn/" + vmData._id, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Cf-Access-Jwt-Assertion": TOKEN,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    target_state: power ? "START" : "STOP"
                })
            })
            if (!res.ok) {
                if (res.status === 460) return toast.error(`節點只允許 ${vmData._readonly} 操作`)
                if (res.status === 461) return toast.error(`節點已經處於${vmData._isPowerOn ? '開機' : '關機'}狀態`)
                return toastHttpError(res.status)
            }
        } catch (e: any) {
            console.log(e)
            toastHttpError(e.status)
            return
        } finally {
            navigate('..') // redirect to home page
        }

        statusUpdateCallback(power, vmData._id)
    }, [vmData, statusUpdateCallback, navigate]);

    // extend time action
    const extendTime = useCallback(async () => {
        // Google Analytics
        ReactGA.event('vm_extend_time', {
            vm_name: vmData._name,
            vm_id: vmData._id,
        })

        try {
            const res = await fetch(API_URL + "/vpn/" + vmData._id, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Cf-Access-Jwt-Assertion": TOKEN,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
            if (!res.ok) {
                if (res.status === 462) return toast.error(`只允許離線前一小時操作`)
                if (res.status === 463) return toast.error(`節點沒有開啟`)
                return toastHttpError(res.status)
            }
            toast.success("延長開放時間成功")
        } catch (e: any) {
            console.error(e)
            toastHttpError(e.status)
            return
        } finally {
            navigate('..', {replace: true}) // redirect to home page
        }
    }, [vmData, navigate])

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

    // set title
    useEffect(() => {
        if (location.pathname === '/' + vmData._id) {
            document.title = vmData._name + " - Cocomine VPN"
            setShow(true)
        }
    }, [location, vmData]);

    return (
        <>
            {location.pathname === '/' + vmData._id &&
                <Modal show={show} centered onHide={() => navigate('..', {replace: true})}>
                    <Modal.Header closeButton>
                        <Modal.Title>你想? <small
                            style={{color: "darkgray", fontSize: "x-small"}}>({vmData._name})</small></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="gx-5 gy-4">
                            <Col>
                                <PowerControl isPower={vmData._isPowerOn} action={powerAction}
                                              readonly={vmData._readonly}/>
                            </Col>
                            <Col className="border-start">
                                <Link to={location.pathname + '/profile'} className="chooseProfile_btn">
                                    <img src={tools} alt="Config file" className="w-100" draggable={false}/>
                                    <p className="text-center pt-2">下載設定檔</p>
                                </Link>
                            </Col>
                            {vmData._isPowerOn && <>
                                <ExtensionConnect vmData={vmData}/>
                                <MobileAppConnect vmData={vmData}/>
                            </>}
                            <ExtendTime expired={vmData._expired} onClick={extendTime}/>
                        </Row>
                    </Modal.Body>
                </Modal>
            }
            <Outlet context={{vmData}}/>
        </>
    );
}

/**
 * ExtensionConnect component for connecting to a browser extension.
 *
 * @param {Object} props - The component props.
 * @param {VMDataType} props.vmData - The VM data.
 *
 */
const ExtensionConnect: React.FC<{ vmData: VMDataType }> = ({vmData}) => {
    const [installed, setInstalled] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)
    const audio = useMemo(() => new Audio(require('../../assets/sounds/Jig 0.mp3')), []);

    // connect to extension
    const onClick = useCallback(() => {
        setLoading(true)

        // Google Analytics
        ReactGA.event('extension_connect', {
            vm_name: vmData._name,
            vm_id: vmData._id,
        })

        // show toast
        toast.promise(new Promise((resolve, reject) => {

            // onMessage event callback function
            function callback(e: MessageEvent<I_PostMessageData>) {
                if (e.source !== window) return;

                // receive connect response
                if ((e.data.type === 'Connect') && !e.data.ask) {
                    const data: I_Connect_PostMessageData = e.data
                    if (data.data.connected) {
                        resolve(true)
                    } else {
                        reject(false)
                    }
                    window.removeEventListener('message', callback); // remove event listener when call
                }
            }

            window.addEventListener('message', callback); // add event listener on message
        }), {
            pending: {render: <>連接檢查中... <br/>檢查需時, 請耐心等候</>},
            success: "連線成功",
            error: "連線失敗"
        }).catch((err) => {
            console.error(err)
        });

        window.postMessage({type: 'Connect', ask: true, data: vmData}); // post message to extension for connect
    }, [vmData]);

    // check if extension is installed
    useEffect(() => {
        // callback function
        function callback(e: MessageEvent<I_PostMessageData>) {
            if (e.source !== window) {
                return;
            }

            // receive extension installed response
            if ((e.data.type === 'ExtensionInstalled') && !e.data.ask) {
                const data: I_ExtensionInstalled_PostMessageData = e.data
                if (!data.data.installed) return;

                setInstalled(vmData._profiles.some(p => p.type === "socks5"))
            }

            // receive connect response
            if ((e.data.type === 'Connect') && !e.data.ask) {
                const data: I_Connect_PostMessageData = e.data
                if (data.data.connected) {
                    setLoading(false)
                    audio.play();
                } else {
                    setLoading(false)
                }
            }
        }

        // add event listener
        window.addEventListener('message', callback);
        window.postMessage({type: 'ExtensionInstalled', ask: true});

        return () => window.removeEventListener('message', callback);
    }, [vmData, audio]);

    if (!installed) return null;
    return (
        <>
            <Col xs={12} className="text-center">
                <div className="border-top w-100"></div>
            </Col>
            <Col xs={12}>
                <Row className="justify-content-center align-items-center g-2 pb-2">
                    <Col xs={"auto"}>
                        <img src={require('../../assets/images/webp/icon with extension.webp')} alt="extension"
                             className="img-fluid"
                             style={{width: "4rem"}}/>
                    </Col>
                    <Col xs={"auto"} className="text-center">
                        <h5>Cocomine VPN 擴充功能</h5>
                        <span className="text-muted small">你已經安裝了擴充功能, 可以使用一鍵連線功能</span>
                    </Col>
                </Row>
                <Button variant="primary" className="w-100 rounded-5 rainbow-btn border-0" onClick={onClick}
                        disabled={loading}>
                    <div className="rounded-5">
                        <Row className="justify-content-center align-content-center h-100">
                            <Col xs="auto">
                                {loading ? <><Spinner animation="grow" size="sm" className="me-2"/> 連線中...</> :
                                    <><i className="bi bi-link-45deg me-2"></i> 一鍵連線</>
                                }
                            </Col>
                        </Row>
                    </div>
                </Button>
            </Col>
        </>
    )
}

/**
 * MobileAppConnect component
 *
 * This component handles the connection to a mobile app for the VPN.
 * It checks if the mobile app is installed and allows the user to connect to it.
 *
 * @param {Object}  - The component props.
 * @param {VMDataType} vmData - The VM data.
 *
 * @returns {JSX.Element | null} - The rendered component or null if the app is not installed.
 */
const MobileAppConnect: React.FC<{ vmData: VMDataType }> = ({vmData}) => {
    const [installed, setInstalled] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)

    // connect to extension
    const onClick = useCallback(() => {
        setLoading(true)
        window.postMessage({type: 'AppConnect', ask: true, data: vmData});
    }, [vmData]);

    // check if extension is installed
    useEffect(() => {
        // callback function
        function callback(e: MessageEvent<I_PostMessageData>) {
            if (e.source !== window) {
                return;
            }

            if ((e.data.type === 'MobileAppInstalled') && !e.data.ask) {
                const data: I_ExtensionInstalled_PostMessageData = e.data
                if (!data.data.installed) return;

                setInstalled(vmData._profiles.some(p => p.type === "OpenVPN"))
            }

            if ((e.data.type === 'AppConnect') && !e.data.ask) {
                //const data: I_Connect_PostMessageData = e.data
                setLoading(false)
            }
        }

        // add event listener
        window.addEventListener('message', callback);
        window.postMessage({type: 'MobileAppInstalled', ask: true});

        return () => window.removeEventListener('message', callback);
    }, [vmData]);

    if (!installed) return null;
    return (
        <>
            <Col xs={12} className="text-center">
                <div className="border-top w-100"></div>
            </Col>
            <Col xs={12}>
                <Row className="justify-content-center align-items-center g-2 pb-2">
                    <Col xs={"auto"} className="text-center">
                        <h5>Cocomine VPN 手機程式</h5>
                        <span className="text-muted small">你已經安裝了手機程式, 可以使用一鍵連線功能</span>
                    </Col>
                </Row>
                <Button variant="primary" className="w-100 rounded-5 rainbow-btn border-0" onClick={onClick}
                        disabled={loading}>
                    <div className="rounded-5">
                        <Row className="justify-content-center align-content-center h-100">
                            <Col xs="auto">
                                {loading ? <Spinner animation="grow" size="sm" className="me-2"/> :
                                    <i className="bi bi-link-45deg me-2"></i>}
                                一鍵連線
                            </Col>
                        </Row>
                    </div>
                </Button>
            </Col>
        </>
    )
}

/**
 * ExtendTime component
 *
 * This component displays the remaining time until the expected offline time and allows the user to extend the time.
 *
 * @param {Object} props - The component props
 * @param {string | null} props.expired - The expiration time as a string or null
 * @param {Function} props.onClick - The function to call when the extend time button is clicked
 */
const ExtendTime: React.FC<{ expired: string | null, onClick: () => void }> = ({expired, onClick}) => {
    const [expect_offline_time_Interval, setExpect_offline_time_Interval] = useState<string>("Loading...")
    const [enableExtend, setEnableExtend] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)
    const location = useLocation();

    const click = useCallback(() => {
        if (loading) return; //if already click
        setLoading(true);
        onClick()
    }, [loading, onClick]);

    // update expect_offline_time_Interval every second
    useEffect(() => {
        if (expired !== null) {
            const id = setInterval(() => {
                const expect_offline_time = moment(expired)
                const diff = expect_offline_time.diff(Date.now())
                const tmp = moment.utc(diff).format('HH:mm:ss')

                if (diff < 60 * 60 * 1000) setEnableExtend(true)
                setExpect_offline_time_Interval(diff > 0 ? tmp : "00:00:00");
            }, 1000)

            return () => clearInterval(id)
        }
    }, [expired]);

    // check if hash is #extendTime
    useEffect(() => {
        if (location.hash === "#extendTime") click()
    }, [click, location.hash]);

    if (expired === null) return null;
    return (
        <>
            <Col xs={12} className="text-center">
                <div className="border-top w-100"></div>
            </Col>
            <Col xs={12} className="text-center">
                <h3>{expect_offline_time_Interval}</h3>
                <p className="small text-muted">距離預計離線</p>
                <Button variant={enableExtend ? "primary" : "outline-primary"}
                        className="w-100 rounded-5" onClick={click}
                        disabled={!enableExtend || loading}>
                    {loading && <Spinner animation="grow" size="sm" className="me-2"/>}
                    {enableExtend ? "延長開放時間" : "離線前一小時可以延長開放時間"}
                </Button>
            </Col>
        </>
    )
}

/**
 * PowerControl component
 *
 * This component renders a button that allows the user to control the power state of a node.
 * The button supports a long press event to trigger the power action.
 *
 * @param {Object} props - The component props
 * @param {boolean} props.isPower - The current power state of the node
 * @param {Function} props.action - The function to call to change the power state
 * @param {string} props.readonly - The readonly state of the node
 */
const PowerControl: React.FC<I_PowerControl> = ({isPower, action, readonly}) => {
    const timeout = useRef<NodeJS.Timeout | null>(null)
    const [loading, setLoading] = useState(false) // loading state

    // on mouse down start timeout for long press event
    const onMouseDown = useCallback(() => {
        timeout.current = setTimeout(() => {
            setLoading(true)
            action(!isPower)
        }, 2000)
    }, [action, isPower]);

    // on mouse up clear timeout for long press event
    const onMouseUp = useCallback(() => {
        if (timeout.current) {
            clearTimeout(timeout.current)
            timeout.current = null
        }
    }, []);

    if (isPower) {
        return (
            <>
                <Ratio aspectRatio="1x1" className="">
                    <Button variant="danger" className="powerBtn" onMouseDown={onMouseDown} onMouseUp={onMouseUp}
                            onTouchStart={onMouseDown} onTouchEnd={onMouseUp}
                            disabled={loading || readonly === "readOnly" || readonly === "startOnly"}>
                        <img src={power} alt="power icon"/>
                        <svg viewBox="0 0 100 100" className="loading">
                            <defs>
                                <circle id="stroke" cx="50" cy="50" r="50"/>

                                <clipPath id="clipPath">
                                    <use xlinkHref="#stroke"/>
                                </clipPath>
                            </defs>

                            <use xlinkHref="#stroke" clipPath="url(#clipPath)" fill="transparent" strokeLinecap="round"
                                 strokeWidth="5" id="anime" className={(loading ? "loading" : undefined)}/>
                        </svg>
                    </Button>
                </Ratio>
                <p className="text-center pt-2">長按關閉節點</p>
            </>
        );
    }

    return (
        <>
            <Ratio aspectRatio="1x1">
                <Button variant="success" className="powerBtn" onMouseDown={onMouseDown} onMouseUp={onMouseUp}
                        onTouchStart={onMouseDown} onTouchEnd={onMouseUp}
                        disabled={loading || readonly === "readOnly" || readonly === "stopOnly"}
                        onContextMenu={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }}>
                    <img src={power} alt="power icon"/>
                    <svg viewBox="0 0 100 100" className="loading">
                        <defs>
                            <circle id="stroke" cx="50" cy="50" r="50"/>

                            <clipPath id="clipPath">
                                <use xlinkHref="#stroke"/>
                            </clipPath>
                        </defs>

                        <use xlinkHref="#stroke" clipPath="url(#clipPath)" fill="transparent" strokeLinecap="round"
                             strokeWidth="5" id="anime" className={(loading ? "loading" : undefined)}/>
                    </svg>
                </Button>
            </Ratio>
            <p className="text-center pt-2">長按啟動節點</p>
        </>
    );
}

/**
 * Loader function for Index
 */
const loader = async ({params}: any) => {
    try {
        const VMData = await fetchVMData(params.id);
        console.debug(VMData)
        return {vmData: VMData.data}
    } catch (e: any) {
        toastHttpError(e.status)
        throw e
    }
}

/**
 * VMActionErrorElement component
 *
 * This component handles the error state for the VMAction route.
 * It redirects the user to the parent route when an error occurs.
 *
 */
const VMActionErrorElement: React.FC = () => {
    return (<Navigate to=".." replace={true} relative="path"/>);
}

export default VMAction;
export {loader, VMActionErrorElement};
