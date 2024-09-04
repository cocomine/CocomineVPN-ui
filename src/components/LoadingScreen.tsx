import React, {useEffect, useState} from "react";
import {Col, Row} from "react-bootstrap";
import loading from "../assets/loading.svg";

/**
 * Loading screen
 * @param display display or not
 * @constructor
 */
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
        <div className="loading-screen"
             style={{opacity: displayStat !== 0 ? 0 : 1, display: displayStat === 2 ? "none" : undefined}}>
            <Row className="h-100 justify-content-center align-items-center">
                <Col xs={12} className="text-center">
                    <img src={loading} alt="Loading..."/>
                    <div>Loading...</div>
                </Col>
            </Row>
        </div>
    )
}
export {LoadingScreen};