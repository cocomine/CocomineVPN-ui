import React, {useEffect, useState} from "react";
import {Col, Row} from "react-bootstrap";
import {PostMessageData} from "../constants/Type";
import {API_URL} from "../constants/GlobalVariable";
import {useTurnstile} from "../hook/Turnstile";

/**
 * Extension install element for menu
 * @constructor
 */
const ExtensionInstallBanner: React.FC = () => {
    const execute = useTurnstile()
    const [installed, setInstalled] = useState<boolean>(false); // check if extension is installed

    // check if extension is installed
    useEffect(() => {
        // callback function
        async function callback(e: MessageEvent<PostMessageData>) {
            if (e.source !== window) {
                return;
            }

            // check for extension installed message
            if ((e.data.type === 'ExtensionInstalled' || e.data.type === 'MobileAppInstalled') && !e.data.ask) {
                if (!e.data.data.installed) return;
                setInstalled(true);

                window.postMessage({type: 'RetrieveTrackedUsage', ask: true}); // retrieve tracked usage after extension/mobile app is installed
            }

            //todo: silence retrieve tracked VPN usage from extension/mobile app
            if (e.data.type === 'RetrieveTrackedUsage' && !e.data.ask) {
                let data = e.data.data || []

                //merge with stored retry data if exists
                const storedRetry = window.localStorage.getItem('trackedUsageRetry');
                if (storedRetry) {
                    data.push(...JSON.parse(storedRetry))
                }

                //send to backend endpoint
                const sendToBackend = async () => {
                    console.debug(data)
                    try {
                        const res = await fetch(API_URL + '/vpn/track', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        })

                        if (!res.ok) {
                            // CF turnstile verification on failure
                            if (res.status === 403 && res.headers.has('cf-mitigated') && res.headers.get('cf-mitigated') === 'challenge') {
                                await execute()
                                return;
                            }
                            throw new Error(`Backend responded with status ${res.status}`);
                        } else {
                            console.log('Tracked usage data sent to backend successfully!');
                            window.localStorage.removeItem('trackedUsageRetry'); //clear retry data
                        }
                    } catch (error) {
                        console.error('Error sending tracked usage data to backend, retry next time.', error);
                        //save to localStorage for retry next time
                        window.localStorage.setItem('trackedUsageRetry', JSON.stringify(data));
                    }
                }

                await sendToBackend();
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
                    <Col xs="auto">
                        <h5 className="fw-bold text-info">
                            安裝瀏覽器擴充
                            <span className="badge rounded-pill text-bg-primary ms-2 small">立即安裝!</span>
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