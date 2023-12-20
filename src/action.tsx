import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Col, Modal, Ratio, Row} from "react-bootstrap";
import {Navigate, useLoaderData, useNavigate} from "react-router-dom";
import {VMData} from "./Menu";
import {API_URL} from "./App";
import {toast} from "react-toastify";
import power from "./assets/power.svg";

const Action: React.FC = () => {
    const {VMData} = useLoaderData() as { VMData: VMData };
    const navigate = useNavigate();
    const [show, setShow] = useState(true);

    useEffect(() => {
        if (show) return

        const id = setTimeout(() => navigate("/"), 200);
        return () => clearTimeout(id);
    }, [show]);

    return (
        <>
            <Modal show={show} centered onHide={() => setShow(false)} data-bs-theme="dark">
                <Modal.Header closeButton>
                    <Modal.Title>你想? <small style={{color: "darkgray", fontSize: "x-small"}}>({VMData._name})</small></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h6>你想?</h6>
                    <Row>
                        <Col>
                            <PowerControl isPower={VMData._isPowerOn} action={(action) => { console.log(action)
                            }}/>
                        </Col>
                        <Col className="border-start">
                            <p className="text-center">下載設定檔</p>
                        </Col>
                    </Row>
                </Modal.Body>
            </Modal>

        </>
    );
}

const PowerControl: React.FC<{ isPower: boolean, action: (power: boolean) => void }> = ({isPower, action}) => {
    const timeout = useRef<NodeJS.Timeout|null>(null)
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
    },[]);

    if (isPower) {
        return (
            <>
                <Ratio aspectRatio="1x1" className="">
                    <Button variant="danger" className="powerBtn" onMouseDown={onMouseDown} onMouseUp={onMouseUp} onTouchStart={onMouseDown} onTouchEnd={onMouseUp} disabled={loading}>
                        <img src={power} alt="power icon" />
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
            <Ratio aspectRatio="1x1" className="">
                <Button variant="success" className="powerBtn" onMouseDown={onMouseDown} onMouseUp={onMouseUp} onTouchStart={onMouseDown} onTouchEnd={onMouseUp} disabled={loading}>
                    <img src={power} alt="power icon" />
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

// @ts-ignore
const loader = async ({params}) => {
    try {
        const VMData = await fetchVMData(params.id);
        console.log(VMData)
        return {VMData: VMData.data}
    } catch (e: any) {
        switch (e.status) {
            case 400:
                toast.error("你給的資料我不明白 你肯定沒有錯?",)
                break;
            case 404:
                toast.error("這裡不存在任何東西! 你確定去對地方了?", {containerId: 1})
                break;
            case 403:
                toast.error("你不可以看這個東西!")
                break;
            case 401:
                toast.error("我不知道你是誰 你能告訴我嗎!")
                break;
            case 500:
                toast.error("我出現問題了! 稍後再試一試")
                break;
            case 504:
                toast.error("網絡出現問題! 檢查一下")
                break;
            case 502:
                toast.error("太多人了! 稍後再試一試")
                break;
            default:
                toast.error("出事啦! 發生了一些不能遇見的錯誤! 不如再試一試?")
        }
        throw e
    }
}

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
    return (<Navigate to="/" replace={true}/>);
}

export {Action, loader, fetchVMData, ErrorElement};