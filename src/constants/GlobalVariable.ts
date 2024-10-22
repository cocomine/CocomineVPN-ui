import Cookies from "js-cookie";


export const APP_VERSION = "1.13.4";
export const TOKEN = Cookies.get('CF_Authorization') ?? ""; // get token from cookie
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const API_URL = NODE_ENV === 'development' ? 'http://192.168.0.102:8088' : 'https://vpn.cocomine.cc/api'; // API URL


NODE_ENV === 'development' ? console.log("Development mode") : console.log("Production mode");