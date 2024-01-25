import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Col, Modal, Ratio, Row} from "react-bootstrap";
import {Link, Navigate, Outlet, useBlocker, useLoaderData, useLocation, useOutletContext} from "react-router-dom";
import {VMData} from "./Menu";
import {API_URL, ContextType, toastHttpError} from "./App";
import {toast} from "react-toastify";
import power from "./assets/power.svg";
import tools from "./assets/tools.svg";
import Profile from "./Profile";

const Action: React.FC = () => {
    const {VMData} = useLoaderData() as { VMData: VMData };
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
            window.history.back() // redirect to home page
        }

        // update status until status changed or try count > 10 times
        const promise = new Promise<VMData>((resolve, reject) => {
            let tryCount = 0
            const id = setInterval(async () => {
                let data
                try {
                    const res = await fetchVMData(VMData._id, undefined, true)
                    data = res.data as VMData
                } catch (e) {
                    clearInterval(id)
                    return reject()
                }

                if (data._isPowerOn === power) {
                    clearInterval(id)
                    return resolve(data)
                }
                if (tryCount > 20) {
                    clearInterval(id)
                    return reject(data)
                }
                tryCount++
                console.debug("tryCount: " + tryCount) //debug
            }, 5000)
        });
        statusUpdateCallback(promise, power, VMData._id)
    }, [VMData, statusUpdateCallback]);

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
        if (location.pathname === '/' + VMData._id) {
            document.title = VMData._name + " - VPN Manager"
            setShow(true)
        }
    }, [location, VMData]);

    return (
        <>
            {location.pathname === '/' + VMData._id &&
                <Modal show={show} centered onHide={() => window.history.back()}>
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
                                <Link to={`${location.pathname}/profile`} className="chooseProfile_btn">
                                    <img src={tools} alt="Config file" className="w-100" draggable={false}/>
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
                        onTouchStart={onMouseDown} onTouchEnd={onMouseUp} disabled={loading}
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

const ChooseProfile: React.FC = () => {
    const [show, setShow] = useState(true);
    const {VMData} = useOutletContext<{ VMData: VMData }>()

    // set title
    useEffect(() => {
        document.title = VMData._name + " Profile - VPN Manager"
    }, [VMData]);

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

    return (
        <>
            <Modal show={show} centered onHide={() => window.history.back()} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>下載設定檔 <small style={{color: "darkgray", fontSize: "x-small"}}>
                        ({VMData._name})
                    </small></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className={"g-5 justify-content-center"}>
                        {VMData._profiles.map((profile) => <Profile key={profile.filename} profile={profile}
                                                                    vm_id={VMData._id}/>)}
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
 * @param patch update data or not
 */
const fetchVMData = async (vm_id: string, abortController: AbortController = new AbortController(), patch = false) => {
    const res = await fetch(API_URL + "/vpn/" + vm_id, {
        method: patch ? "PATCH" : "GET",
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