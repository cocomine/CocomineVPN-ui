import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Button, Col, Ratio, Row, Spinner} from "react-bootstrap";
import "./App.scss";
import moment from "moment";
import 'react-toastify/dist/ReactToastify.min.css';
import {Link, Outlet} from "react-router-dom";
import {API_URL, ContextType, IstatusUpdateCallback, toastHttpError, TOKEN} from "./App";
import us_flag from "./assets/us.svg";
import download_svg from "./assets/download.svg";
import {APP_VERSION} from "./index";
import {websocket, websocketData} from "./websocks";
import {toast} from "react-toastify";

/**
 * Type definition for the country.
 * @typedef {("TW" | "JP" | "US" | "HK" | string)} country
 */
type country = "TW" | "JP" | "US" | "HK" | string
/**
 * Type definition for the provider.
 * @typedef {("google" | "azure")} provider
 */
type provider = "google" | "azure"
/**
 * Type definition for the profile.
 * @typedef {Object} profile
 * @property {("OpenVPN" | "SoftEther" | "SS")} type - The type of the profile.
 * @property {string} name - The name of the profile.
 * @property {string} filename - The filename of the profile.
 * @property {string} [url] - The url of the profile.
 */
type profile = {
    "type": "OpenVPN" | "SoftEther" | "SS",
    "name": string,
    "filename": string
    "url"?: string
}
/**
 * Type definition for the read only mode.
 * @typedef {("startOnly" | "stopOnly" | "readOnly" | "disable")} readOnlyMode
 */
type readOnlyMode = "startOnly" | "stopOnly" | "readOnly" | "disable"
/**
 * Type definition for the VM data.
 * @typedef {Object} VMData
 * @property {string} _name - The name of the VM.
 * @property {string} _status - The status of the VM.
 * @property {string} _id - The id of the VM.
 * @property {string} _zone - The zone of the VM.
 * @property {string} _url - The url of the VM.
 * @property {country} _country - The country of the VM.
 * @property {profile[]} _profiles - The profiles of the VM.
 * @property {provider} _provider - The provider of the VM.
 * @property {boolean} _isPowerOn - The power status of the VM.
 * @property {readOnlyMode} _readonly - The read only mode of the VM.
 */
type VMData = {
    readonly _name: string;
    _status: string;
    readonly _id: string;
    readonly _zone: string;
    readonly _url: string
    readonly _country: country
    readonly _profiles: profile[]
    readonly _provider: provider
    _isPowerOn: boolean
    readonly _readonly: readOnlyMode,
    _expired?: string | null
}
/**
 * Type definition for the user profile.
 * @typedef {Object} userProfile
 * @property {string} email - The email of the user.
 * @property {string} username - The username of the user.
 * @property {string} ip - The ip of the user.
 */
type userProfile = {
    email: string;
    username: string;
    ip: string;
}

// VM processing status
const processingStatusText = [
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

const Menu: React.FC<{
    data: { data: VMData[], next_update: string, last_update: string },
    userProfile: userProfile
}> = ({data, userProfile}) => {
    const [vm_data, setVMData] = useState<VMData[]>([]);
    const [nextUpdateInterval, setNextUpdateInterval] = useState("00:00");
    const [lastUpdate, setLastUpdate] = useState("00:00");
    const [nextUpdate, setNextUpdate] = useState(moment());

    // fetch data when data is changed
    useEffect(() => {
        setVMData(data.data);
        setNextUpdate(moment(data.next_update));
        setLastUpdate(moment(data.last_update).format("HH:mm"));
    }, [data]);

    // update timeInterval every second
    useEffect(() => {
        const abortController = new AbortController();
        let count5time = 0;

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
        websocket.onmessage = (event) => {
            console.debug("In React" + event.data)
            const data: websocketData = JSON.parse(event.data)

            if (data.url === "/vpn/vm") {
                setVMData((perv) => {
                    let index = perv.findIndex((vm: VMData) => vm._id === data.data._id);
                    perv[index] = data.data;
                    return perv;
                })
            }
        }
    }, [websocket]);

    // status update callback function for child component to update status and show toast message when status changed successfully or failed to change status
    const statusUpdateCallback = useCallback<IstatusUpdateCallback>(async (target, vm_id) => {
        // show toast message
        await toast.promise(new Promise((resolve, reject) => {
                let count = 0;
                const id = setInterval(() => {
                    count++;
                    if (vm_data.find((vm) => vm._id === vm_id)?._isPowerOn === target) {
                        clearInterval(id);
                        resolve("Success")
                    }
                    if (count > 60) {
                        clearInterval(id);
                        reject("Timeout")
                    }
                }, 1000);
            }), {
                pending: `正在${target ? '開機' : '關機'}中...`,
                success: '節點已成功' + (target ? '開機' : '關機') + '!',
                error: '節點' + (target ? '開機' : '關機') + '失敗!',
            }
        ).catch((err) => {
            console.error(err)
        });
    }, [vm_data]);

    return (
        <>
            <Row className="justify-content-start align-content-center g-5 py-3 mx-1 gx-xl-4">
                <Col xs={12} className="pt-5 pt-xl-0">
                    <Row className="justify-content-between align-items-center">
                        <Col xs="auto">
                            <h1>Welcome {userProfile.username} !</h1>
                        </Col>
                        <Col xs="auto">
                            <Button variant="danger" href="/cdn-cgi/access/logout">
                                <i className="bi bi-box-arrow-right me-2"></i>Logout
                            </Button>
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
                    <Row className="justify-content-between">
                        <Col xs="auto">
                            <span>Build by © {moment().format("yyyy")} <a
                                href="https://github.com/cocomine" target="_blank"
                                rel="noopener noreferrer">cocomine</a>.</span>
                            <br/>
                            <span className="text-muted">{APP_VERSION}</span>
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
 * Flag element for menu
 * @param vm_data VM data
 * @constructor
 */
const Flag: React.FC<{ vm_data: VMData }> = ({vm_data}) => {
    const [data, setData] = useState<VMData>(vm_data);

    // provider image element for menu item (memoized) (only update when data._provider is changed)
    const provider = useMemo(() => {
        switch (data._provider) {
            case "google":
                return <img src={require("./assets/google.webp")} alt="google" className="providerIcon"/>;
            case "azure":
                return <img src={require("./assets/azure.webp")} alt="azure" className="providerIcon"/>;
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
        if (processingStatusText.includes(data._status))
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
                return <img src={require("./assets/tw.webp")} alt="TW Flag" className="flag fit-left"
                            draggable={false}/>;
            case "JP":
                return <img src={require("./assets/jp.webp")} alt="JP Flag" className="flag" draggable={false}/>;
            case "US":
                return <img src={us_flag} alt="JP Flag" className="flag fit-left" draggable={false}/>;
            case "HK":
                return <img src={require('./assets/hk.webp')} alt="HK Flag" className="flag" draggable={false}/>;
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
 * Fetch VPN data
 * @param abortController AbortController
 */
const fetchVPNData = async (abortController: AbortController = new AbortController()) => {
    const res = await fetch(`${API_URL}/vpn`, {
        method: "GET",
        credentials: "include",
        signal: abortController.signal,
        redirect: "error",
        headers: {
            "Cf-Access-Jwt-Assertion": TOKEN,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    if (!res.ok) throw res;
    return await res.json();
}

/**
 * Fetch profile data
 * @param abortController AbortController
 */
const fetchProfileData = async (abortController: AbortController = new AbortController()) => {
    const res = await fetch(`${API_URL}/profile`, {
        method: "GET",
        credentials: "include",
        signal: abortController.signal,
        redirect: "error",
        headers: {
            "Cf-Access-Jwt-Assertion": TOKEN,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    if (!res.ok) throw res;
    return await res.json()
}

/**
 * NetworkError class that implements the Error interface.
 * This class is used to create a custom error type for network related errors.
 */
class NetworkError implements Error {
    /**
     * The error message.
     */
    message: string;

    /**
     * The name of the error. Default is "NetworkError".
     */
    name: string = "NetworkError";

    /**
     * Constructor for the NetworkError class.
     * @param {string} message - The error message.
     */
    constructor(message: string) {
        this.message = message;
    }
}

export {Menu, fetchVPNData, fetchProfileData, NetworkError};
export type {VMData, userProfile, profile, country, provider, readOnlyMode};
