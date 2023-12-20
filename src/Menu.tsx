import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Col, Container, Modal, Ratio, Row, Spinner} from "react-bootstrap";
import "./App.scss";
import moment from "moment";
import {toast} from "react-toastify";
import 'react-toastify/dist/ReactToastify.min.css';
import {BrowserRouter, Link, Route, Routes, useLoaderData} from "react-router-dom";
import {API_URL} from "./App";

type country = "TW" | "JP"
type provider = "google" | "azure"
type profile = {
    "type": "OpenVPN" | "SoftEther",
    "filename": string
}
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

const Menu: React.FC = () => {
    const {vpnData, userProfile} = useLoaderData() as {vpnData: any, userProfile: userProfile};
    const [vm_data, setVMData] = useState<VMData[]>([]);
    const [nextUpdateInterval, setNextUpdateInterval] = useState("00:00");
    const [lastUpdate, setLastUpdate] = useState("00:00");
    const [nextUpdate, setNextUpdate] = useState(moment());

    // fetch data on mount
    useEffect(() => {
        setVMData(vpnData.data);
        setNextUpdate(moment(vpnData.next_update));
        setLastUpdate(moment(vpnData.last_update).format("HH:mm"));
    }, []);

    // update timeInterval every second
    useEffect(() => {
        const abortController = new AbortController();
        const id = setInterval(async () => {
            const diff = nextUpdate.diff(moment())

            // update data if next update time is passed
            if (diff < 0) {
                const vpnData = await fetchVPNData(abortController).catch(err => {
                    console.error(err)
                    err.name !== "AbortError" && toast.error("無法取得資料，請稍後再試");
                    setNextUpdate(moment().add(10, "seconds")); // retry after 10 seconds
                });
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
            </Row>
        </>
    );
}

const Flag: React.FC<{ vm_data: VMData }> = ({vm_data}) => {
    const [data, setData] = useState<VMData>(vm_data);

    const flag = useMemo(() => {
        switch (data._country) {
            case "TW":
                return <img src={require("./assets/tw.webp")} alt="TW Flag" className="flag tw"/>;
            case "JP":
                return <img src={require("./assets/jp.webp")} alt="JP Flag" className="flag"/>;
            default:
                return null;
        }
    }, [data._country]);

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

    const statusMark = useMemo(() => {
        if (data._isPowerOn)
            return <div className="statusMark online"></div>;

        return <div className="statusMark offline"></div>;
    }, [data._isPowerOn]);

    const spinner = useMemo(() => {
        if (processingStatusText.includes(data._status))
            return <div className="spinner"><Spinner animation="border"/></div>;

        return null;
    }, [data._status]);

    useEffect(() => {
        setData(vm_data)
    }, [vm_data]);

    return (
        <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-5 mx-lg-4">
            <Link to={`/${data._id}`}>
            <Ratio aspectRatio="1x1" onClick={() => null} className="FlagHover">
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
}

const loader = async () => {
    const vpnData = await fetchVPNData()
    const userProfile = await fetchProfileData();
    console.log(vpnData, userProfile) //debug
    return {vpnData, userProfile: {email: userProfile.data.email, username: userProfile.data.name, ip: userProfile.data.ip}}
}

const fetchVPNData = async (abortController: AbortController = new AbortController()) => {
    const res = await fetch(`${API_URL}/vpn`, {
        method: "GET",
        credentials: "include",
        signal: abortController.signal
    })
    if(!res.ok) throw res;
    return await res.json()
}

const fetchProfileData = async (abortController: AbortController = new AbortController()) => {
    const res = await fetch(`${API_URL}/profile`, {
        method: "GET",
        credentials: "include",
        signal: abortController.signal
    })
    if(!res.ok) throw res;
    return await res.json()
}

export {Menu, loader, fetchVPNData, fetchProfileData};
export type { VMData, userProfile, profile, country, provider };
