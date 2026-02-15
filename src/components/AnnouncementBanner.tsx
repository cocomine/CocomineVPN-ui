import React from "react";
import {Badge, Col, Row} from "react-bootstrap";

/**
 * Announcement Banner element for menu
 * @constructor
 */
const AnnouncementBanner: React.FC = () => {
    return (
        <a href={'https://github.com/cocomine/CocomineVPN-ui/wiki'} target={"_blank"} rel="noreferrer"
           className={'link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2'}>
            <div className="banner rounded p-3 border">
                <Row className="align-items-center align-content-center">
                    <Col xs="auto">
                        <img src={'https://placehold.co/600x400'} alt="將網頁安裝為APP"
                             style={{height: "6rem"}}/>
                    </Col>
                    <Col style={{minWidth: "20rem"}} className={'mt-3 mt-md-0'}>
                        <h5 className="fw-bold text-info align-bottom">
                            舊版 shadowsocks 方法將停用
                            <Badge bg={'danger'} pill className="ms-2">立即更換!</Badge>
                        </h5>
                        <p className={'text-white'}>
                            隨著防火長城的持續更新，舊版 shadowsocks 方法已經無法穩定使用以及防火長城有效偵測。
                        </p>
                        <p className={'text-white'}>為了確保服務的穩定性和安全性，我們將在<b
                            className={'text-warning'}>2月28日</b>停用舊版 shadowsocks 方法
                            ，請盡快切換到新的連接方式以確保服務的持續使用。</p>
                        <Badge bg={'primary'} pill className={'fs-6'}>點擊查看使用教學</Badge>
                    </Col>
                </Row>
            </div>
        </a>
    );
};

export default AnnouncementBanner;