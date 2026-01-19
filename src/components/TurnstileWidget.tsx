import {Turnstile, TurnstileInstance} from '@marsidev/react-turnstile';
import {Col, Row} from "react-bootstrap";
import React, {useCallback, useRef} from "react";
import {TurnstileContext} from "../hook/Turnstile";
import {TurnstileWidgetProps} from "../constants/Type";
import {NODE_ENV} from "../constants/GlobalVariable";

/**
 * 提供 Turnstile 驗證流程的 Context Provider。
 * - 負責顯示 Turnstile 視窗並執行驗證。
 * - 透過 Context 將 `execute` 方法暴露給子層。
 */
export const TurnstileWidgetProvider: React.FC<React.PropsWithChildren<TurnstileWidgetProps>> = (props) => {
    const [display, setDisplay] = React.useState<boolean>(false);
    const ref = useRef<TurnstileInstance>();

    /**
     * 觸發 Turnstile 驗證，返回 token。
     * @returns Promise<string> 驗證成功的 token。
     * @throws Error 當 ref 尚未就緒時拋出錯誤。
     */
    const execute = useCallback(() => {
        return new Promise<string>((resolve, reject) => {
            if (ref.current) {
                setDisplay(true);
                ref.current.reset();
                ref.current.getResponsePromise().then((token) => {
                    setDisplay(false);
                    resolve(token);
                }).catch((error) => {
                    setDisplay(false);
                    reject(error);
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
                            {NODE_ENV !== "development" &&
                                <Turnstile ref={ref} {...props} siteKey={process.env.REACT_APP_TURNSTILE_KEY}
                                           children={undefined}/>}
                        </Row>
                    </Col>
                </Row>
            </div>
            <TurnstileContext.Provider value={execute}>
                <div style={{filter: display ? 'blur(20px)' : undefined}} className="turnstile-content">
                    {props.children}
                </div>
            </TurnstileContext.Provider>
        </>
    );
};
