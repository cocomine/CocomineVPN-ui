import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Alert, Button, Col, Ratio, Row, Spinner} from "react-bootstrap";
import "./App.scss";
import moment from "moment";
import 'react-toastify/dist/ReactToastify.min.css';
import {Link, Outlet, useRevalidator} from "react-router-dom";
import us_flag from "../assets/us.svg";
import uk_flag from "../assets/uk.svg";
import hk_flag from "../assets/hk.svg";
import jp_flag from "../assets/jp.svg";
import tw_flag from "../assets/tw.svg";
import in_flag from "../assets/in.svg";
import moisture from "../assets/moisture.svg";
import download_svg from "../assets/download.svg";
import useWebSocket from "../hook/useWebSocks";
import {toast} from "react-toastify";
import {APP_VERSION} from "../constants/GlobalVariable";
import {I_StatusUpdateCallback, I_VMData_windowPostMessage} from "../constants/Interface";
import {
    AlertMemoType,
    ContextType,
    UserProfileType,
    VMDataType,
    WeatherAlertType,
    WeatherDataType,
    WebSocketDataType
} from "../constants/Type";
import {toastHttpError} from "../components/ToastHttpError";
import {fetchVPNData} from "../hook/Loader";

// VM processing status
const PROCESSING_STATUS_TEXT = [
    "PROVISIONING",
    "STAGING",
    "STOPPING",
    "SUSPENDING",
    "REPAIRING",
    "starting",
    "stopping",
    "creating",
    "deallocating"
]
const DANGER_WEATHER_ALERT: WeatherAlertType[] = ['TC8NE', 'TC8SW', 'TC8NW', 'TC8SE', 'TC9', 'TC10', 'WRAINB', 'WTMW']


// Variable to store the deferred prompt event for PWA installation
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
 * Menu component
 *
 * This component displays the main menu, including VM data, user profile, and weather data.
 * It handles fetching and updating VM data, managing websocket connections, and displaying status updates.
 *
 * Parent component: App@src/app/App.tsx
 *
 * @param {Object} props - The component props
 * @param {Object} props.data - The data object containing VM data, next update time, and last update time
 * @param {UserProfileType} props.userProfile - The user profile data
 * @param {WeatherDataType} props.weatherData - The weather data
 */
const Menu: React.FC<{
    data: { data: VMDataType[], next_update: string, last_update: string },
    userProfile: UserProfileType,
    weatherData: WeatherDataType
}> = ({data, userProfile, weatherData}) => {
    const websocket = useWebSocket();
    const [vm_data, setVMData] = useState<VMDataType[]>([]);
    const [nextUpdateInterval, setNextUpdateInterval] = useState("00:00");
    const [lastUpdate, setLastUpdate] = useState("00:00");
    const [nextUpdate, setNextUpdate] = useState(moment());
    const [wsDisconnected, setWsDisconnected] = useState(true);
    let revalidator = useRevalidator();

    // fetch data when data is changed
    useEffect(() => {
        setVMData(data.data);
        setNextUpdate(moment(data.next_update));
        setLastUpdate(moment(data.last_update).format("HH:mm"));
    }, [data]);

    // update timeInterval every second
    useEffect(() => {
        const abortController = new AbortController();

        const id = setInterval(async () => {
            const diff = nextUpdate.diff(moment())

            // update data if next update time is passed
            if (diff < 0) {
                let vpnData;
                try {
                    vpnData = await fetchVPNData(abortController);
                } catch (err: any) {
                    console.error(err)
                    if (err.name !== "AbortError") toastHttpError(err.status)
                    setNextUpdate(moment().add(10, "seconds")); // retry after 10 seconds
                    return;
                }

                setVMData(vpnData.data);
                setLastUpdate(moment(vpnData.last_update).format("HH:mm"));
                setNextUpdate(moment(vpnData.next_update));
                return;
            }

            setNextUpdateInterval(moment(diff).format("mm:ss"));
        }, 1000);

        return () => {
            clearInterval(id);
            abortController.abort();
        };
    }, [nextUpdate, vm_data]);

    // websocket event listener for updating VM data
    useEffect(() => {
        if (!websocket) return;
        setWsDisconnected(false);
        revalidator.revalidate();

        // event listener for websocket
        // update VM data when received message from websocket
        websocket.addEventListener('message', (event) => {
            const data: WebSocketDataType = JSON.parse(event.data)

            if (data.url === "/vpn/vm") {
                setVMData((prev) => {
                    const newVMData = [...prev]; // clone previous data
                    let index = newVMData.findIndex((vm: VMDataType) => vm._id === data.data._id);
                    newVMData[index] = data.data;
                    return newVMData;
                })
            }
        });

        // event listener for websocket close
        websocket.addEventListener('close', () => {
            setWsDisconnected(true);
        });

        // eslint-disable-next-line
    }, [websocket]);

    // post message to content script when vm_data is changed
    useEffect(() => {
        window.postMessage({
            type: 'PostVMData',
            ask: false,
            data: vm_data
        })
    }, [vm_data]);

    // audio element for playing sound when status changed
    const SuccessAudio = useMemo(() => new Audio(require("../assets/Bing.mp3")), []);
    const FailAudio = useMemo(() => new Audio(require("../assets/Error.mp3")), []);

    // status update callback function for child component to update status and show toast message when status changed successfully or failed to change status
    const statusUpdateCallback = useCallback<I_StatusUpdateCallback>(async (target, vm_id) => {
        // show toast message
        await toast.promise(new Promise((resolve, reject) => {

            // create event listener for message from window
            const callback = (event: MessageEvent<I_VMData_windowPostMessage>) => {
                if (event.data.type === "PostVMData" && !event.data.ask) {
                    const newVMData = event.data.data;
                    let index = newVMData.findIndex((vm: VMDataType) => vm._id === vm_id);

                    if (newVMData[index]._isPowerOn === target) {
                        SuccessAudio.play();
                        resolve("Success")
                        window.removeEventListener("message", callback); // remove event listener
                    }
                }
            }

            //receive message from window
            window.addEventListener("message", callback);

            // timeout for 60 seconds
            setTimeout(() => {
                FailAudio.play();
                reject("Timeout")
                window.removeEventListener("message", callback); // remove event listener
            }, 60 * 1000);

            }), {
                pending: `正在${target ? '開機' : '關機'}中...`,
                success: '節點已成功' + (target ? '開機' : '關機') + '!',
                error: '節點' + (target ? '開機' : '關機') + '失敗!',
            }
        ).catch((err) => {
            console.error(err)
        });
    }, [SuccessAudio, FailAudio]);

    return (
        <>
            <Row className="justify-content-start align-content-center g-5 py-3 mx-1 gx-xl-4">
                <Col xs={12} className="pt-5">
                    <Row className="justify-content-between align-items-center">
                        <Col xs="auto">
                            <h1 className="text-truncate">Welcome {userProfile.name} !</h1>
                        </Col>
                        <Col xs="auto">
                            <Button variant="danger" href="/cdn-cgi/access/logout">
                                <i className="bi bi-box-arrow-right me-2"></i>Logout
                            </Button>
                        </Col>
                        <Col xs={12}>
                            <Weather weatherData={weatherData}/>
                        </Col>
                        <Col xs={12}>
                            <Alert variant={"warning"} show={wsDisconnected} className="wsDisconnected">
                                與伺服器的連線中斷! 正在重新連線...</Alert>
                        </Col>
                    </Row>
                </Col>
                {vm_data.map((vm) => <Flag key={vm._id} vm_data={vm}/>)}
                <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-xl-4">
                    <Link to={`/download`}>
                        <Ratio aspectRatio="1x1" onClick={() => null} className="flagHover">
                            <div>
                                <img src={download_svg} alt="Download" className="flag"
                                     style={{backgroundColor: "#fff", padding: "0.8rem"}}
                                     draggable={false}/>
                            </div>
                        </Ratio>
                    </Link>
                </Col>
                <Col xs={12}>
                    <Row className="justify-content-between align-items-center">
                        <Col xs={12}>
                            <p className="text-end">
                                最後更新: {lastUpdate} <br/>
                                距離下次更新: {nextUpdateInterval}
                            </p>
                        </Col>
                    </Row>
                </Col>
                <Col xs={12}>
                    <PWAInstall/>
                </Col>
                <Col xs={12}>
                    <Row className="justify-content-between">
                        <Col xs="auto">
                            <span>Build by © {moment().format("yyyy")} <a
                                href="https://github.com/cocomine" target="_blank"
                                rel="noopener noreferrer">cocomine</a>.</span>
                            <br/>
                            <span className="text-muted">{APP_VERSION} </span>
                            <a href="https://github.com/cocomine/chrome-vpn/blob/master/PrivacyPolicy.md"
                               target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                        </Col>
                        <Col xs="auto">
                            <Button variant="link" href="https://github.com/cocomine/cocomine_vpnapi_ui" target="_blank"
                                    rel="noopener noreferrer">
                                <i className="bi bi-github me-2"></i>Source Code on Github
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Outlet context={{statusUpdateCallback} satisfies ContextType}/>
        </>
    );
}

/**
 * PWA install element for menu
 * @constructor
 */
const PWAInstall: React.FC = () => {
    const installPWA = useCallback(async () => {
        deferredPrompt.prompt();
    }, []);

    if (!deferredPrompt || isPwa()) return null
    return (
        <div>
            <div className="pwa-install rounded p-2 px-3 border" onClick={installPWA}>
                <Row className="align-items-center align-content-center">
                    <Col xs="auto">
                        <img src={require('../assets/devcie.webp')} alt="將網頁安裝為APP" style={{height: "6rem"}}
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
        </div>
    )
}

/**
 * Weather element for menu
 */
const Weather: React.FC<{ weatherData: WeatherDataType }> = ({weatherData}) => {
    const [data, setData] = useState<WeatherDataType>(weatherData);

    const alert: AlertMemoType = useMemo(() => {
        console.debug(data.alert)
        return data.alert.map((item) => {
            return [require("../assets/weather alert/" + item.code + ".webp"), item.code]
        })
    }, [data.alert]);

    //update weather data
    useEffect(() => {
        setData(weatherData)
    }, [weatherData]);

    return (
        <Row className="g-1 align-content-center align-items-center gx-2">
            <Col xs={"auto"}>
                <span>{moment().format("LL")}</span>
            </Col>
            <Col xs={"auto"}>
                <img src={`https://www.hko.gov.hk/images/HKOWxIconOutline/pic${data.icon}.png`} alt="weather"
                     style={{width: '40px'}}/>
                <span>{data.temperature}°C</span>
            </Col>
            <Col xs={"auto"}>
                <img src={moisture} alt="weather" style={{width: '20px'}} className="me-1 pb-1"/>
                <span>{data.humidity}%</span>
            </Col>
            {data.uv_index !== 0 ? <Col xs={"auto"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24"
                     strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M3 12h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 1 1 8 0"/>
                    <path d="M12 4v-1"/>
                    <path d="M13 16l2 5h1l2 -5"/>
                    <path d="M6 16v3a2 2 0 1 0 4 0v-3"/>
                </svg>
                <span>{data.uv_index}</span>
            </Col> : null}
            <Col xs={"auto"}>
                {alert.map(([item, code], index) =>
                    <img src={item} key={index} alt={"weather alert"} style={{width: "40px"}}
                         className={'me-2 ' + (DANGER_WEATHER_ALERT.includes(code) ? 'danger-border' : '')}/>
                )}
            </Col>
            <Col style={{minWidth: "20rem"}}>
                <div className="marquee"><p>
                    {data.weatherReport.tcInfo !== "" ?
                        <span style={{paddingLeft: "3rem"}}>⚠熱帶氣旋資訊⚠: {data.weatherReport.tcInfo}</span> : null}
                    {data.weatherReport.fireDangerWarning !== "" ?
                        <span style={{paddingLeft: "3rem"}}>火災危險警告信息: {data.weatherReport.tcInfo}</span> : null}
                    <span style={{paddingLeft: "1rem"}}>{data.weatherReport.generalSituation}</span>
                    <span style={{paddingLeft: "3rem"}}>今日天氣預測: {data.weatherReport.forecastDesc}</span>
                    <span style={{paddingLeft: "3rem"}}>展望: {data.weatherReport.outlook}</span>
                </p></div>
            </Col>
        </Row>
    )

}

/**
 * Flag element for menu
 * @param vm_data VM data
 * @constructor
 */
const Flag: React.FC<{ vm_data: VMDataType }> = ({vm_data}) => {
    const [data, setData] = useState<VMDataType>(vm_data);

    // provider image element for menu item (memoized) (only update when data._provider is changed)
    const provider = useMemo(() => {
        switch (data._provider) {
            case "google":
                return <img src={require("../assets/google.webp")} alt="google" className="providerIcon"/>;
            case "azure":
                return <img src={require("../assets/azure.webp")} alt="azure" className="providerIcon"/>;
            default:
                return null;
        }
    }, [data._provider]);

    // status mark element for menu item (memoized) (only update when data._isPowerOn is changed)
    const statusMark = useMemo(() => {
        if (data._isPowerOn)
            return <div className="statusMark online"></div>;

        return <div className="statusMark offline"></div>;
    }, [data._isPowerOn]);

    // spinner element for menu item (memoized) (only update when data._status is changed)
    const spinner = useMemo(() => {
        if (PROCESSING_STATUS_TEXT.includes(data._status))
            return (
                <>
                    <div className="spinner"><Spinner animation="border"/></div>
                    <div className="offlineDimDark"></div>
                </>
            );

        return null;
    }, [data._status]);

    // flag image element for menu item (memoized) (only update when data._country is changed)
    const flag = useMemo(() => {
        switch (data._country) {
            case "TW":
                return <img src={tw_flag} alt="TW Flag" className="flag fit-left" draggable={false}/>;
            case "JP":
                return <img src={jp_flag} alt="JP Flag" className="flag" draggable={false}/>;
            case "US":
                return <img src={us_flag} alt="JP Flag" className="flag fit-left" draggable={false}/>;
            case "HK":
                return <img src={hk_flag} alt="HK Flag" className="flag" draggable={false}/>;
            case "UK":
                return <img src={uk_flag} alt="UK Flag" className="flag" draggable={false}/>;
            case "IN":
                return <img src={in_flag} alt="IN Flag" className="flag" draggable={false}/>;
            default:
                return null;
        }
    }, [data._country]);

    // update data when vm_data is changed
    useEffect(() => {
        setData(vm_data)
    }, [vm_data]);

    if (spinner === null) {
        return (
            <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-xl-4">
                <Link to={`/${data._id}`}>
                    <Ratio aspectRatio="1x1" onClick={() => null} className="flagHover">
                        <div>
                            {flag}
                            {provider}
                            {statusMark}
                            {!data._isPowerOn ? <div className="offlineDimDark"></div> : null}
                            {spinner}
                        </div>
                    </Ratio>
                </Link>
            </Col>
        )
    } else {
        return (
            <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-xl-4">
                <Ratio aspectRatio="1x1" onClick={() => null} className="flagHover">
                    <div>
                        {flag}
                        {provider}
                        {statusMark}
                        {!data._isPowerOn ? <div className="offlineDimDark"></div> : null}
                        {spinner}
                    </div>
                </Ratio>
            </Col>
        )
    }
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

export {Menu};