import React, {useEffect} from 'react';
import './App.scss';
import {Container} from "react-bootstrap";
import {Menu} from "./(Menu)";
import {ToastContainer} from "react-toastify";
import {useLoaderData, useLocation, useNavigation, useRevalidator} from "react-router-dom";
import {LoadingScreen} from "../components/LoadingScreen";
import {UserProfileType, WeatherDataType} from "../constants/Type";
import {fetchProfileData, fetchVPNData, fetchWeatherData} from "../hook/Loader";
import ReactGA from "react-ga4";
import {GTAG_TAG_ID} from "../constants/GlobalVariable";


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
    const navigation = useNavigation();
    let revalidator = useRevalidator();
    const location = useLocation();
    const {VMData, userProfile, WeatherData} = useLoaderData() as {
        VMData: any,
        userProfile: UserProfileType,
        WeatherData: WeatherDataType
    };

    useEffect(() => {

    }, []);

    // set title
    useEffect(() => {
        if (location.pathname === "/") document.title = "Home - Cocomine VPN"
    }, [location]);

    // tab visibilitychange
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                revalidator.revalidate();
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [revalidator]);

    return (
        <>
            <Container className="content h-100" data-bs-theme="dark">
                <Menu data={VMData} userProfile={userProfile} weatherData={WeatherData}/>
            </Container>
            <LoadingScreen display={navigation.state === "loading"}/>
            <ToastContainer position="bottom-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
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
    const VMData = await fetchVPNData()
    const userProfile = await fetchProfileData();
    const WeatherData = await fetchWeatherData();

    // initialize Google Analytics
    ReactGA.initialize(GTAG_TAG_ID, {
        gaOptions: {
            'userId': userProfile.email,
        }
    });

    console.debug(VMData, userProfile, WeatherData) //debug
    return {
        VMData,
        userProfile,
        WeatherData
    }
}

export default App;
export {loader};

