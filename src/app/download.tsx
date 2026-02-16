import React, {useCallback, useEffect, useState} from "react";
import {Col, Container, Modal, Row} from "react-bootstrap";
import {BlockerFunction, useBlocker, useLocation, useNavigate} from "react-router-dom";
import SingBoxSVG from "../assets/images/svg/Sing-box.svg";

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
    const navigate = useNavigate();

    const shouldBlock = useCallback<BlockerFunction>(({currentLocation}) => {
        if (currentLocation.pathname === '/download') {
            setShow(false);
            return true;
        }
        return false;
    }, []);
    let blocker = useBlocker(shouldBlock);

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
                <Modal show={show} fullscreen={'sm-down'} centered onHide={() => navigate('..', {replace: true})}
                       size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>下載程式</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Container>
                            <Row className={"gy-5 gx-4 justify-content-center"}>
                            <Col lg={2} md={3} xs={4}>
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
                            <Col lg={2} md={3} xs={4}>
                                <a href={'https://openvpn.net/client/'} target={'_blank'}
                                   rel="noreferrer noopener"
                                   className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover">
                                    <img src={require("../assets/images/webp/openvpn.webp")} alt="OpenVPN"
                                         className="rounded-4 profileImg"
                                         draggable={false}/>
                                    <p className="text-center pt-2">OpenVPN</p>
                                </a>
                            </Col>
                            <Col lg={2} md={3} xs={4}>
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
                                <Col lg={2} md={3} xs={4}>
                                    <a href={'https://github.com/2dust/v2rayN/releases'}
                                       target={'_blank'}
                                       rel="noreferrer noopener"
                                       className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
                                        <img src={require("../assets/images/webp/v2rayn.webp")} alt="V2rayN"
                                             className="rounded-4 profileImg"
                                             draggable={false}/>
                                        <p className="text-center pt-2">V2rayN</p>
                                    </a>
                                </Col>
                                <Col lg={2} md={3} xs={4}>
                                    <a href={'https://play.google.com/store/apps/details?id=io.nekohasekai.sfa'}
                                       target={'_blank'}
                                       rel="noreferrer noopener"
                                       className="chooseProfile_btn link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
                                        <img src={SingBoxSVG} alt="Sing-box"
                                             className="rounded-4 profileImg"
                                             draggable={false}/>
                                        <p className="text-center pt-2">Sing-box</p>
                                    </a>
                                </Col>
                                <Col lg={2} md={3} xs={4}>
                                    <a href={'https://apps.apple.com/us/app/shadowrocket/id932747118'}
                                       target={'_blank'}
                                       rel="noreferrer noopener"
                                       className="chooseProfile_btn link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
                                        <img src={require("../assets/images/webp/shadowrocket.webp")} alt="Shadowrocket"
                                             className="rounded-4 profileImg"
                                             draggable={false}/>
                                        <p className="text-center pt-2">Shadowrocket</p>
                                    </a>
                                </Col>
                                <Col lg={2} md={3} xs={4}>
                                    <a href={'https://play.google.com/store/apps/details?id=io.nekohasekai.sfa'}
                                       target={'_blank'}
                                       rel="noreferrer noopener"
                                       className="chooseProfile_btn link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
                                        <img src={require("../assets/images/webp/teaching.webp")} alt="Shadowrocket"
                                             className="rounded-4 profileImg"
                                             draggable={false}/>
                                        <p className="text-center pt-2">翻墻軟件教學</p>
                                    </a>
                                </Col>
                        </Row>
                        </Container>
                    </Modal.Body>
                </Modal>
            }
        </>
    );
}

export default Download;
