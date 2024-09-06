import React, {useCallback, useMemo, useState} from "react";
import {isRouteErrorResponse, useRouteError} from "react-router-dom";
import {Button, Col, Row, Spinner} from "react-bootstrap";
import Lottie from "lottie-react";

import {NetworkError} from "../hook/NetworkError";

/**
 * Error screen
 * @constructor
 */
const ErrorScreen: React.FC = () => {
    const error = useRouteError();
    const [status, setStatus] = useState(0);
    const error_Elm = useMemo(() => {
        console.error(error)
        if (isRouteErrorResponse(error)) {
            setStatus(error.status)
            switch (error.status) {
                case 400:
                    return (<>
                        <h1>400</h1>
                        <Row className="justify-content-center">
                            <Lottie animationData={require("../assets/400.json")}
                                    style={{width: "400px", height: "300px"}}/>
                        </Row>
                        <p>你給的資料我不明白 你肯定沒有錯?</p>
                    </>);
                case 404:
                    return (<>
                        <h1>404</h1>
                        <Row className="justify-content-center">
                            <Lottie animationData={require("../assets/404.json")}
                                    style={{width: "500px", height: "250px"}}/>
                        </Row>
                        <p>這裡不存在任何東西! 你確定去對地方了?</p>
                    </>);
                case 403:
                    return (<>
                        <h1>403</h1>
                        <Row className="justify-content-center">
                            <Lottie animationData={require("../assets/403.json")}
                                    style={{width: "400px", height: "300px"}}/>
                        </Row>
                        <p>你不可以看這個東西!</p>
                    </>);
                case 401:
                    return (<>
                        <h1>401</h1>
                        <Row className="justify-content-center">
                            <Lottie animationData={require("../assets/400.json")}
                                    style={{width: "400px", height: "300px"}}/>
                        </Row>
                        <p>你被登出了! 你需要再一次登入!!</p>
                    </>);
                case 500:
                    return (<>
                        <h1>500</h1>
                        <Row className="justify-content-center">
                            <Lottie animationData={require("../assets/500.json")}
                                    style={{width: "300px", height: "300px"}}/>
                        </Row>
                        <p>我出現問題了! 稍後再試一試</p>
                    </>);
                case 408:
                case 504:
                    return (<>
                        <h1>504</h1>
                        <Row className="justify-content-center">
                            <Lottie animationData={require("../assets/500.json")}
                                    style={{width: "300px", height: "300px"}}/>
                        </Row>
                        <p>網絡出現問題! 檢查一下</p>
                    </>);
                case 523:
                case 502:
                    return (<>
                        <h1>502</h1>
                        <Row className="justify-content-center">
                            <Lottie animationData={require("../assets/500.json")}
                                    style={{width: "300px", height: "300px"}}/>
                        </Row>
                        <p>網頁正在維護中! 稍後再試一試</p>
                    </>);
            }
        }
        if (error instanceof NetworkError) {
            return (<>
                <h1>網絡出現問題!</h1>
                <Row className="justify-content-center">
                    <Lottie animationData={require("../assets/500.json")}
                            style={{width: "300px", height: "300px"}}/>
                </Row>
                <p>網絡出現問題! 檢查一下</p>
            </>)
        }
        return (<>
            <h1>出事啦!</h1>
            <Row className="justify-content-center">
                <Lottie animationData={require("../assets/403.json")}
                        style={{width: "400px", height: "300px"}}/>
            </Row>
            <p>發生了一些不能遇見的錯誤! 不如再試一試?</p>
        </>)
    }, [error]);
    const [loading, setLoading] = useState(false);

    const loginCallback = useCallback(() => {
        setLoading(true)
        sessionStorage.setItem('redirect', window.location.pathname)
        window.location.replace("/login")
    }, []);

    return (
        <div className="error-screen">
            <Row className="h-100 justify-content-center align-content-center">
                <Col xs={12} className="text-center">
                    {error_Elm}
                </Col>
                {((status === 401) || (status === 403) || (status === 400)) ?
                    <Col xs={12} className="text-center">
                        <Button variant="primary" className="rounded-5" onClick={loginCallback} disabled={loading}>
                            {loading ? <><Spinner animation="grow" size="sm" className="me-2"/>
                                <span>Loading...</span></> : "點我 重新登入"}
                        </Button>
                    </Col>
                    : (status === 404 ?
                            <Col xs={12} className="text-center">
                                <Button variant="primary" className="rounded-5"
                                        onClick={() => window.location.href = "/"}>
                                    點我 回到首頁
                                </Button>
                            </Col>
                            : <Col xs={12} className="text-center">
                                <Button variant="primary" className="rounded-5"
                                        onClick={() => window.location.reload()}>
                                    點我 重新載入
                                </Button>
                            </Col>
                    )
                }
            </Row>
            <audio autoPlay>
                <source src={require('../assets/sounds/Error.mp3')} type="audio/mpeg"/>
            </audio>
        </div>
    );
}
export {ErrorScreen};