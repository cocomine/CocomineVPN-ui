import React, {useEffect, useState} from "react";
import {Col, Modal, Row} from "react-bootstrap";
import {useBlocker, useLocation, useNavigate} from "react-router-dom";

const Download = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [show, setShow] = useState(true);

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
        if (location.pathname === '/download') {
            document.title = "下載程式 - VPN Manager"
            setShow(true)
        }
    }, [location]);

    return (
        <>
            {location.pathname === '/download' &&
                <Modal show={show} centered onHide={() => navigate("..")}>
                    <Modal.Header closeButton>
                        <Modal.Title>下載程式</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className={"g-5 justify-content-center"}>
                            <Col xl={4} lg={5} md={6} sm={7} xs={8}>
                                <a href={'https://www.softether-download.com/cn.aspx?product=softether'}
                                   target={'_blank'}
                                   rel="noreferrer noopener" className="chooseProfile_btn position-relative">
                                    <img src={require("./assets/softether.webp")} alt="SoftEther"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">SoftEther</p>
                                </a>
                            </Col>
                            <Col xl={4} lg={5} md={6} sm={7} xs={8}>
                                <a href={'https://openvpn.net/client/'} target={'_blank'}
                                   rel="noreferrer noopener" className="chooseProfile_btn position-relative">
                                    <img src={require("./assets/openvpn.webp")} alt="OpenVPN"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">OpenVPN</p>
                                </a>
                            </Col>
                            <Col xl={4} lg={5} md={6} sm={7} xs={8}>
                                <a href={'https://github.com/shadowsocks/shadowsocks-windows/releases'}
                                   target={'_blank'}
                                   rel="noreferrer noopener" className="chooseProfile_btn position-relative">
                                    <img src={require("./assets/SS windows.webp")} alt="ShadowSocks (Windows)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (Windows)</p>
                                </a>
                            </Col>
                            <Col xl={4} lg={5} md={6} sm={7} xs={8}>
                                <a href={'https://play.google.com/store/apps/details?id=com.github.shadowsocks'}
                                   target={'_blank'}
                                   rel="noreferrer noopener" className="chooseProfile_btn position-relative">
                                    <img src={require("./assets/SS Android.webp")} alt="ShadowSocks (Android)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (Android)</p>
                                </a>
                            </Col>
                            <Col xl={4} lg={5} md={6} sm={7} xs={8}>
                                <a href={'https://play.google.com/store/apps/details?id=com.github.shadowsocks.tv'}
                                   target={'_blank'}
                                   rel="noreferrer noopener" className="chooseProfile_btn position-relative">
                                    <img src={require("./assets/SS Androidtv.webp")} alt="ShadowSocks (Android TV)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (Android TV)</p>
                                </a>
                            </Col>
                            <Col xl={4} lg={5} md={6} sm={7} xs={8}>
                                <a href={'https://github.com/shadowsocks/ShadowsocksX-NG/releases/'} target={'_blank'}
                                   rel="noreferrer noopener" className="chooseProfile_btn position-relative">
                                    <img src={require("./assets/SS mac.webp")} alt="ShadowSocks (MacOS)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (MacOS)</p>
                                </a>
                            </Col>
                            <Col xl={4} lg={5} md={6} sm={7} xs={8}>
                                <a href={'https://apps.apple.com/us/app/shadowrocket/id932747118'} target={'_blank'}
                                   rel="noreferrer noopener" className="chooseProfile_btn position-relative">
                                    <img src={require("./assets/SS ios.webp")} alt="ShadowSocks (ios)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (ios)</p>
                                </a>
                            </Col>
                        </Row>
                    </Modal.Body>
                </Modal>
            }
        </>
    );
}

export {Download};