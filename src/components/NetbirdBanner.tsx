import React from "react";
import {Badge, Col, Row} from "react-bootstrap";

/**
 * Announcement Banner element for menu
 * @constructor
 */
const NetBirdBanner: React.FC = () => {
    return (
        <a href={"https://netbird.cocomine.cc/"} target={"_blank"} rel="noreferrer"
           className={'link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2'}>
            <div className="banner rounded p-3 border">
                <Row className="align-items-center align-content-center">
                    <Col xs="auto">
                        <img src={require("../assets/images/webp/netbird_2.webp")} alt="立即使用Netbird"
                             style={{height: "6rem"}}/>
                    </Col>
                    <Col className={'mt-3 mt-md-0'} xs={12} md={true}>
                        <div className="fw-bold text-info align-bottom fs-5 mb-3">
                            <span>NetBird VPN 正式推出</span>
                            <Badge bg={"success"} pill className="ms-2">立即使用!</Badge>
                        </div>
                        <p className={'text-white'}>
                            為提升 VPN 服務的穩定性、安全性及使用便利度，我們現已升級採用 NetBird VPN 架構。
                        </p>
                        <p className={"text-white"}>NetBird 採用先進 WireGuard 技術，支援自動設定、私人 P2P 連線及 NAT
                            穿透，省卻傳統 VPN 複雜的手動設定步驟。
                            用戶可在 Linux、macOS、Windows、iOS、Android 等平台使用，體驗類似 Surfshark /
                            NordVPN，連線更簡單、更快速、更安全。</p>
                        <Badge bg={"primary"} pill className={"fs-6"}>點擊現在立即使用</Badge>
                    </Col>
                </Row>
            </div>
        </a>
    );
};

export default NetBirdBanner;