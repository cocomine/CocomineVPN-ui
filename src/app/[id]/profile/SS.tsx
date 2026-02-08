import React, {useCallback, useEffect, useState} from "react";
import {SSProfile} from "../../../constants/Interface";
import {Button, Col, Form, InputGroup, Modal, Row} from "react-bootstrap";
import {QRCodeSVG} from "qrcode.react";
import {BlockerFunction, useBlocker, useLocation, useNavigate, useOutletContext} from "react-router-dom";
import {IndividualProfileContextType} from "../../../constants/Type";
import {toast} from "react-toastify";

/**
 * SS component
 *
 * This component renders the ShadowSocks profile image and handles the download animation and QR code display.
 *
 * @deprecated ShadowSocks is deprecated and will be removed in future versions. Please use Sing-box instead.
 */
export const SS: React.FC = () => {
    const {data} = useOutletContext<IndividualProfileContextType>();
    const [profile, setProfile] = useState<SSProfile | null>(null);
    const [show, setShow] = useState(true);
    const [isCopy, setIsCopy] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // set profile data
    useEffect(() => {
        const index = parseInt(location.hash.substring(1)); // get index from url hash
        let tmp;
        // if index is invalid, find the first SS profile in data
        if (isNaN(index) || index < 0 || index >= data.length) {
            tmp = data.find((item) => item.type === 'SS');
        } else {
            // if index is valid, use it to get the profile, but still need to check if it's SS type
            if (data[index].type === 'SS') {
                tmp = data[index];
            }
        }

        if (!tmp) {
            // This should never happen, but just in case
            // redirect to profile page and show error message
            console.error("No SingBox profile found in data");
            toast.error("節點不提供ShadowSocks設定檔");
            navigate('..', {replace: true});
            return;
        }
        setProfile(tmp as SSProfile);
    }, [data]);

    // set title
    useEffect(() => {
        document.title = profile?.name + " - Cocomine VPN";
    }, [profile?.name]);

    // block navigation when modal is open
    const shouldBlock = useCallback<BlockerFunction>(({currentLocation}) => {
        if (currentLocation.pathname.toLowerCase().endsWith('/ss')) {
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

    // copy to clipboard
    const onCopy = useCallback(async () => {
        await navigator.clipboard.writeText(profile?.url || '');
        setIsCopy(true);

        setTimeout(() => {
            setIsCopy(false);
        }, 2000);
    }, [profile?.url]);

    return (
        <Modal show={show} onHide={() => navigate('..', {replace: true})} centered>
            <Modal.Header closeButton>
                <Modal.Title>{profile?.name || ''}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <span>掃描以下QR code</span>
                <Row className="justify-content-center mb-3">
                    <Col xs={"auto"} data-clarity-mask="true">
                        <QRCodeSVG value={profile?.url || ''} includeMargin={true} size={218}/>
                    </Col>
                </Row>

                <div className="d-grid">
                    <a className={"btn btn-lg btn-primary"} href={profile?.url || ''} role="button" target="_blank"
                       rel="noreferrer noopener">
                        <i className="bi bi-box-arrow-in-down-right me-2"></i> 直接導入 (需程式支援)
                    </a>
                </div>
            </Modal.Body>
            <hr className={"m-0"}/>
            <Modal.Body>
                <span>或複製以下連結</span>
                <InputGroup hasValidation>
                    <Form.Control readOnly={true} value={profile?.url || ''} isValid={isCopy}
                                  data-clarity-mask="true"/>
                    <Button onClick={onCopy} variant={isCopy ? "outline-success" : "outline-secondary"}>
                        <i className="bi bi-clipboard"></i></Button>
                    <Form.Control.Feedback type="valid">已複製</Form.Control.Feedback>
                </InputGroup>

            </Modal.Body>
        </Modal>
    );
};