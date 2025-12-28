/// <reference types="react-scripts" />
declare namespace NodeJS {
    interface ProcessEnv extends NodeJS.ProcessEnv {
        // Add your custom variables here
        readonly REACT_APP_TURNSTILE_KEY: string;
        readonly REACT_APP_SENTRY_DSN: string;
    }
}