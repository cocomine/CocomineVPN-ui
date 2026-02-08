import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {BlockerFunction, Link, Outlet, useBlocker, useLocation, useNavigate, useOutletContext} from "react-router-dom";
import {IndividualProfileContextType, ProfileContextType, VPNProfileType} from "../../../constants/Type";
import {Col, Modal, Row} from "react-bootstrap";
import {API_URL} from "../../../constants/GlobalVariable";
import ReactGA from "react-ga4";
import {OpenvpnProfile, SoftetherProfile} from "../../../constants/Interface";
import SingboxSVG from "../../../assets/images/svg/Sing-box.svg";


/**
 * Profile component
 *
 * This component displays a modal with VPN profiles for a specific virtual machine (VM).
 * It sets the document title based on the VM name and blocks navigation when the modal is open.
 * Path: /:id/profile
 *
 */
const Profile: React.FC = () => {
    const [show, setShow] = useState(true);
    const {data} = useOutletContext<ProfileContextType>();
    const navigate = useNavigate();
    const location = useLocation();

    // set title
    useEffect(() => {
        if (data === null) return;
        if (location.pathname === '/' + data._id + '/profile') {
            document.title = data._name + "設定檔 - Cocomine VPN";
            setShow(true);
        }
    }, [location, data]);

    // block navigation when modal is open
    const shouldBlock = useCallback<BlockerFunction>(({currentLocation}) => {
        if (currentLocation.pathname.toLowerCase().endsWith('/profile')) {
            setShow(false);
            return true;
        }
        return false;
    }, []);
    let blocker = useBlocker(shouldBlock);

    // redirect to home page after modal close animation
    useEffect(() => {
        if (show) return;
        const id = setTimeout(() => {
            if (blocker.state === "blocked") blocker.proceed();
        }, 150);
        return () => clearTimeout(id);
    }, [show, blocker]);

    return (
        <>
            {location.pathname.toLowerCase().endsWith('/profile') &&
                <Modal show={show} centered onHide={() => navigate('..', {replace: true})} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>下載設定檔 <small style={{color: "darkgray", fontSize: "x-small"}}>
                            ({data._name})
                        </small></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className={"gy-5 gx-4 justify-content-center"}>
                            {data._profiles.map((profile, index) =>
                                <SingleVPNProfile key={profile.name} profile={profile} vm_id={data._id}
                                                  profilesIndex={index}/>)}
                        </Row>
                    </Modal.Body>
                </Modal>
            }
            <Outlet context={{data: data._profiles} satisfies IndividualProfileContextType}/>
        </>
    );
};

/**
 * SingleVPNProfile component
 *
 * This component renders a single VPN profile based on the profile type.
 * It updates the profile data when the profile prop changes and selects the appropriate VPN component to render.
 *
 * @param {Object} props - The component props
 * @param {VPNProfileType} props.profile - The VPN profile data
 * @param {string} props.vm_id - The ID of the virtual machine
 */
const SingleVPNProfile: React.FC<{ profile: VPNProfileType, vm_id: string, profilesIndex?: number }> = ({
                                                                                                            profile,
                                                                                                            vm_id,
                                                                                                            profilesIndex = 0
                                                                                                        }) => {
    const [data, setData] = useState(profile);

    const elm = useMemo(() => {
        switch (data.type) {
            case "OpenVPN":
                return (<OpenVPN profile={data} vm_id={vm_id}/>);
            case "SoftEther":
                return (<SoftEther profile={data} vm_id={vm_id}/>);
            case "SS":
                return (
                    <Link
                        className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover"
                        to={'ss#' + profilesIndex}>
                        <img src={require("../../../assets/images/webp/SS.webp")} alt="ShadowSocks"
                             className="rounded-4 profileImg"
                             draggable={false}/>
                        <p className="text-center pt-2">{data.name}</p>
                    </Link>
                );
            case "socks5":
                // socks5 profiles are currently not rendered in this component
                return null;
            case "https":
                // https profiles are currently not rendered in this component
                return null;
            case "sing-box":
                return (
                    <Link
                        className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover"
                        to={'sing-box'}>
                        <img src={SingboxSVG} alt="Sing-box"
                             className="rounded-4 profileImg"
                             draggable={false}/>
                        <p className="text-center pt-2">{data.name}</p>
                    </Link>
                );
            default:
                return null;
        }
    }, [data, vm_id]);

    // update data when profile changed
    useEffect(() => {
        setData(profile);
    }, [profile]);

    if (elm === null) return null;
    return (
        <Col lg={2} md={3} xs={4}>
            {elm}
        </Col>
    );
};

/**
 * OpenVPN component
 *
 * This component renders the OpenVPN profile image and handles the download animation.
 *
 * @param {Object} props - The component props
 * @param {VPNProfileType} props.profile - The VPN profile data
 * @param {string} props.vm_id - The ID of the virtual machine
 */
const OpenVPN: React.FC<{ profile: OpenvpnProfile, vm_id: string }> = ({profile, vm_id}) => {
    const [data, setData] = useState(profile);
    const a_ref = useRef<any>(null);
    const [show, setShow] = useState<JSX.Element | null>(null);

    // update data when profile changed
    useEffect(() => {
        setData(profile);
    }, [profile]);

    // download animation
    const onClick = useCallback(() => {
        // Google Analytics
        ReactGA.event('vpn_profile_download', {
            profile_type: 'OpenVPN',
            vm_id: vm_id,
        });

        const img = a_ref.current as HTMLElement;
        const style = {
            top: img.getBoundingClientRect().top + "px",
            left: img.getBoundingClientRect().left + "px",
            width: img.getBoundingClientRect().width + "px",
            height: img.getBoundingClientRect().height + "px",
            "--right": (window.innerWidth - img.getBoundingClientRect().left) + "px",
            "--top": '-' + (window.innerHeight - img.getBoundingClientRect().top) + "px"
        };

        setShow(<div className="download-anime active" style={style}>
            <img src={require("../../../assets/images/webp/openvpn.webp")} alt="OpenVPN"
                 className="rounded-4 profileImg"
                 draggable={false}/>
        </div>);

        setTimeout(() => {
            setShow(null);
        }, 200);
    }, [vm_id]);

    return (
        <>
            <a href={API_URL + '/vpn/' + vm_id + '/profile/?type=' + data.type} download={data.filename}
               rel="noreferrer noopener"
               className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover"
               onClick={onClick}>
                <img src={require("../../../assets/images/webp/openvpn.webp")} alt="OpenVPN"
                     className="rounded-4 profileImg"
                     draggable={false} ref={a_ref}/>
                <p className="text-center pt-2">{data.name}</p>
            </a>
            {show}
        </>
    );
};

/**
 * SoftEther component
 *
 * This component renders the SoftEther profile image and handles the download animation.
 *
 * @param {Object} props - The component props
 * @param {VPNProfileType} props.profile - The VPN profile data
 * @param {string} props.vm_id - The ID of the virtual machine
 */
const SoftEther: React.FC<{ profile: SoftetherProfile, vm_id: string }> = ({profile, vm_id}) => {
    const [data, setData] = useState(profile);
    const a_ref = useRef<any>(null);
    const [show, setShow] = useState<JSX.Element | null>(null);

    // update data when profile changed
    useEffect(() => {
        setData(profile);
    }, [profile]);

    // download animation
    const onClick = useCallback(() => {
        // Google Analytics
        ReactGA.event('vpn_profile_download', {
            profile_type: 'SoftEther',
            vm_id: vm_id,
        });

        const img = a_ref.current as HTMLElement;
        const style = {
            top: img.getBoundingClientRect().top + "px",
            left: img.getBoundingClientRect().left + "px",
            width: img.getBoundingClientRect().width + "px",
            height: img.getBoundingClientRect().height + "px",
            "--right": (window.innerWidth - img.getBoundingClientRect().left) + "px",
            "--top": '-' + (window.innerHeight - img.getBoundingClientRect().top) + "px"
        };

        setShow(<div className="download-anime active" style={style}>
            <img src={require("../../../assets/images/webp/softether.webp")} alt="SoftEther"
                 className="rounded-4 profileImg"
                 draggable={false}/>
        </div>);

        setTimeout(() => {
            setShow(null);
        }, 200);
    }, [vm_id]);

    return (
        <>
            <a href={API_URL + '/vpn/' + vm_id + '/profile/?type=' + data.type} download={data.filename}
               rel="noreferrer noopener"
               className="chooseProfile_btn position-relative link-underline link-underline-opacity-0 link-underline-opacity-75-hover"
               onClick={onClick}>
                <img src={require("../../../assets/images/webp/softether.webp")} alt="SoftEther"
                     className="rounded-4 profileImg"
                     draggable={false} ref={a_ref}/>
                <p className="text-center pt-2">{data.name}</p>
            </a>
            {show}
        </>
    );
};

export default Profile;
