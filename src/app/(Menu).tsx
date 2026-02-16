import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Button, Col, Placeholder, Ratio, Row, Spinner} from "react-bootstrap";
import "./App.scss";
import moment from "moment";
import 'react-toastify/dist/ReactToastify.min.css';
import {Link, Outlet, useRevalidator} from "react-router-dom";
import us_flag from "../assets/images/svg/us.svg";
import uk_flag from "../assets/images/svg/uk.svg";
import hk_flag from "../assets/images/svg/hk.svg";
import jp_flag from "../assets/images/svg/jp.svg";
import tw_flag from "../assets/images/svg/tw.svg";
import in_flag from "../assets/images/svg/in.svg";
import moisture from "../assets/images/svg/moisture.svg";
import download_svg from "../assets/images/svg/download.svg";
import {toast} from "react-toastify";
import {APP_VERSION, DANGER_WEATHER_ALERT, PROCESSING_STATUS_TEXT} from "../constants/GlobalVariable";
import {I_StatusUpdateCallback} from "../constants/Interface";
import {AlertMemoType, MenuContextType, PostMessageData, VMInstanceDataType, WeatherDataType} from "../constants/Type";
import ExtensionInstallBanner from "../components/ExtensionInstallBanner";
import {useVMData} from "../hook/VMDataContext";
import {useUserProfile} from "../hook/UserProfileContext";
import AnnouncementBanner from "../components/AnnouncementBanner";

/**
 * Menu component
 *
 * This component displays the main menu, including VM data, user profile, and weather data.
 * It handles fetching and updating VM data, managing websocket connections, and displaying status updates.
 *
 * Parent component: App@src/app/App.tsx
 *
 * @param props - The component props
 * @param weatherData - The weather data
 */
const Menu: React.FC<{
    weatherData: WeatherDataType
}> = ({weatherData}) => {
    const data = useVMData();
    const [vm_data, setVMData] = useState<VMInstanceDataType[]>([]);
    const [nextUpdateInterval, setNextUpdateInterval] = useState("--:--");
    const [lastUpdate, setLastUpdate] = useState("00:00");
    const [nextUpdate, setNextUpdate] = useState(moment());
    const userProfile = useUserProfile();
    let revalidator = useRevalidator();

    // fetch data when data is changed
    useEffect(() => {
        if (data === null) return;
        setVMData(data.data);
        setNextUpdate(moment(data.next_update));
        setLastUpdate(moment(data.last_update).format("HH:mm"));
        setNextUpdateInterval(moment(data.next_update).format("HH:mm"));
        console.log("VMData updated, next update: " + data.next_update);
    }, [data, data?.data]);

    // check update every 5 second
    useEffect(() => {
        const id = setInterval(async () => {
            const diff = nextUpdate.diff(moment());

            // update data if next update time is passed
            if (diff < 0) {
                revalidator.revalidate();
                return;
            }
        }, 5000);

        return () => {
            clearInterval(id);
        };
    }, [nextUpdate, revalidator]);

    // post message to content script when vm_data is changed
    useEffect(() => {
        window.postMessage({
            type: 'PostVMData',
            ask: false,
            data: vm_data
        });
    }, [vm_data]);

    // audio element for playing sound when status changed
    const SuccessAudio = useMemo(() => new Audio(require("../assets/sounds/Bing.mp3")), []);
    const FailAudio = useMemo(() => new Audio(require("../assets/sounds/Error.mp3")), []);

    // status update callback function for child component to update status and show toast message when status changed successfully or failed to change status
    const statusUpdateCallback = useCallback<I_StatusUpdateCallback>(async (target, vm_id) => {
        // show toast message
        await toast.promise(new Promise((resolve, reject) => {

            let timeout: NodeJS.Timeout | null = null;

            // create event listener for message from window
            function callback(event: MessageEvent<PostMessageData>) {
                if (event.source !== window) return; // ignore message from other source

                // check VM data message
                if (event.data.type === "PostVMData" && !event.data.ask) {
                    const data = event.data.data;
                    let index = data.findIndex((vm) => vm._id === vm_id);

                    if (data[index]._isPowerOn === target) {
                        SuccessAudio.play();
                        resolve("Success");
                        timeout && clearTimeout(timeout); //clear timeout
                        window.removeEventListener("message", callback); // remove event listener
                    }
                }

                // check VM operation fail message
                if (event.data.type === "VMOperationFail" && !event.data.ask) {
                    const data = event.data.data;
                    if (data.id === vm_id) {
                        FailAudio.play();
                        reject(data.reason);
                        timeout && clearTimeout(timeout); //clear timeout
                        window.removeEventListener("message", callback); // remove event listener
                    }
                }
            }

            //receive message from window
            window.addEventListener("message", callback);

            // timeout for 2 minutes
            timeout = setTimeout(() => {
                FailAudio.play();
                reject("Timeout");
                window.removeEventListener("message", callback); // remove event listener
            }, 2 * 60 * 1000);

            }), {
                pending: `正在${target ? '開機' : '關機'}中...`,
                success: '節點已成功' + (target ? '開機' : '關機') + '!',
            error: {
                render({data}) {
                    return (<>
                        節點{(target ? '開機' : '關機')}失敗!<br/>
                        {data === 'CPU_QUOTA' ?
                            <small className={'text-muted'}>雲端供應商 CPU 配額不足, 請稍後再試</small> : null}
                    </>);
                }
            },
            }
        ).catch((err) => {
            console.error(err);
        });
    }, [SuccessAudio, FailAudio]);

    return (
        <>
            <Row className="justify-content-start align-content-center g-5 py-3 mx-1 gx-xl-4">
                <Col xs={12} className="pt-5">
                    <Row className="justify-content-between align-items-center">
                        <Col xs="auto">
                            <h1 className="text-truncate">Welcome {userProfile?.name ?? userProfile?.custom?.name ?? ""} !</h1>
                        </Col>
                        <Col xs="auto">
                            <Button variant="danger" href="/cdn-cgi/access/logout">
                                <i className="bi bi-box-arrow-right me-2"></i>Logout
                            </Button>
                        </Col>
                        <Col xs={12}>
                            <Weather weatherData={weatherData}/>
                        </Col>
                    </Row>
                </Col>
                {vm_data.length <= 0 ?
                    Array(7).fill('').map((_, index) =>
                        <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-xl-4" key={index}>
                            <Ratio aspectRatio="1x1" onClick={() => null} className="flagHover">
                                <div>
                                    <Placeholder as={'div'} animation="glow" className="w-100 h-100">
                                        <Placeholder xs={12} className="flag"/>
                                    </Placeholder>
                                </div>
                            </Ratio>
                        </Col>
                    )
                    : vm_data.map((vm) => <Flag key={vm._id} data={vm}/>)
                }
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
                                下次更新: {nextUpdateInterval}
                            </p>
                        </Col>
                    </Row>
                </Col>
                <Col xs={12}>
                    <Row className={'gy-2'}>
                        <Col xs={12}>
                            <ExtensionInstallBanner/>
                        </Col>
                        <Col xs={12}>
                            <AnnouncementBanner/>
                        </Col>
                        {/*<Col xs={12}>
                            <AppInstallBanner/>
                        </Col>*/}
                    </Row>
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
                            <Button variant="link" href="https://github.com/cocomine/cocomine_vpnapi_ui"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                <i className="bi bi-github me-2"></i>Source Code on Github
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Outlet context={{statusUpdateCallback} satisfies MenuContextType}/>
        </>
    );
};

/**
 * Weather element for menu
 */
const Weather: React.FC<{ weatherData: WeatherDataType }> = ({weatherData}) => {
    const [data, setData] = useState<WeatherDataType>(weatherData);

    const alert: AlertMemoType = useMemo(() => {
        return data.alert.map((item) => {
            return [require("../assets/weather alert/" + item.code + ".webp"), item.code];
        });
    }, [data.alert]);

    //update weather data
    useEffect(() => {
        setData(weatherData);
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
                        <span>
                            <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                            熱帶氣旋資訊: {data.weatherReport.tcInfo}
                        </span> : null}
                    {data.weatherReport.fireDangerWarning !== "" ?
                        <span style={{paddingLeft: "3rem"}}>
                            <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                            火災危險警告信息: {data.weatherReport.tcInfo}
                        </span> : null}
                    <span style={{paddingLeft: "3rem"}}>{data.weatherReport.generalSituation}</span>
                    <span
                        style={{paddingLeft: "3rem"}}>{data.weatherReport.forecastPeriod}: {data.weatherReport.forecastDesc}</span>
                    <span style={{paddingLeft: "3rem"}}>展望: {data.weatherReport.outlook}</span>
                </p></div>
            </Col>
        </Row>
    );

};

/**
 * Flag element for menu
 * @param vm_data VM data
 * @constructor
 */
const Flag: React.FC<{ data: VMInstanceDataType }> = ({data}) => {
    const [vm_data, setVm_data] = useState(data);

    // provider image element for menu item (memoized) (only update when data._provider is changed)
    const provider = useMemo(() => {
        switch (vm_data._provider) {
            case "google":
                return <img src={require("../assets/images/webp/google.webp")} alt="google" className="providerIcon"/>;
            case "azure":
                return <img src={require("../assets/images/webp/azure.webp")} alt="azure" className="providerIcon"/>;
            default:
                return null;
        }
    }, [vm_data._provider]);

    // status mark element for menu item (memoized) (only update when data._isPowerOn is changed)
    const statusMark = useMemo(() => {
        if (vm_data._isPowerOn)
            return <div className="statusMark online"></div>;

        return <div className="statusMark offline"></div>;
    }, [vm_data._isPowerOn]);

    // spinner element for menu item (memoized) (only update when data._status is changed)
    const spinner = useMemo(() => {
        if (PROCESSING_STATUS_TEXT.includes(vm_data._status))
            return (
                <>
                    <div className="spinner"><Spinner animation="border"/></div>
                    <div className="offlineDimDark"></div>
                </>
            );

        return null;
    }, [vm_data._status]);

    // flag image element for menu item (memoized) (only update when data._country is changed)
    const flag = useMemo(() => {
        switch (vm_data._country) {
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
    }, [vm_data._country]);

    // update data when vm_data is changed
    useEffect(() => {
        setVm_data(data);
    }, [data]);

    if (spinner === null) {
        return (
            <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-xl-4">
                <Link to={`/${vm_data._id}`}>
                    <Ratio aspectRatio="1x1" onClick={() => null} className="flagHover">
                        <div>
                            {flag}
                            {provider}
                            {statusMark}
                            {!vm_data._isPowerOn ? <div className="offlineDimDark"></div> : null}
                            {spinner}
                        </div>
                    </Ratio>
                </Link>
            </Col>
        );
    } else {
        return (
            <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-xl-4">
                <Ratio aspectRatio="1x1" onClick={() => null} className="flagHover">
                    <div>
                        {flag}
                        {provider}
                        {statusMark}
                        {!vm_data._isPowerOn ? <div className="offlineDimDark"></div> : null}
                        {spinner}
                    </div>
                </Ratio>
            </Col>
        );
    }
};

export {Menu};
