import React, {useCallback, useEffect, useMemo, useState} from "react";
import {SingboxProfile} from "../../../constants/Interface";
import {Alert, Button, Card, Col, Form, InputGroup, Modal, Placeholder, Row} from "react-bootstrap";
import {QRCodeSVG} from "qrcode.react";
import {BlockerFunction, useBlocker, useNavigate, useOutletContext} from "react-router-dom";
import {IndividualProfileContextType} from "../../../constants/Type";
import {toast} from "react-toastify";
import {API_URL} from "../../../constants/GlobalVariable";
import {useTurnstile} from "../../../hook/Turnstile";
import {toastHttpError} from "../../../components/ToastHttpError";
import {useUserProfile} from "../../../hook/UserProfileContext";

/**
 * Shadowrocket profile component
 *
 * This component renders and manages the Shadowrocket subscription/profile, including QR code display,
 * subscription link handling, and related status messages.
 */
export const Shadowrocket: React.FC = () => {
    const {data} = useOutletContext<IndividualProfileContextType>();
    const [profile, setProfile] = useState<SingboxProfile | null>(null);
    const [show, setShow] = useState(true);
    const [isCopy, setIsCopy] = useState(false);
    const [subURL, setSubURL] = useState<URL>(new URL('sub://' + 'x'.repeat(100)));
    const [status, setStatus] = useState<'loading' | 'no-exist-token' | 'exist-token' | 'new-token' | 'error'>('loading');
    const [hidden, setHidden] = useState(true);
    const [confirm, setConfirm] = useState(false);
    const execute = useTurnstile();
    const navigate = useNavigate();
    const userProfile = useUserProfile();

    // generate information alert based on status
    const information = useMemo(() => {
        const msg = [];
        if (status === 'no-exist-token') {
            msg.push(<Alert variant={"warning"} key={0}>你未創建Sing-box訂閱連結, 請先創建訂閱連結</Alert>);
        }
        if (status === 'new-token') {
            msg.push(<Alert variant={"success"} key={1}>成功創建Sing-box訂閱連結, 連結有效期為90天</Alert>);
        }
        if (status === 'exist-token' || status === 'new-token') {
            msg.push(<Alert variant={"info"} key={2}>此訂閱連結已包含所有節點,毋須逐個節點匯入</Alert>);
        }
        if (status === 'error') {
            msg.push(<Alert variant={"danger"} key={3}>發生錯誤! 請重新嘗試</Alert>);
        }
        return msg;
    }, [status]);

    // set profile data
    useEffect(() => {
        const tmp = data.find((item) => item.type === 'sing-box');
        if (!tmp) {
            // This should never happen, but just in case
            // redirect to profile page and show error message
            console.error("No Shadowrocket profile found in data");
            toast.error("節點不提供Shadowrocket設定檔");
            navigate('..', {replace: true});
            return;
        }
        setProfile(tmp as SingboxProfile);
    }, [data, navigate]);

    // fetch subscription fetch
    useEffect(() => {
        const controller = new AbortController();

        // fetch subscription URL, if 403 with cf-mitigated:challenge, trigger turnstile verification and retry
        const fetchURL = async () => {
            try {
                const response = await fetch(API_URL + '/vpn/sub', {
                    method: 'GET',
                    credentials: 'include',
                    signal: controller.signal,
                });
                if (response.ok) {
                    if (response.status === 200) {
                        const res = await response.json();
                        const token = res.data.token;

                        const url = new URL("sub://" + btoa(API_URL + '/vpn/sub/' + token));
                        url.hash = `CocomineVPN(${userProfile?.name ?? userProfile?.custom?.name ?? ""})`;
                        setSubURL(url);
                        setStatus('exist-token');
                    }
                    if (response.status === 204) {
                        setStatus('no-exist-token');
                    }
                } else {
                    //handle turnstile challenge
                    if (response.status === 403 && response.headers.has('cf-mitigated') && response.headers.get('cf-mitigated') === 'challenge') {
                        try {
                            await execute(controller.signal);
                            await fetchURL();
                        } catch (e: any) {
                            if (e.name === 'AbortError') {
                                return;
                            }

                            console.error(e);
                            toast.error("未通過驗證! 請重新嘗試!");
                            setStatus('error');
                        }
                        return;
                    }
                    setStatus('error');
                    toastHttpError(response.status); // other errors
                    return;
                }
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    return;
                }

                console.error(e);
                setStatus('error');
                toastHttpError(0);
                return;
            }
        };
        fetchURL().then();

        return () => {
            controller.abort();
        };
    }, [execute, userProfile?.name, userProfile?.custom?.name]);

    // set title
    useEffect(() => {
        document.title = (profile?.name ?? "") + " (Shadowrocket) - Cocomine VPN";
    }, [profile?.name]);

    // block navigation when modal is open
    const shouldBlock = useCallback<BlockerFunction>(({currentLocation}) => {
        if (currentLocation.pathname.toLowerCase().endsWith('/shadowrocket')) {
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
    const onCopySingbox = useCallback(async () => {
        await navigator.clipboard.writeText(subURL.toString());
        setIsCopy(true);

        setTimeout(() => {
            setIsCopy(false);
        }, 2000);
    }, [subURL]);

    // create new subscription URL, if token already exists, it will be replaced by new one
    const createSubscriptionURL = useCallback(async () => {
        setConfirm(false);
        setStatus('loading');

        const createURL = async () => {
            try {
                const response = await fetch(API_URL + '/vpn/sub', {
                    method: 'POST',
                    credentials: 'include',
                });
                if (response.ok) {
                    const res = await response.json();
                    const token = res.data.token;

                    const url = new URL("sub://" + btoa(API_URL + '/vpn/sub/' + token));
                    url.hash = `CocomineVPN(${userProfile?.name ?? userProfile?.custom?.name ?? ""})`;
                    setSubURL(url);
                    setStatus('new-token');
                } else {
                    //handle turnstile challenge
                    if (response.status === 403 && response.headers.has('cf-mitigated') && response.headers.get('cf-mitigated') === 'challenge') {
                        try {
                            await execute();
                            await createURL();
                        } catch (e: any) {
                            console.error(e);
                            toast.error("未通過驗證! 請重新嘗試!");
                            setStatus('error');
                        }
                        return;
                    }
                    toastHttpError(response.status);
                    setStatus('error');
                }
            } catch (e: any) {
                console.error(e);
                toastHttpError(0);
                setStatus('error');
            }
        };
        await createURL();
    }, [execute, userProfile?.custom?.name, userProfile?.name]);

    // recreate subscription URL, show confirmation modal first
    const recreateSubscriptionURL = useCallback(async () => {
        setConfirm(true);
    }, []);

    return (
        <>
            <Modal show={show && !confirm} onHide={() => navigate('..', {replace: true})}>
                <Modal.Header closeButton>
                    <Modal.Title>{profile?.name ?? ""} (Shadowrocket)</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {information}
                    <Card>
                        <Card.Body>
                            <Card.Text>
                                <Row className="justify-content-center mb-3">
                                    <Col xs={12}><span>掃描以下QR code</span></Col>
                                    {status === 'loading' ?
                                        <Col xs={"auto"}>
                                            <Placeholder as={'div'} animation="glow"
                                                         style={{width: 240, height: 240}}>
                                                <Placeholder xs={12} className="flag"/>
                                            </Placeholder>
                                        </Col> :
                                        <Col xs={"auto"} data-clarity-mask="true"
                                             style={{filter: hidden ? "blur(10px)" : "none"}}>
                                            <QRCodeSVG value={subURL.toString()} includeMargin={true}
                                                       size={240}
                                                       level={'Q'}
                                                       className={'rounded-5'}
                                                       imageSettings={{
                                                           src: require('../../../assets/images/webp/shadowrocket.webp'),
                                                           height: 240 / 4,
                                                           width: 240 / 4,
                                                           excavate: true
                                                       }}/>
                                        </Col>
                                    }
                                </Row>
                                <div className={'mb-3'}>
                                    <span>或複製貼上連結</span>
                                    {status === 'loading' ?
                                        <Placeholder as={'h3'} animation="wave">
                                            <Placeholder xs={12} size="lg" className={'rounded'}/>
                                        </Placeholder> :
                                        <InputGroup hasValidation>
                                            <Form.Control readOnly={true} value={subURL.toString()}
                                                          isValid={isCopy}
                                                          type={hidden ? "password" : "text"}
                                                          data-clarity-mask="true"/>
                                            <Button onClick={onCopySingbox}
                                                    variant={isCopy ? "outline-success" : "outline-secondary"}
                                                    disabled={status === 'no-exist-token'}>
                                                <i className="bi bi-clipboard"></i></Button>
                                            <Form.Control.Feedback type="valid">已複製</Form.Control.Feedback>
                                        </InputGroup>
                                    }
                                </div>
                                <div className="d-grid">
                                    {status === 'loading' ?
                                        <Placeholder.Button variant="primary" size="lg"/> :
                                        (status === 'no-exist-token' || status === 'error' ?
                                                <Button variant="outline-primary" size="lg" disabled={true}
                                                        className={'rounded-5'}>
                                                    <i className="bi bi-box-arrow-in-down-right me-2"></i> 或直接導入
                                                    (需程式支援)
                                                </Button> :
                                                <a className={"btn btn-lg btn-primary rounded-5"}
                                                   href={subURL.toString()}
                                                   role="button"
                                                   target="_blank"
                                                   rel="noreferrer noopener">
                                                    <i className="bi bi-box-arrow-in-down-right me-1"></i> 或直接導入
                                                    (需程式支援)
                                                </a>
                                        )
                                    }
                                </div>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setHidden(!hidden)}
                            disabled={status === 'no-exist-token' || status === 'loading' || status === 'error'}>
                        {hidden ? <><i className="bi bi-eye me-1"></i> 顯示</> : <><i
                            className="bi bi-eye-slash me-1"></i> 隱藏</>}
                    </Button>
                    {status === 'no-exist-token' &&
                        <Button variant="primary" onClick={createSubscriptionURL}><i className="bi bi-plus-lg me-1"></i>創建連結</Button>}
                    {(status === 'exist-token' || status === 'new-token') &&
                        <Button variant="danger" onClick={recreateSubscriptionURL}><i
                            className="bi bi-arrow-repeat me-1"></i>創建新連結</Button>
                    }
                </Modal.Footer>
            </Modal>
            <Modal show={confirm} onHide={() => navigate('..', {replace: true})} centered backdrop={'static'}>
                <Modal.Header><Modal.Title>確定?</Modal.Title></Modal.Header>
                <Modal.Body>
                    確定要重新創建訂閱連結嗎? 舊連結將立即失效!
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setConfirm(false)}><i
                        className="bi bi-arrow-left me-1"></i>取消</Button>
                    <Button variant="danger" onClick={createSubscriptionURL}><i
                        className="bi bi-check2 me-1"></i>確定</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};