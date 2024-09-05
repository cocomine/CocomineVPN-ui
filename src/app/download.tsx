import React, {useEffect, useState} from "react";
import {Col, Modal, Row} from "react-bootstrap";
import {useBlocker, useLocation} from "react-router-dom";

/**
 * Download component
 *
 * This component renders a modal for downloading various VPN clients.
 * It blocks navigation when the modal is open and redirects to the home page after the modal close animation.
 * It also sets the document title based on the current location.
 *
 * Path: /download
 *
 * @returns {JSX.Element} The rendered component
 */
const Download = () => {
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
            document.title = "下載程式 - Cocomine VPN"
            setShow(true)
        }
    }, [location]);

    return (
        <>
            {location.pathname === '/download' &&
                <Modal show={show} centered onHide={() => window.history.back()} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>下載程式</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className={"g-5 justify-content-center"}>
                            <Col xl={2} lg={3} md={4} sm={5} xs={6}>
                                <a href={'https://www.softether-download.com/cn.aspx?product=softether'}
                                   target={'_blank'}
                                   rel="noreferrer noopener"
                                   className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover">
                                    <img src={require("../assets/images/webp/softether.webp")} alt="SoftEther"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">SoftEther</p>
                                </a>
                            </Col>
                            <Col xl={2} lg={3} md={4} sm={5} xs={6}>
                                <a href={'https://openvpn.net/client/'} target={'_blank'}
                                   rel="noreferrer noopener"
                                   className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover">
                                    <img src={require("../assets/images/webp/openvpn.webp")} alt="OpenVPN"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">OpenVPN</p>
                                </a>
                            </Col>
                            <Col xl={2} lg={3} md={4} sm={5} xs={6}>
                                <a href={'https://github.com/shadowsocks/shadowsocks-windows/releases'}
                                   target={'_blank'}
                                   rel="noreferrer noopener"
                                   className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover">
                                    <img src={require("../assets/images/webp/SS windows.webp")}
                                         alt="ShadowSocks (Windows)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (Windows)</p>
                                </a>
                            </Col>
                            <Col xl={2} lg={3} md={4} sm={5} xs={6}>
                                <a href={'https://play.google.com/store/apps/details?id=com.github.shadowsocks'}
                                   target={'_blank'}
                                   rel="noreferrer noopener"
                                   className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover">
                                    <img src={require("../assets/images/webp/SS Android.webp")}
                                         alt="ShadowSocks (Android)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (Android)</p>
                                </a>
                            </Col>
                            <Col xl={2} lg={3} md={4} sm={5} xs={6}>
                                <a href={'https://play.google.com/store/apps/details?id=com.github.shadowsocks.tv'}
                                   target={'_blank'}
                                   rel="noreferrer noopener"
                                   className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
                                    <img src={require("../assets/images/webp/SS Androidtv.webp")}
                                         alt="ShadowSocks (Android TV)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (Android TV)</p>
                                </a>
                            </Col>
                            <Col xl={2} lg={3} md={4} sm={5} xs={6}>
                                <a href={'https://github.com/shadowsocks/ShadowsocksX-NG/releases/'} target={'_blank'}
                                   rel="noreferrer noopener"
                                   className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
                                    <img src={require("../assets/images/webp/SS mac.webp")} alt="ShadowSocks (MacOS)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (MacOS)</p>
                                </a>
                            </Col>
                            <Col xl={2} lg={3} md={4} sm={5} xs={6}>
                                <a href={'https://apps.apple.com/us/app/shadowrocket/id932747118'} target={'_blank'}
                                   rel="noreferrer noopener"
                                   className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
                                    <img src={require("../assets/images/webp/SS ios.webp")} alt="ShadowSocks (ios)"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">ShadowSocks (ios)</p>
                                </a>
                            </Col>
                            <Col xl={2} lg={3} md={4} sm={5} xs={6}>
                                <a href={'https://chromewebstore.google.com/detail/cocomine-vpn-extension/cgmahkkfajhojihmidpkcmcdjmjniihk'}
                                   target={'_blank'}
                                   rel="noreferrer noopener"
                                   className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
                                    <img src={require("../assets/images/webp/icon with extension.webp")} alt="Extension"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">瀏覽器擴充</p>
                                </a>
                            </Col>
                        </Row>
                    </Modal.Body>
                </Modal>
            }
        </>
    );
}

export default Download;