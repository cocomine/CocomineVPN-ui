// Variable to store the deferred prompt event for PWA installation
import React, {useEffect, useState} from "react";
import {Badge, Col, Row} from "react-bootstrap";
import {PostMessageData} from "../constants/Type";


/**
 * PWA install element for menu
 * @constructor
 */
const AppInstallBanner: React.FC = () => {

    const [installed, setInstalled] = useState<boolean>(false); // check if extension is installed

    // check if extension is installed
    useEffect(() => {
        // callback function
        function callback(e: MessageEvent<PostMessageData>) {
            if (e.source !== window) {
                return;
            }

            if ((e.data.type === 'MobileAppInstalled') && !e.data.ask) {
                if (!e.data.data.installed) return;
                setInstalled(true);
            }
        }

        // add event listener
        window.addEventListener('message', callback);
        window.postMessage({type: 'MobileAppInstalled', ask: true});

        return () => window.removeEventListener('message', callback);
    }, []);

    if (installed) return null;
    return (
        <a href="https://play.google.com/store" target={'_blank'} rel={'noreferrer'}
           className="link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
            <div className="banner rounded p-3 border">
                <Row className="align-items-center align-content-center">
                    <Col xs="auto">
                        <img
                            src={require('../assets/images/webp/GetItOnGooglePlay_Badge_Web_color_Chinese-TW.webp')}
                            alt={'Git it on Google Play!'}
                        />
                    </Col>
                    <Col style={{minWidth: "20rem"}} className={'mt-3 mt-md-0'}>
                        <h5 className="fw-bold text-info">
                            下載手機應用程式
                            <Badge pill bg={'primary'} className="ms-2">立即下載!</Badge>
                        </h5>
                        <p className="m-0 text-white">
                            想喺手機上面使用VPN? 現有嘅方法操作太過繁瑣? 立即嘗試手機程式啦!
                            一鍵連線省卻繁鎖操作! 並且使用世界上最熱門的VPN協議, 安全可靠!
                        </p>
                    </Col>
                </Row>
            </div>
        </a>
    );
};

export default AppInstallBanner;