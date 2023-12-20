import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import {Button, Col, Modal, Ratio, Row} from "react-bootstrap";
import {
    Navigate,
    useBeforeUnload,
    useLoaderData,
    useNavigate,
    useBlocker,
    useOutletContext,
    Outlet, useLocation, Link
} from "react-router-dom";
import {VMData} from "./Menu";
import {API_URL, ContextType, toastHttpError} from "./App";
import {toast} from "react-toastify";
import power from "./assets/power.svg";
import tools from "./assets/tools.svg";

const Action: React.FC = () => {
    const {VMData} = useLoaderData() as { VMData: VMData };
    const navigate = useNavigate();
    const location = useLocation();
    const [show, setShow] = useState(true);
    const {statusUpdateCallback} = useOutletContext<ContextType>()

    // power action
    const powerAction = useCallback(async (power: boolean) => {
        try {
            const res = await fetch(API_URL + "/vpn/" + VMData._id, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    target_state: power ? "START" : "STOP"
                })
            })
            if (!res.ok) throw res
        } catch (e: any) {
            if (e.status === 460) return toast.error(`節點只允許 ${VMData._readonly} 操作`)
            if (e.status === 461) return toast.error(`節點已經處於${VMData._isPowerOn ? '開機' : '關機'}狀態`)
            toastHttpError(e.status)
            return
        } finally {
            navigate("..") // redirect to home page
        }

        // update status until status changed or try count > 10 times
        const promise = new Promise<VMData>((resolve, reject) => {
            let tryCount = 0
            setInterval(async () => {
                let data
                try {
                    const res = await fetchVMData(VMData._id)
                    data = res.data as VMData
                } catch (e) {
                    return reject(e)
                }

                if (data._isPowerOn === power) {
                    return resolve(data)
                }
                if (tryCount > 10) {
                    return reject(data)
                }
                tryCount++
                console.debug("tryCount: " + tryCount) //debug
            }, 10000)
        });
        statusUpdateCallback(promise, power)
    }, []);

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
        console.log(location) //debug
        if (location.pathname === '/' + VMData._id) {
            document.title = VMData._name + " - VPN Manager"
            setShow(true)
        }
    }, [location]);

    return (
        <>
            {location.pathname === '/' + VMData._id &&
                <Modal show={show} centered onHide={() => navigate("..")} data-bs-theme="dark">
                    <Modal.Header closeButton>
                        <Modal.Title>你想? <small
                            style={{color: "darkgray", fontSize: "x-small"}}>({VMData._name})</small></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-5">
                            <Col>
                                <PowerControl isPower={VMData._isPowerOn} action={powerAction}/>
                            </Col>
                            <Col className="border-start">
                                <Link to={`${location.pathname}/profile`}>
                                    <img src={tools} alt="Config file" className="w-100"/>
                                    <p className="text-center pt-2">下載設定檔</p>
                                </Link>
                            </Col>
                        </Row>
                    </Modal.Body>
                </Modal>
            }
            <Outlet context={{VMData}}/>
        </>
    );
}

const PowerControl: React.FC<{ isPower: boolean, action: (power: boolean) => void }> = ({isPower, action}) => {
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
                            onTouchStart={onMouseDown} onTouchEnd={onMouseUp} disabled={loading}>
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
                        onTouchStart={onMouseDown} onTouchEnd={onMouseUp} disabled={loading}>
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

const ChooseProfile: React.FC = () => {
    const navigate = useNavigate();
    const [show, setShow] = useState(true);
    const {VMData} = useOutletContext<{ VMData: VMData }>()

    useEffect(() => {
        document.title = VMData._name + " Profile - VPN Manager"
        console.log(VMData) //debug
    }, []);

    return (
        <>
            <Modal show={show} centered onHide={() => navigate("..")} data-bs-theme="dark">
                <Modal.Header closeButton>
                    <Modal.Title>下載設定檔 <small
                        style={{color: "darkgray", fontSize: "x-small"}}>({VMData._name})</small></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col>
                            <p className="text-center">下載設定檔1</p>
                        </Col>
                        <Col className="border-start">
                            <p className="text-center">下載設定檔2</p>
                        </Col>
                    </Row>
                </Modal.Body>
            </Modal>
        </>
    );
};

// @ts-ignore
const loader = async ({params}) => {
    try {
        const VMData = await fetchVMData(params.id);
        console.debug(VMData)
        return {VMData: VMData.data}
    } catch (e: any) {
        toastHttpError(e.status)
        throw e
    }
}

/**
 * Fetch VM data from API
 * @param vm_id VM id
 * @param abortController AbortController
 */
const fetchVMData = async (vm_id: string, abortController: AbortController = new AbortController()) => {
    const res = await fetch(API_URL + "/vpn/" + vm_id, {
        method: "GET",
        credentials: "include",
        signal: abortController.signal
    });
    if (!res.ok) throw res;
    return await res.json();
}

const ErrorElement: React.FC = () => {
    return (<Navigate to=".." replace={true} relative="path"/>);
}

export {Action, loader, fetchVMData, ErrorElement, ChooseProfile};