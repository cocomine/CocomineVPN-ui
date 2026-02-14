import React, {useEffect, useState} from "react";
import {Badge, Col, Row} from "react-bootstrap";
import {PostMessageData} from "../constants/Type";
import {API_URL} from "../constants/GlobalVariable";
import {useTurnstile} from "../hook/Turnstile";

/**
 * Extension install element for menu
 * @constructor
 */
const ExtensionInstallBanner: React.FC = () => {
    const execute = useTurnstile();
    const [installed, setInstalled] = useState<boolean>(false); // check if extension is installed

    // check if extension is installed
    useEffect(() => {
        // callback function
        function callback(e: MessageEvent<PostMessageData>) {
            if (e.source !== window) {
                return;
            }

            // check for extension installed message
            if ((e.data.type === 'ExtensionInstalled' || e.data.type === 'MobileAppInstalled') && !e.data.ask) {
                if (!e.data.data.installed) return;
                setInstalled(true);

                window.postMessage({type: 'RetrieveTrackedUsage', ask: true}); // retrieve tracked usage after extension/mobile app is installed
            }

            // silently retrieve tracked VPN usage from extension/mobile app
            if (e.data.type === 'RetrieveTrackedUsage' && !e.data.ask) {
                let data = e.data.data ?? [];

                //merge with stored retry data if exists
                const storedRetry = window.localStorage.getItem('trackedUsageRetry');
                if (storedRetry) {
                    // merge arrays, if parsing fails, clear the stored data
                    try {
                        const parsedRetry = JSON.parse(storedRetry);
                        if (Array.isArray(parsedRetry)) {
                            data.push(...parsedRetry);
                        } else {
                            console.warn('Invalid format for trackedUsageRetry in localStorage, clearing it.');
                            window.localStorage.removeItem('trackedUsageRetry');
                        }
                    } catch (err) {
                        console.warn('Failed to parse trackedUsageRetry from localStorage, clearing it.', err);
                        window.localStorage.removeItem('trackedUsageRetry');
                    }
                }

                if (data.length <= 0) return; //nothing to send
                window.localStorage.setItem('trackedUsageRetry', JSON.stringify(data)); //store data for retry if needed

                //send to backend endpoint
                const sendToBackend = async (retryCount = 0) => {
                    console.debug(data);
                    try {
                        const res = await fetch(API_URL + '/vpn/track', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify(data)
                        });

                        if (!res.ok) {
                            // CF turnstile verification on failure
                            if (res.status === 403 && res.headers.has('cf-mitigated') && res.headers.get('cf-mitigated') === 'challenge' && retryCount < 5) {
                                console.warn('Cloudflare turnstile challenge detected, executing turnstile verification before retrying...');
                                await execute();
                                await sendToBackend(++retryCount); //retry after turnstile
                                return;
                            }
                            throw new Error(`Backend responded with status ${res.status}`);
                        } else {
                            console.log('Tracked usage data sent to backend successfully!');
                            window.localStorage.removeItem('trackedUsageRetry'); //clear retry data
                        }
                    } catch (error) {
                        if (retryCount < 5) {
                            const delay = Math.pow(2, retryCount) * 1000; // exponential backoff
                            console.warn(`Error sending tracked usage data to backend, retrying in ${delay / 1000} seconds...`, error);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            await sendToBackend(++retryCount); // retry after delay
                        } else {
                            console.error('Error sending tracked usage data to backend, retry next time.', error);
                        }
                    }
                };

                sendToBackend();
            }
        }

        // add event listener
        window.addEventListener('message', callback);
        window.postMessage({type: 'ExtensionInstalled', ask: true});

        return () => window.removeEventListener('message', callback);
    }, [execute]);

    if (installed) return null;
    return (
        <a href="https://chromewebstore.google.com/detail/cocomine-vpn-extension/cgmahkkfajhojihmidpkcmcdjmjniihk"
           target="_blank" rel="noopener noreferrer"
           className="link-underline link-underline-opacity-0 link-underline-opacity-75-hover link-offset-2">
            <div className="banner rounded p-3 border">
                <Row className="align-items-center align-content-center">
                    <Col xs="auto">
                        <img src={require('../assets/images/webp/icon with extension.webp')} alt="安裝瀏覽器擴充"
                             style={{height: "6rem"}}/>
                    </Col>
                    <Col style={{minWidth: "20rem"}}>
                        <h5 className="fw-bold text-info">
                            安裝瀏覽器擴充
                            <Badge pill bg={'primary'} className="ms-2">立即安裝!</Badge>
                        </h5>
                        <p className="m-0 text-white">在公用電腦上不方便安裝軟件? 嘗試使用瀏覽器擴充無需授權直接在瀏覽器中使用!
                            一鍵連線更加方便!</p>
                    </Col>
                </Row>
            </div>
        </a>
    );
};

export default ExtensionInstallBanner;