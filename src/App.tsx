import React, {CSSProperties, useEffect, useMemo, useState} from 'react';
import './App.scss';
import {Col, Container, Row} from "react-bootstrap";
import {Menu} from "./ui";
import loading from "./assets/loading.svg";
import {ToastContainer} from "react-toastify";

function App() {
    const [loading, setLoading] = useState(true);

    return (
        <>
            <Container className="content h-100">
                <Menu onLoad={() => setLoading(false)}/>
            </Container>
            <Bubbles/>
            <AnimeBackground/>
            <LoadingScreen display={loading}/>
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
        </>
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

    if (displayStat === 2) return null; // disappear
    return (
        <div className="loading-screen" style={{opacity: displayStat !== 0 ? 0 : 1}}>
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
