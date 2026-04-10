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
                        <img src={require('../assets/images/webp/AnnouncementBanner.webp')} alt="將網頁安裝為APP"
                             style={{height: "6rem"}}/>
                    </Col>
                    <Col className={'mt-3 mt-md-0'} xs={12} md={true}>
                        <div className="fw-bold text-info align-bottom fs-5 mb-3">
                            <span>中國大陸地區使用VPN指引</span>
                            <Badge bg={"danger"} pill className="ms-2">立即嘗試!</Badge>
                        </div>
                        <p className={'text-white'}>
                            於大陸地區使用請選用機場方式進行連接，該方式是針對於大陸防火牆而設計的。使用其他連接方式極大機率無法成功連接。
                        </p>
                        <p className={"text-white"}>建議出發前購入一張香港漫遊電話卡作為後備，亦可以加入本人微信隨時聯絡。</p>
                        <Badge bg={'primary'} pill className={'fs-6'}>點擊查看使用教學</Badge>
                    </Col>
                </Row>
            </div>
        </a>
    );
};

export default AnnouncementBanner;