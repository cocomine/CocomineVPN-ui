import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Col, Form, Modal, Row} from "react-bootstrap";
import {API_URL} from "./App";
import {profile} from "./Menu";
import {QRCodeSVG} from "qrcode.react";

const Profile: React.FC<{ profile: profile, vm_id: string }> = ({profile, vm_id}) => {
    const [data, setData] = useState<profile>(profile);

    const elm = useMemo(() => {
        switch (data.type) {
            case "OpenVPN":
                return (<OpenVPN profile={profile} vm_id={vm_id}/>)
            case "SoftEther":
                return (<SoftEther profile={profile} vm_id={vm_id}/>)
            case "SS":
                return (<SS profile={profile}/>)
        }
    }, [data, profile, vm_id]);

    // update data when profile changed
    useEffect(() => {
        setData(profile)
    }, [profile]);

    return (
        <Col xl={2} lg={3} md={4} sm={5} xs={6} className="">
            {elm}
        </Col>
    )
}

const OpenVPN: React.FC<{ profile: profile, vm_id: string }> = ({profile, vm_id}) => {
    const [data, setData] = useState<profile>(profile);
    const a_ref = useRef<any>(null);
    const [show, setShow] = useState<JSX.Element | null>(null);

    // update data when profile changed
    useEffect(() => {
        setData(profile)
    }, [profile]);

    // download animation
    const onClick = useCallback(() => {
        const img = a_ref.current as HTMLElement
        const style = {
            top: img.getBoundingClientRect().top + "px",
            left: img.getBoundingClientRect().left + "px",
            width: img.getBoundingClientRect().width + "px",
            height: img.getBoundingClientRect().height + "px",
            "--right": (window.innerWidth - img.getBoundingClientRect().left) + "px",
            "--top": '-' + (window.innerHeight - img.getBoundingClientRect().top) + "px"
        }

        setShow(<div className='download-anime active' style={style}>
            <img src={require("./assets/openvpn.webp")} alt="OpenVPN" className="rounded-5 profileImg"
                 draggable={false}/>
        </div>)

        setTimeout(() => {
            setShow(null)
        }, 200);
    }, [])

    return (
        <>
            <a href={API_URL + '/vpn/' + vm_id + '/profile/?type=' + data.type} download={data.filename}
               rel="noreferrer noopener"
               className="chooseProfile_btn position-relative" onClick={onClick}>
                <img src={require("./assets/openvpn.webp")} alt="OpenVPN" className="rounded-5 profileImg"
                     draggable={false} ref={a_ref}/>
                <p className="text-center pt-2">{data.name}</p>
            </a>
            {show}
        </>
    )
}

const SoftEther: React.FC<{ profile: profile, vm_id: string }> = ({profile, vm_id}) => {
    const [data, setData] = useState<profile>(profile);
    const a_ref = useRef<any>(null);
    const [show, setShow] = useState<JSX.Element | null>(null);

    // update data when profile changed
    useEffect(() => {
        setData(profile)
    }, [profile]);

    // download animation
    const onClick = useCallback(() => {
        const img = a_ref.current as HTMLElement
        const style = {
            top: img.getBoundingClientRect().top + "px",
            left: img.getBoundingClientRect().left + "px",
            width: img.getBoundingClientRect().width + "px",
            height: img.getBoundingClientRect().height + "px",
            "--right": (window.innerWidth - img.getBoundingClientRect().left) + "px",
            "--top": '-' + (window.innerHeight - img.getBoundingClientRect().top) + "px"
        }

        setShow(<div className='download-anime active' style={style}>
            <img src={require("./assets/softether.webp")} alt="WireGuard" className="rounded-5 profileImg"
                 draggable={false}/>
        </div>)

        setTimeout(() => {
            setShow(null)
        }, 200);
    }, [])

    return (
        <>
            <a href={API_URL + '/vpn/' + vm_id + '/profile/?type=' + data.type} download={data.filename}
               rel="noreferrer noopener"
               className="chooseProfile_btn position-relative" onClick={onClick}>
                <img src={require("./assets/softether.webp")} alt="WireGuard" className="rounded-5 profileImg"
                     draggable={false} ref={a_ref}/>
                <p className="text-center pt-2">{data.name}</p>
            </a>
            {show}
        </>
    )
}

const SS: React.FC<{ profile: profile }> = ({profile}) => {
    const [data, setData] = useState<profile>(profile);
    const [show, setShow] = useState(false);

    // update data when profile changed
    useEffect(() => {
        setData(profile)
    }, [profile]);

    // download animation
    const onClick = useCallback((e: any) => {
        e.preventDefault()
        e.stopPropagation()

        setShow(true)
    }, [])

    return (
        <>
            <a href="#" onClick={onClick}>
                <img src={require("./assets/SS.webp")} alt="WireGuard" className="rounded-5 profileImg"
                     draggable={false}/>
                <p className="text-center pt-2">{data.name}</p>
            </a>
            <Modal show={show} onHide={() => setShow(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{profile.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="justify-content-center gy-2">
                        <Col xs={"auto"}>
                            <QRCodeSVG value={profile.url || ''} includeMargin={true} size={218}/>
                        </Col>
                        <Col xs={12}>
                            <Form.Control readOnly={true} value={profile.url || ''}/>
                        </Col>
                    </Row>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default Profile;