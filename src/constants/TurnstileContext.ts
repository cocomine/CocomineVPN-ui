import {createContext, useContext} from "react";

type TurnstileContextType = () => Promise<string>;

const defaultExecute = () =>
    new Promise<string>((_, reject) =>
        reject(new Error("TurnstileContext not provided"))
    );

export const TurnstileContext = createContext<TurnstileContextType>(defaultExecute);

export const useTurnstile = (): TurnstileContextType => {
    return useContext(TurnstileContext);
}