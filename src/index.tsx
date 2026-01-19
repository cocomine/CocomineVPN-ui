import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App, {loader} from './app/App';
import reportWebVitals from './reportWebVitals';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import VMAction from "./app/[id]";
import figlet from "figlet";
import Download from "./app/download";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import {connectWebsocket} from "./hook/useWebSocks";
import {APP_VERSION} from "./constants/GlobalVariable";
import {ErrorScreen} from "./components/ErrorScreen";
import {LoadingScreen} from "./components/LoadingScreen";
import Profile from "./app/[id]/profile";
import {AnimationBackground} from "./components/AnimationBackground";
import {clarity} from "react-microsoft-clarity";
import {TurnstileWidgetProvider} from "./components/TurnstileWidget";
import * as Sentry from "@sentry/react";
import Troubleshoot from "./app/[id]/troubleshoot";

Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    integrations: [
        Sentry.replayIntegration({
            blockAllMedia: false,
        })
    ],
    // Session Replay
    replaysSessionSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0
});

// create router
const router = createBrowserRouter([
    {
        path: '/',
        element: <App/>,
        loader: loader,
        errorElement: <ErrorScreen/>,
        children: [
            {
                path: ':id',
                element: <VMAction/>,
                children: [
                    {
                        path: 'profile',
                        element: <Profile/>,
                    }, {
                        path: 'troubleshoot',
                        element: <Troubleshoot/>,
                    }
                ]
            },
            {
                path: 'download',
                element: <Download/>,
            },
            {
                path: 'login',
                element: <LoadingScreen display={true}/>,
                loader: async () => {
                    const redirectUrl = sessionStorage.getItem('redirect');
                    sessionStorage.removeItem('redirect');
                    window.location.replace(redirectUrl ? redirectUrl : "/"); // redirect to the original page
                    return null;
                },
            }
        ]
    }
]);

// create root
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

figlet.defaults({fontPath: "/ascii-fonts"});
figlet.text('Cocomine VPN', {
    font: 'ANSI Shadow',
    horizontalLayout: 'full',
    verticalLayout: 'full',
    width: 80,
    whitespaceBreak: true
}, function (err, data) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(data);
    console.log(APP_VERSION);
});

clarity.init('okh6uy1ksy'); // init clarity

connectWebsocket(); // connect websocket

// render app
root.render(
    <React.StrictMode>
        <TurnstileWidgetProvider>
            <RouterProvider router={router} fallbackElement={<LoadingScreen display={true}/>}/>
            {webgl_support() ?
                <iframe title="background" src="https://cocomine.github.io/threejs-earth-background/"
                        className="iframe-background"/>
                : <>
                    <AnimationBackground/>
                </>
            }
        </TurnstileWidgetProvider>
    </React.StrictMode>
);

/**
 * Check if WebGL is supported
 * @Link https://stackoverflow.com/questions/11871077/proper-way-to-detect-webgl-support
 */
function webgl_support() {
    try {
        const canvas = document.createElement('canvas');
        return !!window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
        return false;
    }
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();