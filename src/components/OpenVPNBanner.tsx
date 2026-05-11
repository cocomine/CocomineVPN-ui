import React from "react";
import {Badge, Col, Row} from "react-bootstrap";

/**
 * Announcement Banner element for menu
 * @constructor
 */
const OpenVPNBanner: React.FC = () => {
    return (
        <a href={"https://netbird.cocomine.cc/"} target={"_blank"} rel="noreferrer"
           className={"link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2"}>
            <div className="banner rounded p-3 border">
                <Row className="align-items-center align-content-center">
                    <Col xs="auto">
                        <img src={require("../assets/images/webp/OpenVPNBanner.webp")}
                             alt="OpenVPN 停止服務，請盡快遷移至 NetBird"
                             style={{height: "6rem"}}/>
                    </Col>
                    <Col className={"mt-3 mt-md-0"} xs={12} md={true}>
                        <div className="fw-bold text-info align-bottom fs-5 mb-3">
                            <span>OpenVPN 停止服務</span>
                            <Badge bg={"danger"} pill className="ms-2">立即遷移!</Badge>
                        </div>
                        <p className={"text-white"}>
                            由於 NetBird 已可取代原有 OpenVPN 服務，並提供更簡單、自動化及跨平台的 VPN 連線體驗，
                            OpenVPN 服務將於 <span className={"text-warning fw-bold"}>2026 年 6 月 30 日</span> 正式停止。
                        </p>
                        <p className={"text-white"}>為避免影響使用，請用戶於截止日期前盡快遷移至 NetBird。NetBird 支援
                            WireGuard 高速加密連線、
                            自動設定、P2P 連線及 NAT 穿透，並可於 Linux、macOS、Windows、iOS 及 Android 使用。</p>
                    </Col>
                </Row>
            </div>
        </a>
    );
};

export default OpenVPNBanner;