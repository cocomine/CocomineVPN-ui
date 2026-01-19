import React, {useEffect, useRef, useState} from "react";
import {Col, Row} from "react-bootstrap";
import Lottie from "lottie-react";

/**
 * Loading screen
 * @param display display or not
 * @constructor
 */
const LoadingScreen: React.FC<{ display: boolean }> = ({display}) => {
    const [displayStat, setDisplayStat] = useState(0);
    const [moveBar, setMoveBar] = useState([<div key="startup-left" className="move-bar-left disabled">
        <div/>
        <div/>
        <div/>
        <div/>
        <div/>
    </div>, <div key="initial-right" className="move-bar-right">
        <div/>
        <div/>
        <div/>
        <div/>
        <div/>
    </div>]);
    const countRef = useRef(0);

    // Handle display changes
    useEffect(() => {
        if (!display) {
            setDisplayStat(1);
            setTimeout(() => {
                setDisplayStat(2);
                setMoveBar([<div key="initial-right" className="move-bar-right">
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                </div>]);
                countRef.current = 0;
            }, 1000);
        } else {
            setDisplayStat(0);
        }
    }, [display]);

    useEffect(() => {
        if (!display) return;

        const interval = setInterval(() => {
            const key = Date.now();
            const currentCount = countRef.current;
            countRef.current = (currentCount + 1) % 2;

            setMoveBar(prevState => {
                const newState = [...prevState];

                // Add new move bar
                if (currentCount === 0) {
                    newState.push(<div className="move-bar-left" key={key}>
                        <div/>
                        <div/>
                        <div/>
                        <div/>
                        <div/>
                    </div>);
                } else {
                    newState.push(<div className="move-bar-right" key={key}>
                        <div/>
                        <div/>
                        <div/>
                        <div/>
                        <div/>
                    </div>);
                }

                // Keep only the last 4 screen
                if (newState.length > 4) {
                    newState.shift();
                }

                return newState;
            });
        }, 1500);

        return () => {
            clearInterval(interval);
        };
    }, [display]);

    if (displayStat === 2) return null;
    return (
        <div className="loading-screen"
             style={{opacity: displayStat !== 0 ? 0 : 1}}>
            {moveBar}
            <Row className="loading-screen-text justify-content-center align-items-center g-1">
                <Col>
                    <Lottie animationData={require("../assets/loading.json")}
                            style={{width: "70px", height: "70px", display: 'inline-block'}}/>
                </Col>
                <Col>
                    <h1>Loading...</h1>
                </Col>
            </Row>
        </div>
    );
};
export {LoadingScreen};