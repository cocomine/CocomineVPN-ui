// Variable to store the deferred prompt event for PWA installation
import React, {useEffect, useState} from "react";
import {Col, Row} from "react-bootstrap";
import {I_ExtensionInstalled_PostMessageData, I_PostMessageData} from "../constants/Interface";
import {Link} from "react-router-dom";


/**
 * PWA install element for menu
 * @constructor
 */
const AppInstallBanner: React.FC = () => {

    const [installed, setInstalled] = useState<boolean>(false); // check if extension is installed

    // check if extension is installed
    useEffect(() => {
        // callback function
        function callback(e: MessageEvent<I_PostMessageData>) {
            if (e.source !== window) {
                return;
            }

            if ((e.data.type === 'MobileAppInstalled') && !e.data.ask) {
                const data: I_ExtensionInstalled_PostMessageData = e.data
                if (!data.data.installed) return;
                setInstalled(true);
            }
        }

        // add event listener
        window.addEventListener('message', callback);
        window.postMessage({type: 'MobileAppInstalled', ask: true});

        return () => window.removeEventListener('message', callback);
    }, []);

    if (installed) return null
    return (
        <Link to={'/download'}
              className='link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2'>
            <div className="banner rounded p-2 px-3 border">
                <Row className="align-items-center align-content-center gy-2">
                    <Col style={{minWidth: "20rem"}}>
                        <h5 className="fw-bold text-info align-bottom">
                            下載手機應用程式<span
                            className="badge rounded-pill text-bg-primary ms-2 small">立即下載!</span>
                        </h5>
                        <p className="m-0 text-white">想喺手機上面使用VPN? 現有嘅方法操作太過繁瑣? 立即嘗試手機程式啦!
                            一鍵連線省卻繁鎖操作! 並且使用世界上最熱門的VPN協議, 安全可靠!</p>
                    </Col>
                    <Col>
                        <a href={'.'} target={'_blank'} rel={'noopener noreferrer'}>
                            <img
                                src={require('../assets/images/webp/GetItOnGooglePlay_Badge_Web_color_Chinese-TW.webp')}
                                alt={'Git it on Google Play!'}/>
                        </a>
                    </Col>
                </Row>
            </div>
        </Link>
    )
}

export default AppInstallBanner;