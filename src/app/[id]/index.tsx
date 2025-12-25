import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button, Col, Modal, Placeholder, Ratio, Row, Spinner} from "react-bootstrap";
import {
    Link,
    Navigate,
    Outlet,
    useBlocker,
    useLocation,
    useNavigate,
    useOutletContext,
    useRevalidator
} from "react-router-dom";
import {toast} from "react-toastify";
import power from "../../assets/images/svg/power.svg";
import tools from "../../assets/images/svg/tools.svg";
import moment from "moment/moment";
import {API_URL, PROCESSING_STATUS_TEXT, TOKEN} from "../../constants/GlobalVariable";
import {MenuContextType, PostMessageData, VMInstanceDataType} from "../../constants/Type";
import {toastHttpError} from "../../components/ToastHttpError";
import {I_PowerControl} from "../../constants/Interface";
import {fetchVMData} from "../../hook/Loader";
import ReactGA from "react-ga4";
import {useVMData} from "../../constants/VMDataContext";


/**
 * VMAction component
 *
 * This component handles the actions related to a virtual machine (VM), such as power control and extending time.
 * It uses various hooks to manage state, navigation, and side effects.
 *
 * Path: `/:id`
 */
const VMAction: React.FC = () => {
    const [vm_instance_data, setVMInstanceData] = useState<VMInstanceDataType | null>(null)
    const data = useVMData();
    const location = useLocation();
    const navigate = useNavigate();
    const revalidator = useRevalidator()
    const [show, setShow] = useState(true);
    const {statusUpdateCallback} = useOutletContext<MenuContextType>()
    const [is_loading, setIsLoading] = useState<boolean>(false);

    // set vm_instance_data when data changes
    useEffect(() => {
        if (data === null) return;
        setVMInstanceData(data.data.find(v => v._id === location.pathname.split('/')[1]) || null)
    }, [data, data?.data, location.pathname]);

    // power action
    const powerAction = useCallback(async (power: boolean) => {
        if (vm_instance_data === null) return;

        // Google Analytics
        ReactGA.event('vm_power_action', {
            vm_name: vm_instance_data._name,
            vm_id: vm_instance_data._id,
            power: power ? "ON" : "OFF"
        })
        setIsLoading(true);

        try {
            const res = await fetch(API_URL + "/vpn/" + vm_instance_data._id, {
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
                if (res.status === 460) return toast.error(`節點只允許 ${vm_instance_data._readonly} 操作`)
                if (res.status === 461) return toast.error(`節點已經處於${vm_instance_data._isPowerOn ? '開機' : '關機'}狀態`)
                return toastHttpError(res.status)
            }
        } catch (e: any) {
            console.log(e)
            toastHttpError(e.status)
            setIsLoading(false);
            return
        }

        statusUpdateCallback(power, vm_instance_data._id)
    }, [vm_instance_data, statusUpdateCallback]);

    // extend time action
    const extendTime = useCallback(async () => {
        if (vm_instance_data === null) return;

        // Google Analytics
        ReactGA.event('vm_extend_time', {
            vm_name: vm_instance_data._name,
            vm_id: vm_instance_data._id,
        })

        try {
            const res = await fetch(API_URL + "/vpn/" + vm_instance_data._id, {
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

            // immediately update vm_instance_data._expired in UI
            const data: { data: VMInstanceDataType } = await res.json();
            setVMInstanceData((prev) => {
                if (prev === null) return prev;
                prev._expired = data.data._expired;
                return prev
            });

            revalidator.revalidate() // revalidate data, fetch new data from server to update gobal state
        } catch (e: any) {
            console.error(e)
            toastHttpError(e.status)
        }
    }, [vm_instance_data, revalidator])

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
        if (vm_instance_data === null) return;
        if (location.pathname === '/' + vm_instance_data._id) {
            document.title = vm_instance_data._name + " - Cocomine VPN"
            setShow(true)
        }
    }, [location, vm_instance_data]);

    // set is_loading when vm_instance_data._status changes
    useEffect(() => {
        if (vm_instance_data === null) return;
        setIsLoading(PROCESSING_STATUS_TEXT.includes(vm_instance_data._status))
    }, [vm_instance_data]);

    if (vm_instance_data === null) return null;
    return (
        <>
            {location.pathname === '/' + vm_instance_data._id &&
                <Modal show={show} centered onHide={() => navigate('..', {replace: true})}>
                    <Modal.Header closeButton>
                        <Modal.Title>你想? <small
                            style={{
                                color: "darkgray",
                                fontSize: "x-small"
                            }}>({vm_instance_data._name})</small></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="gx-5 gy-4">
                            <Col>
                                <PowerControl isPower={vm_instance_data._isPowerOn} action={powerAction}
                                              readonly={vm_instance_data._readonly} loading={is_loading}/>
                            </Col>
                            <Col className="border-start">
                                <Link to={location.pathname + '/profile'} className="chooseProfile_btn">
                                    <img src={tools} alt="Config file" className="w-100" draggable={false}/>
                                    <p className="text-center pt-2">下載設定檔</p>
                                </Link>
                            </Col>
                            {vm_instance_data._isPowerOn && <>
                                <ExtensionConnect data={vm_instance_data}/>
                                <MobileAppConnect data={vm_instance_data}/>
                            </>}
                            <ExtendTime expired={vm_instance_data._isPowerOn ? vm_instance_data._expired : null}
                                        onClick={extendTime}/>
                        </Row>
                    </Modal.Body>
                </Modal>
            }
            <Outlet context={{vmData: vm_instance_data}}/>
        </>
    );
}

/**
 * ExtensionConnect component for connecting to a browser extension.
 *
 * @param {Object} props - The component props.
 * @param {VMInstanceDataType} props.data - The VM data.
 *
 */
const ExtensionConnect: React.FC<{ data: VMInstanceDataType }> = ({data}) => {
    const [installed, setInstalled] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)
    const audio = useMemo(() => new Audio(require('../../assets/sounds/Jig 0.mp3')), []);

    // connect to extension
    const onClick = useCallback(() => {
        setLoading(true)

        // Google Analytics
        ReactGA.event('extension_connect', {
            vm_name: data._name,
            vm_id: data._id,
        })

        // show toast
        toast.promise(new Promise((resolve, reject) => {

            // onMessage event callback function
            function callback(e: MessageEvent<PostMessageData>) {
                if (e.source !== window) return;

                // receive connect response
                if ((e.data.type === 'Connect') && !e.data.ask) {
                    if (e.data.data.connected) {
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

        window.postMessage({type: 'Connect', ask: true, data: data}); // post message to extension for connect
    }, [data]);

    // check if extension is installed
    useEffect(() => {
        // callback function
        function callback(e: MessageEvent<PostMessageData>) {
            if (e.source !== window) {
                return;
            }

            // receive extension installed response
            if ((e.data.type === 'ExtensionInstalled') && !e.data.ask) {
                if (!(e.data.data.installed && data._profiles.some(p => p.type === "socks5"))) return;
                setInstalled(true)
            }

            // receive connect response
            if ((e.data.type === 'Connect') && !e.data.ask) {
                if (e.data.data.connected) {
                    audio.play();
                }
                setLoading(false)
            }
        }

        // add event listener
        window.addEventListener('message', callback);
        window.postMessage({type: 'ExtensionInstalled', ask: true});

        return () => window.removeEventListener('message', callback);
    }, [data, audio]);

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
 * @param {VMInstanceDataType} props.data - The VM data.
 *
 * @returns {JSX.Element | null} - The rendered component or null if the app is not installed.
 */
const MobileAppConnect: React.FC<{ data: VMInstanceDataType }> = ({data}) => {
    const [installed, setInstalled] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)

    // connect to extension
    const onClick = useCallback(() => {
        setLoading(true)
        window.postMessage({type: 'AppConnect', ask: true, data: data});
    }, [data]);

    // check if extension is installed
    useEffect(() => {
        // callback function
        function callback(e: MessageEvent<PostMessageData>) {
            if (e.source !== window) {
                return;
            }

            if ((e.data.type === 'MobileAppInstalled') && !e.data.ask) {
                if (!(e.data.data.installed && data._profiles.some(p => p.type === "SS"))) return;
                setInstalled(true)
            }

            if ((e.data.type === 'AppConnect') && !e.data.ask) {
                setLoading(false)
            }
        }

        // add event listener
        window.addEventListener('message', callback);
        window.postMessage({type: 'MobileAppInstalled', ask: true});

        return () => window.removeEventListener('message', callback);
    }, [data]);

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
 * @param {Function} props.onClick - The function to call when the extent time button is clicked
 */
const ExtendTime: React.FC<{ expired: string | null, onClick: () => Promise<any> }> = ({expired, onClick}) => {
    const [expect_offline_time_Interval, setExpect_offline_time_Interval] = useState<string | null>(null)
    const [enableExtend, setEnableExtend] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)
    const location = useLocation();

    const click = useCallback(() => {
        if (loading) return; //if already click
        setLoading(true);
        onClick().then()
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
            setLoading(false);

            return () => clearInterval(id)
        }
    }, [expired]);

    // check if hash is #extendTime
    useEffect(() => {
        if (location.hash === "#extendTime") {
            location.hash = ""
            click();
        }
    }, [click, location, location.hash]);

    if (expired === null) return null;
    return (
        <>
            <Col xs={12} className="text-center">
                <div className="border-top w-100"></div>
            </Col>
            <Col xs={12} className="text-center">
                <Placeholder animation="wave" as={'h3'}>
                    {expect_offline_time_Interval || <Placeholder xs={3} className={'rounded'}/>}
                </Placeholder>
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
const PowerControl: React.FC<I_PowerControl> = ({isPower, action, readonly, loading}) => {
    const timeout = useRef<NodeJS.Timeout | null>(null)

    // on mouse down start timeout for long press event
    const onMouseDown = useCallback(() => {
        timeout.current = setTimeout(() => {
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
 *  @deprecated Not used anymore
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
