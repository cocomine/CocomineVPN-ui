import React, {CSSProperties, useEffect, useMemo, useState} from 'react';
import './App.scss';
import {Col, Container, Row} from "react-bootstrap";
import {Menu} from "./Menu";
import loading from "./assets/loading.svg";
import {ToastContainer} from "react-toastify";
import {isRouteErrorResponse, Outlet, useNavigation, useRouteError} from "react-router-dom";

const API_URL = "https://api.cocomine.cc"

function App() {
    const navigation = useNavigation();

    return (
        <>
            <Container className="content h-100" data-bs-theme="dark">
                <Menu />
            </Container>
            <Bubbles/>
            <AnimeBackground/>
            <LoadingScreen display={navigation.state === "loading"}/>
            <ToastContainer position="bottom-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="colored"/>
            <Outlet />
        </>
    );
}

const ErrorScreen: React.FC = () => {
    const error = useRouteError();
    const error_Elm = useMemo(() => {
        if (isRouteErrorResponse(error)) {
            if (error.status === 400) {
                return (<><h1>404</h1><p>你給的資料我不明白 你肯定沒有錯?</p></>)
            }
            if (error.status === 404) {
                return (<><h1>404</h1><p>這裡不存在任何東西! 你確定去對地方了?</p></>)
            }
            if (error.status === 403) {
                return (<><h1>403</h1><p>你不可以看這個東西!</p></>)
            }
            if (error.status === 401) {
                return (<><h1>401</h1><p>我不知道你是誰 你能告訴我嗎!</p></>)
            }
            if (error.status === 500) {
                return (<><h1>500</h1><p>我出現問題了! 稍後再試一試</p></>)
            }
            if (error.status === 504) {
                return (<><h1>504</h1><p>網絡出現問題! 檢查一下</p></>)
            }
            if (error.status === 502) {
                return (<><h1>502</h1><p>太多人了! 稍後再試一試</p></>)
            }
        }
        return (<><h1>出事啦!</h1><p>發生了一些不能遇見的錯誤! 不如再試一試?</p></>)
    }, [error]);
    console.log(error)

    return (
        <div className="error-screen">
            <Row className="h-100 justify-content-center align-items-center">
                <Col xs={12} className="text-center">
                    {error_Elm}
                </Col>
            </Row>
        </div>
    );
}

const AnimeBackground: React.FC = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((r) => (r + 1) % 3);
        }, 20000);
        return () => clearInterval(id);
    }, [])

    return (
        <div className="anime-background">
            <div className="anime-background-img img1" style={{opacity: index === 0 ? 1 : 0}}></div>
            <div className="anime-background-img img2" style={{opacity: index === 1 ? 1 : 0}}></div>
            <div className="anime-background-img img3" style={{opacity: index === 2 ? 1 : 0}}></div>
        </div>
    )
}

const Bubbles: React.FC = () => {
    const count = 20;

    return (
        <div className="bubbles">
            {Array.from(Array(count).keys()).map((_, i) => <Bubble key={i} delay={i}/>)}
        </div>
    )
}

const Bubble: React.FC<{ delay: number }> = ({delay}) => {
    const [isClicked, setIsClicked] = useState(0);
    const defaultStyle = useMemo(() => ({
        "--bubble-left-offset": `${(Math.random() * 100).toFixed(0)}%`,
        "--bubble-size": `${(Math.random() * 150 + 10).toFixed(0)}px`,
        "--bubble-float-duration": `${(Math.random() * 10 + 10).toFixed(0)}s`,
        "--bubble-float-delay": `${delay}s`,
        "--bubble-sway-type": Math.random() > 0.5 ? "sway-left-to-right" : "sway-right-to-left",
        "--bubble-sway-duration": `${(Math.random() * 6 + 4).toFixed(0)}s`,
        "--bubble-sway-delay": `${(Math.random() * 5).toFixed(0)}s`,
    } as CSSProperties), [delay]);
    const style = useMemo(() => ({
        ...defaultStyle,
        opacity: isClicked === 1 ? 0 : 1,
    }) as CSSProperties, [defaultStyle, isClicked]);

    // disappear animation
    useEffect(() => {
        if (isClicked === 1) {
            setTimeout(() => setIsClicked(2), 500);
        }
    }, [isClicked]);

    if (isClicked === 2) return null; //disappear
    return (
        <div className="bubble" style={style} onClick={() => setIsClicked(1)}></div>
    )
}

const LoadingScreen: React.FC<{ display: boolean }> = ({display}) => {
    const [displayStat, setDisplayStat] = useState(0);

    useEffect(() => {
        if (!display) {
            setDisplayStat(1);
            setTimeout(() => setDisplayStat(2), 500);
        } else {
            setDisplayStat(0);
        }
    }, [display]);

    return (
        <div className="loading-screen" style={{opacity: displayStat !== 0 ? 0 : 1, display: displayStat === 2 ? "none" : undefined}}>
            <Row className="h-100 justify-content-center align-items-center">
                <Col xs={12} className="text-center">
                    <img src={loading} alt="Loading..."/>
                    <div>Loading...</div>
                </Col>
            </Row>
        </div>
    )
}

export default App;
export {API_URL, ErrorScreen};
