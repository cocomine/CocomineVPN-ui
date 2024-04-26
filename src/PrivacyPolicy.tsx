import React, {useEffect, useState} from 'react';
import {Modal} from "react-bootstrap";
import {useBlocker, useLocation, useNavigate} from "react-router-dom";

const PrivacyPolicy: React.FC = () => {
    const [show, setShow] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    // block navigation when modal is open
    let blocker = useBlocker(() => {
        setShow(false)
        return true
    });

    // redirect to home page after modal close animation
    useEffect(() => {
        if (show) return
        const id = setTimeout(() => {
            if (blocker.state === "blocked") blocker.proceed()
        }, 150);
        return () => clearTimeout(id);
    }, [show, blocker]);

    // set title
    useEffect(() => {
        if (location.pathname === '/privacypolicy') {
            document.title = "Privacy Policy - VPN Manager"
            setShow(true)
        }
    }, [location]);

    return (
        <Modal show={show} fullscreen onHide={() => navigate('..', {replace: true})}>
            <Modal.Header closeButton>
                <Modal.Title>私隱權政策 <b>Privacy Policy</b></Modal.Title>
            </Modal.Header>
            <Modal.Body>

            </Modal.Body>
        </Modal>
    )
}

export default PrivacyPolicy;