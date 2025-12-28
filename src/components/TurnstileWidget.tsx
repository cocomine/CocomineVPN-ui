import {Turnstile, TurnstileInstance, TurnstileProps} from '@marsidev/react-turnstile'
import {Col, Row} from "react-bootstrap";
import React, {useCallback, useRef} from "react";
import {TurnstileContext} from "../constants/TurnstileContext";

type TurnstileWidgetProps = Omit<TurnstileProps, "siteKey">;

export const TurnstileWidgetProvider: React.FC<React.PropsWithChildren<TurnstileWidgetProps>> = (props) => {
    const [display, setDisplay] = React.useState<boolean>(false);
    const ref = useRef<TurnstileInstance>();

    const execute = useCallback(() => {
        return new Promise<string>((resolve, reject) => {
            setDisplay(true);
            if (ref && ref.current) {
                ref.current.reset();
                ref.current.getResponsePromise().then((token) => {
                    resolve(token);
                }).catch((error) => {
                    reject(error);
                }).finally(() => {
                    setDisplay(false);
                });
            } else {
                reject(new Error("Turnstile ref is not available"));
            }
        });
    }, []);

    return (
        <>
            <div className="turnstile-screen" style={{display: display ? undefined : 'none'}}>
                <Row className="h-100 justify-content-center align-content-center">
                    <Col xs={12} className="text-center">
                        <h1>確認你不是機械人</h1>
                        <p>輕輕點一下下面的驗證，證明你是活力滿滿的小夥伴!</p>
                        <Row className="justify-content-center">
                            <Turnstile ref={ref} {...props} siteKey='0x4AAAAAACJZcbwcsCxDsvKa' children={undefined}/>
                        </Row>
                    </Col>
                </Row>
            </div>
            <TurnstileContext.Provider value={execute}>
                {props.children}
            </TurnstileContext.Provider>
        </>
    )
};
