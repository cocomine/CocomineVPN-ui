import React, {useEffect, useMemo, useState} from "react";
import {Button, Col, Ratio, Row, Spinner} from "react-bootstrap";
import "./App.scss";
import moment from "moment";
import 'react-toastify/dist/ReactToastify.min.css';
import {Link} from "react-router-dom";
import {API_URL, toastHttpError} from "./App";

type country = "TW" | "JP"
type provider = "google" | "azure"
type profile = {
    "type": "OpenVPN" | "SoftEther",
    "filename": string
}
type readOnlyMode = "startOnly" | "stopOnly" | "readOnly" | "disable"
type VMData = {
    _name: string;
    _status: string;
    _id: string;
    _zone: string;
    _url: string
    _country: country
    _profiles: profile[]
    _provider: provider
    _isPowerOn: boolean
    _readonly: readOnlyMode
}
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
    }, [nextUpdate]);

    return (
        <>
            <Row className="justify-content-around justify-content-md-start align-content-center g-5 py-3 mx-1">
                <Col xs={12}>
                    <h1>Welcome {userProfile.username} !</h1>
                </Col>
                {vm_data.map((vm) => <Flag key={vm._id} vm_data={vm}/>)}
                <Col xs={12} className="text-end">
                    <p>
                        最後更新: {lastUpdate} <br/>
                        距離下次更新: {nextUpdateInterval}
                    </p>
                </Col>
                <Col xs={12}>
                    <Button variant="link" href="https://github.com/cocomine/cocomine_vpnapi_ui" target="_blank"
                            rel="noopener noreferrer">
                        <i className="bi bi-github me-2"></i>Github
                    </Button>
                </Col>
            </Row>
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

    // flag image element for menu item (memoized) (only update when data._country is changed)
    const flag = useMemo(() => {
        switch (data._country) {
            case "TW":
                return <img src={require("./assets/tw.webp")} alt="TW Flag" className="flag tw" draggable={false}/>;
            case "JP":
                return <img src={require("./assets/jp.webp")} alt="JP Flag" className="flag" draggable={false}/>;
            default:
                return null;
        }
    }, [data._country]);

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

    // update data when vm_data is changed
    useEffect(() => {
        setData(vm_data)
    }, [vm_data]);

    if (spinner === null) {
        return (
            <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-5 mx-lg-4">
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
            <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-5 mx-lg-4">
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
 * Loader for menu
 * @constructor
 */
const loader = async () => {
    const vpnData = await fetchVPNData()
    const userProfile = await fetchProfileData();
    console.debug(vpnData, userProfile) //debug
    return {
        vpnData,
        userProfile: {email: userProfile.data.email, username: userProfile.data.name, ip: userProfile.data.ip}
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
        signal: abortController.signal
    })
    if (!res.ok) throw res;
    return await res.json()
}

/**
 * Fetch profile data
 * @param abortController AbortController
 */
const fetchProfileData = async (abortController: AbortController = new AbortController()) => {
    const res = await fetch(`${API_URL}/profile`, {
        method: "GET",
        credentials: "include",
        signal: abortController.signal
    })
    if (!res.ok) throw res;
    return await res.json()
}

export {Menu, loader, fetchVPNData, fetchProfileData};
export type {VMData, userProfile, profile, country, provider};
