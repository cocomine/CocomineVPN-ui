import React, {useEffect, useMemo, useState} from "react";
import {Col, Container, Ratio, Row, Spinner} from "react-bootstrap";
import "./App.scss";
import moment from "moment";

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

const Menu: React.FC<{onLoad?: () => void}> = ({onLoad = () => null}) => {
    const [vm_data, setVMData] = useState<VMData[]>([{
        _name: "test",
        _status: "STOPPING",
        _id: "test",
        _zone: "test",
        _url: "test",
        _country: "TW",
        _profiles: [{
            "type": "OpenVPN",
            "filename": "test"
        }],
        _provider: "google",
        _isPowerOn: false
    },
        {
            _name: "test2",
            _status: "test2",
            _id: "test2",
            _zone: "test2",
            _url: "test2",
            _country: "JP",
            _profiles: [{
                "type": "OpenVPN",
                "filename": "test2"
            }],
            _provider: "azure",
            _isPowerOn: true
        }]);
    const [userProfile, setUserProfile] = useState<userProfile>({email: "test", username: "test", ip: "test"});
    const [nextUpdateInterval, setNextUpdateInterval] = useState("--:--");
    const [lastUpdate, setLastUpdate] = useState("--:--");
    const [nextUpdate, setNextUpdate] = useState(moment().add(1, "minutes"));

    useEffect(() => {
        //todo: network request
        setLastUpdate(moment().format("HH:mm"));

        const id = setInterval(() => {
            const diff = nextUpdate.diff(moment())

            if(diff <= 0) {
                //todo: network request
                setNextUpdate(moment().add(1, "minutes"));
                return
            }
            setNextUpdateInterval(moment(diff).format("mm:ss"));
        }, 1000);

        return () => clearInterval(id);
    }, [nextUpdate]);

    return (
        <Row className="justify-content-around justify-content-md-start align-content-center g-5 py-3 mx-1">
            <Col xs={12}>
                <h1>Welcome {userProfile.username} !</h1>
            </Col>
            {vm_data.map((vm, i) => <Flag key={i} vm_data={vm}/>)}
            <Col xs={12} className="text-end">
                <p>
                    最後更新: {lastUpdate} <br/>
                    距離下次更新: {nextUpdateInterval}
                </p>
            </Col>
        </Row>
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
        if(data._isPowerOn)
            return <div className="statusMark online"></div>;

        return <div className="statusMark offline"></div>;
    }, [data._isPowerOn]);

    const spinner = useMemo(() => {
        if(processingStatusText.includes(data._status))
            return <div className="spinner"><Spinner animation="border"/></div>;

        return null;
    }, [data._status]);

    useEffect(() => {
        setData(vm_data)
    }, [vm_data]);

    return (
        <Col xl={2} lg={3} md={4} sm={5} xs={6} className="mx-5 mx-lg-4">
            <Ratio aspectRatio="1x1" onClick={() => null} className="FlagHover">
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

export {Menu};