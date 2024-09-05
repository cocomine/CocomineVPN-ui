// Variable to store the deferred prompt event for PWA installation
import React, {useCallback} from "react";
import {Col, Row} from "react-bootstrap";

let deferredPrompt: any;
// Event listener for the 'beforeinstallprompt' event
// This event is fired when the browser detects that the web app can be installed
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e;
});

/**
 * PWA install element for menu
 * @constructor
 */
const PWAInstallBanner: React.FC = () => {
    const installPWA = useCallback(async () => {
        deferredPrompt.prompt();
    }, []);

    if (!deferredPrompt || isPwa()) return null
    return (
        <>
            <div className="banner rounded p-2 px-3 border" onClick={installPWA}>
                <Row className="align-items-center align-content-center">
                    <Col xs="auto">
                        <img src={require('../assets/images/webp/devcie.webp')} alt="將網頁安裝為APP"
                             style={{height: "6rem"}}
                             className="pe-2"/>
                    </Col>
                    <Col style={{minWidth: "20rem"}}>
                        <h5 className="fw-bold text-info align-bottom">
                            將網頁安裝為APP<span className="badge rounded-pill text-bg-primary ms-2">立即安裝!</span>
                        </h5>
                        <p className="m-0">將網頁安裝為APP到您的裝置上。獲得原生應用程式的體驗，更快捷的訪問，無須再打開瀏覽器。</p>
                    </Col>
                </Row>
            </div>
        </>
    )
}

/**
 * Check if the web app is running as a PWA.
 * @returns {boolean} True if the web app is running as a PWA, false otherwise.
 */
function isPwa(): boolean {
    return ["fullscreen", "standalone", "minimal-ui"].some(
        (displayMode) => window.matchMedia('(display-mode: ' + displayMode + ')').matches
    );
}

export default PWAInstallBanner;