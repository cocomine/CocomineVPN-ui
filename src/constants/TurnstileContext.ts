import {createContext, useContext} from "react";
import {TurnstileContextType} from "./Type";

/**
 * 預設的 Turnstile 驗證執行函數，當未提供 TurnstileContext 時使用。
 */
const defaultExecute = () =>
    new Promise<string>((_, reject) =>
        reject(new Error("TurnstileContext not provided"))
    );

/**
 * Turnstile 驗證上下文。
 */
export const TurnstileContext = createContext<TurnstileContextType>(defaultExecute);

/**
 * 使用 Turnstile 驗證上下文的自定義 Hook。
 * @returns TurnstileContextType - Turnstile 驗證執行函數。
 */
export const useTurnstile = (): TurnstileContextType => {
    return useContext(TurnstileContext);
}