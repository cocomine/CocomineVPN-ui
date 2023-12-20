import React, {useEffect, useState} from 'react';
import {Button, Col, Modal, Row} from "react-bootstrap";
import {isRouteErrorResponse, Navigate, useLoaderData, useNavigate, useParams, useRouteError} from "react-router-dom";
import {VMData} from "./Menu";
import {API_URL} from "./App";
import {toast} from "react-toastify";

const Action: React.FC = () => {
    const {VMData} = useLoaderData() as {VMData: VMData};
    const navigate = useNavigate();
    const [show, setShow] = useState(true);

    useEffect(() => {
        if(show) return

        const id = setTimeout(() => navigate("/"), 200);
        return () => clearTimeout(id);
    }, [show]);

    return (
        <>
            <Modal show={show} centered onHide={() => setShow(false)} data-bs-theme="dark">
                <Modal.Header closeButton>
                    <Modal.Title>{VMData._name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h6>你想?</h6>
                    <Row>
                        <Col>
                            <PowerControl isPower={VMData._isPowerOn} action={(action) => {} } />
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

const PowerControl: React.FC<{isPower: boolean, action: (power: boolean) => void}> = ({isPower, action}) => {

    if(isPower) {
        return (
            <Button onClick={() => action(true)} variant="link" className="w-100">
                <div className="powerBtn start"></div>
                <p className="text-center">關閉節點</p>
            </Button>
        );
    }

    return (
        <Button onClick={() => action(true)} variant="link" className="w-100">
            <p className="text-center">啟動節點</p>
        </Button>
    );
}

// @ts-ignore
const loader = async ({params}) => {
    try {
        const VMData = await fetchVMData(params.id);
        console.log(VMData)
        return {VMData: VMData.data}
    }catch (e: any) {
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
    const res = await fetch(API_URL + "/vpn/"+vm_id, {
        method: "GET",
        credentials: "include",
        signal: abortController.signal
    });
    if(!res.ok) throw res;
    return await res.json();
}

const ErrorElement: React.FC = () => {
    return (<Navigate to="/" replace={true} />);
}

export {Action, loader, fetchVMData, ErrorElement};