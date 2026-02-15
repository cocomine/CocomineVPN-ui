import Cookies from "js-cookie";
import {WeatherAlertType} from "./Type";


export const APP_VERSION = "1.17.0";
export const GTAG_TAG_ID = "G-W8JXQWDERZ";
export const TOKEN = Cookies.get('CF_Authorization') ?? ""; // get token from cookie
export const NODE_ENV = process.env.NODE_ENV ?? 'production';
const DEV_API_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:8088';
const PROD_API_URL = process.env.REACT_APP_API_URL ?? 'https://vpn.cocomine.cc/api';
export const API_URL = NODE_ENV === 'development' ? DEV_API_URL : PROD_API_URL; // API URL

// VM processing status
export const PROCESSING_STATUS_TEXT = [
    "PENDING",
    "PROVISIONING",
    "STAGING",
    "STOPPING",
    "SUSPENDING",
    "REPAIRING",
    "starting",
    "stopping",
    "creating",
    "deallocating"
]

// Weather alert types that are considered dangerous
export const DANGER_WEATHER_ALERT: WeatherAlertType[] = ['TC8NE', 'TC8SW', 'TC8NW', 'TC8SE', 'TC9', 'TC10', 'WRAINB', 'WTMW']

NODE_ENV === 'development' ? console.log("Development mode") : console.log("Production mode");
