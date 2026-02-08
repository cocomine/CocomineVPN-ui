import React, {useCallback, useEffect, useMemo, useState} from "react";
import {SingboxProfile} from "../../../constants/Interface";
import {Alert, Button, Col, Form, InputGroup, Modal, Placeholder, Row} from "react-bootstrap";
import {QRCodeSVG} from "qrcode.react";
import {BlockerFunction, useBlocker, useNavigate, useOutletContext} from "react-router-dom";
import {IndividualProfileContextType} from "../../../constants/Type";
import {toast} from "react-toastify";
import SingboxSVG from "../../../assets/images/svg/Sing-box.svg";
import {API_URL} from "../../../constants/GlobalVariable";
import {useTurnstile} from "../../../hook/Turnstile";
import {toastHttpError} from "../../../components/ToastHttpError";

/**
 * SingBox component
 *
 * This component renders the SingBox profile image and handles the download animation and QR code display.
 */
export const SingBox: React.FC = () => {
    const {data} = useOutletContext<IndividualProfileContextType>();
    const [profile, setProfile] = useState<SingboxProfile | null>(null);
    const [show, setShow] = useState(true);
    const [isCopy, setIsCopy] = useState(false);
    const [subscriptionURL, setSubscriptionURL] = useState<URL>(new URL("sing-box://import-remote-profile#CocomineVPN"));
    const [status, setStatus] = useState<'loading' | 'no-exist-token' | 'exist-token' | 'new-token' | 'error'>('loading');
    const [hidden, setHidden] = useState(true);
    const execute = useTurnstile();
    const navigate = useNavigate();

    // generate information alert based on status
    const information = useMemo(() => {
        const msg = [];
        switch (status) {
            case 'no-exist-token':
                msg.push(<Alert variant={"warning"} key={0}>你未創建Sing-box訂閱連結, 請先創建訂閱連結</Alert>);
                break;
            // @ts-ignore as status is a union type, ts cannot infer that 'new-token' and 'exist-token' are the only possible values here, so we need to ignore the type checking here
            case 'new-token':
                msg.push(<Alert variant={"success"} key={1}>成功創建Sing-box訂閱連結, 連結有效期為90天</Alert>);
            case 'exist-token':
                msg.push(<Alert variant={"info"} key={2}>此訂閱連結已包含所有節點,毋須逐個節點匯入</Alert>);
                break;
            default:
                break;
        }
        return msg;
    }, [status]);

    // set profile data
    useEffect(() => {
        const tmp = data.find((item) => item.type === 'sing-box');
        if (!tmp) {
            // This should never happen, but just in case
            // redirect to profile page and show error message
            console.error("No SingBox profile found in data");
            toast.error("節點不提供Sing-box設定檔");
            navigate('..', {replace: true});
            return;
        }
        setProfile(tmp as SingboxProfile);
    }, [data]);

    // fetch subscription URL
    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            try {
                const response = await fetch(API_URL + '/vpn/singbox', {
                    method: 'GET',
                    credentials: 'include',
                    signal: controller.signal,
                });
                if (response.ok) {
                    if (response.status === 200) {
                        const res = await response.json();
                        const token = res.data.token;
                        const url = new URL("sing-box://import-remote-profile#CocomineVPN");
                        url.searchParams.set('url', API_URL + '/vpn/singbox/' + token);
                        setSubscriptionURL(url);
                        setStatus('exist-token');
                    }
                    if (response.status === 204) {
                        setStatus('no-exist-token');
                    }
                } else {
                    //handle turnstile challenge
                    if (response.status === 403 && response.headers.has('cf-mitigated') && response.headers.get('cf-mitigated') === 'challenge') {
                        try {
                            await execute();
                            // retry
                        } catch (e) {
                            console.error(e);
                            toast.error("未通過驗證! 請重新嘗試!");
                        }
                        return;
                    }
                    return toastHttpError(response.status); // other errors
                }
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    console.log("Fetch subscription URL aborted");
                    return;
                }
                console.error(e);
                return;
            }
        })();

        return () => {
            controller.abort();
        };
    }, []);

    // set title
    useEffect(() => {
        document.title = profile?.name + " - Cocomine VPN";
    }, [profile?.name]);

    // block navigation when modal is open
    const shouldBlock = useCallback<BlockerFunction>(({currentLocation}) => {
        if (currentLocation.pathname.toLowerCase().endsWith('/sing-box')) {
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
        await navigator.clipboard.writeText(subscriptionURL.toString());
        setIsCopy(true);

        setTimeout(() => {
            setIsCopy(false);
        }, 2000);
    }, [subscriptionURL]);

    const createSubscriptionURL = useCallback(() => {
        setStatus('new-token'); //todo: test
    }, []);

    return (
        <Modal show={show} onHide={() => navigate('..', {replace: true})} centered>
            <Modal.Header closeButton>
                <Modal.Title>{profile?.name || ''}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {information}
                <span>掃描以下QR code</span>
                <Row className="justify-content-center mb-3">
                    {status === 'loading' ?
                        <Col xs={"auto"}>
                            <Placeholder as={'div'} animation="glow" style={{width: 240, height: 240}}>
                                <Placeholder xs={12} className="flag"/>
                            </Placeholder>
                        </Col> :
                        <Col xs={"auto"} data-clarity-mask="true" style={{filter: hidden ? "blur(10px)" : "none"}}>
                            <QRCodeSVG value={subscriptionURL.toString()} includeMargin={true} size={240} level={'Q'}
                                       className={'rounded-5'}
                                       imageSettings={{
                                           src: SingboxSVG,
                                           height: 240 / 4,
                                           width: 240 / 4,
                                           excavate: false
                                       }}/>
                        </Col>
                    }
                </Row>
                <div className="d-grid">
                    {status === 'loading' ?
                        <Placeholder.Button variant="primary" size="lg"/> :
                        status === 'no-exist-token' ?
                            <Button variant="outline-primary" size="lg" disabled={true}>
                                <i className="bi bi-box-arrow-in-down-right me-2"></i> 直接導入 (需程式支援)
                            </Button> :
                            <a className={"btn btn-lg btn-primary"} href={subscriptionURL.toString()} role="button"
                               target="_blank"
                               rel="noreferrer noopener">
                                <i className="bi bi-box-arrow-in-down-right me-1"></i> 直接導入 (需程式支援)
                            </a>
                    }
                </div>
            </Modal.Body>
            <hr className={"m-0"}/>
            <Modal.Body>
                <span>或複製貼上連結</span>
                {status === 'loading' ?
                    <Placeholder as={'h3'} animation="wave">
                        <Placeholder xs={12} size="lg" className={'rounded'}/>
                    </Placeholder> :
                    <InputGroup hasValidation>
                        <Form.Control readOnly={true} value={subscriptionURL.toString()} isValid={isCopy}
                                      type={hidden ? "password" : "text"}
                                      data-clarity-mask="true"/>
                        <Button onClick={onCopy} variant={isCopy ? "outline-success" : "outline-secondary"}
                                disabled={status === 'no-exist-token'}>
                            <i className="bi bi-clipboard"></i></Button>
                        <Form.Control.Feedback type="valid">已複製</Form.Control.Feedback>
                    </InputGroup>
                }
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setHidden(!hidden)}
                        disabled={status === 'no-exist-token' || status === 'loading'}>
                    {hidden ? <><i className="bi bi-eye me-1"></i> 顯示</> : <><i
                        className="bi bi-eye-slash me-1"></i> 隱藏</>}
                </Button>
                {status === 'no-exist-token' &&
                    <Button variant="primary" onClick={createSubscriptionURL}><i className="bi bi-plus-lg me-1"></i>創建連結</Button>}
                {(status === 'exist-token' || status === 'new-token') &&
                    <Button variant="danger" onClick={createSubscriptionURL}><i
                        className="bi bi-arrow-repeat me-1"></i>創建新連結</Button>
                }
            </Modal.Footer>
        </Modal>
    );
};