// Variable to store the deferred prompt event for PWA installation
import React, {useEffect, useState} from "react";
import {Col, Row} from "react-bootstrap";
import {I_ExtensionInstalled_PostMessageData, I_PostMessageData} from "../constants/Interface";

/**
 * PWA install element for menu
 * @constructor
 */
const ExtensionInstallBanner: React.FC = () => {

    const [installed, setInstalled] = useState<boolean>(false); // check if extension is installed

    // check if extension is installed
    useEffect(() => {
        // callback function
        function callback(e: MessageEvent<I_PostMessageData>) {
            if (e.source !== window) {
                return;
            }

            if ((e.data.type === 'ExtensionInstalled') && !e.data.ask) {
                const data: I_ExtensionInstalled_PostMessageData = e.data
                if (!data.data.installed) return;
                setInstalled(true);
                console.log(e)
            }
        }

        // add event listener
        window.addEventListener('message', callback);
        window.postMessage({type: 'ExtensionInstalled', ask: true});

        return () => window.removeEventListener('message', callback);
    }, []);

    if (installed) return null
    return (
        <a href='https://chromewebstore.google.com/detail/cocomine-vpn-extension/cgmahkkfajhojihmidpkcmcdjmjniihk'
           target='_blank' rel='noopener noreferrer'
           className='link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2'>
            <div className="banner rounded p-2 px-3 border">
                <Row className="align-items-center align-content-center">
                    <Col xs="auto">
                        <img src={require('../assets/images/webp/icon with extension.webp')} alt="安裝瀏覽器擴充"
                             style={{height: "6rem"}}
                             className="pe-2"/>
                    </Col>
                    <Col style={{minWidth: "20rem"}}>
                        <h5 className="fw-bold text-info align-bottom">
                            安裝瀏覽器擴充<span
                            className="badge rounded-pill text-bg-primary ms-2 small">立即安裝!</span>
                        </h5>
                        <p className="m-0 text-white">在公用電腦上不方便安裝軟件? 嘗試使用瀏覽器擴充無需授權直接在瀏覽器中使用!
                            一鍵連線更加方便!</p>
                    </Col>
                </Row>
            </div>
        </a>
    )
}

export default ExtensionInstallBanner;