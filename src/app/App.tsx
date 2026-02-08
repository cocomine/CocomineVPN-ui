import React, {useEffect, useState} from 'react';
import './App.scss';
import {Alert, Container} from "react-bootstrap";
import {Menu} from "./(Menu)";
import {cssTransition, ToastContainer} from "react-toastify";
import {useLoaderData, useLocation, useNavigation, useRevalidator} from "react-router-dom";
import {LoadingScreen} from "../components/LoadingScreen";
import {UserProfileType, VMDataType, WeatherDataType, WebSocketDataType} from "../constants/Type";
import {fetchProfileData, fetchVPNData, fetchWeatherData} from "../hook/Loader";
import ReactGA from "react-ga4";
import {GTAG_TAG_ID} from "../constants/GlobalVariable";
import {clarity} from "react-microsoft-clarity";
import {VMDataContext} from "../constants/VMDataContext";
import useWebSocket from "../hook/useWebSocks";
import {setUser as sentrySetUser} from "@sentry/react";

// slide transition for toastify
const Slide = cssTransition({
    enter: "slide-top",
    exit: "slide-bottom",
    collapse: false,
    collapseDuration: 600,
});

/**
 * App component
 *
 * This component serves as the main application component. It sets the document title based on the current route,
 * revalidates data when the tab becomes visible, and renders the main content including the menu, animations,
 * loading screen, and toast notifications.
 *
 * Path: /
 */
function App() {
    const websocket = useWebSocket();
    const navigation = useNavigation();
    let revalidator = useRevalidator();
    const location = useLocation();
    const {data, userProfile, WeatherData} = useLoaderData() as {
        data: VMDataType,
        userProfile: UserProfileType,
        WeatherData: WeatherDataType
    };
    const [wsDisconnected, setWsDisconnected] = React.useState<boolean>(false);
    const [vm_data, setVMData] = useState<VMDataType>(data);

    // set title
    useEffect(() => {
        if (location.pathname === "/") document.title = "Home - Cocomine VPN";
        clarity.identify(userProfile.email, {
            'custom-session-id': Math.floor(Math.random() * (999999 + 1)),
            "custom-page-id": location.key,
            "friendly-name": userProfile.name ?? 'N/A'
        });
    }, [location, userProfile]);

    // tab visibilitychange
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                revalidator.revalidate();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [revalidator]);

    //websocket event listener for updating VM data
    useEffect(() => {
        if (websocket === null) {
            setWsDisconnected(true);
            return;
        }

        // websocket message handler
        const handleMessage = (event: MessageEvent<string>) => {
            const web_socket_data: WebSocketDataType = JSON.parse(event.data);

            // VM data update
            if (web_socket_data.url === "/vpn/vm") {
                console.debug("WebSocket VM Data Update:", web_socket_data.data);
                setVMData((prev) => {
                    // find and update the VM data, copy to trigger re-render
                    const newVMData = [...prev.data];
                    const index = newVMData.findIndex((vm) => vm._id === web_socket_data.data._id);

                    if (index !== -1) {
                        newVMData[index] = web_socket_data.data;
                    }

                    return {
                        ...prev,
                        data: newVMData
                    };
                });
            }

            if (web_socket_data.url === "/vpn/vm/error") {
                console.debug("WebSocket VM operation fail: ", web_socket_data.data);
                window.postMessage({
                    type: 'VMOperationFail',
                    ask: false,
                    data: web_socket_data.data
                });
            }
        };

        // update VM data when received message from websocket
        websocket.addEventListener('message', handleMessage);
        setWsDisconnected(false);

        // cleanup
        return () => {
            websocket.removeEventListener('message', handleMessage);
        };
    }, [websocket, revalidator]);

    // update VM data when loader data changes
    useEffect(() => {
        setVMData(data);
    }, [data]);

    return (
        <>
            <Alert variant={"warning"} show={wsDisconnected} className="wsDisconnected">
                與伺服器的連線中斷! 正在重新連線...</Alert>
            <Container className="content h-100" data-bs-theme="dark">
                <VMDataContext.Provider value={vm_data}>
                    <Menu userProfile={userProfile} weatherData={WeatherData}/>
                </VMDataContext.Provider>
            </Container>
            <LoadingScreen display={navigation.state === "loading"}/>
            <ToastContainer position="bottom-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            transition={Slide}
                            draggable
                            pauseOnFocusLoss={false}
                            theme="colored"/>
        </>
    );
}

/**
 * Loader for menu
 */
const loader = async () => {
    const data = await fetchVPNData();
    const userProfile = await fetchProfileData();
    const WeatherData = await fetchWeatherData();

    // initialize Google Analytics
    ReactGA.initialize(GTAG_TAG_ID, {
        gaOptions: {
            'userId': userProfile.email,
        }
    });
    clarity.consent(); // consent clarity

    // set user info for Sentry
    sentrySetUser({
        fullName: userProfile.name,
        email: userProfile.email,
    });

    console.debug(data, userProfile, WeatherData); //debug
    return {
        data,
        userProfile,
        WeatherData
    };
};

export default App;
export {loader};

