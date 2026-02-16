import {API_URL, TOKEN} from "../constants/GlobalVariable";
import {UserProfileType, WeatherDataType} from "../constants/Type";
import {I_WeatherAlert} from "../constants/Interface";

/**
 * Fetch VPN data
 * @param abortController AbortController
 */
export const fetchVPNData = async (abortController: AbortController = new AbortController()) => {
    const res = await fetch(`${API_URL}/vpn`, {
        method: "GET",
        credentials: "include",
        signal: abortController.signal,
        redirect: "error",
        headers: {
            "Cf-Access-Jwt-Assertion": TOKEN,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    if (!res.ok) throw res;
    return await res.json();
}
/**
 * Fetch profile data
 * @param abortController AbortController
 * @returns {Promise<UserProfileType>}
 */
export const fetchProfileData = async (abortController: AbortController = new AbortController()): Promise<UserProfileType> => {
    const res = await fetch(`${API_URL}/auth/userinfo`, {
        method: "GET",
        credentials: "include",
        signal: abortController.signal,
        redirect: "error",
        headers: {
            "Cf-Access-Jwt-Assertion": TOKEN,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    if (!res.ok) throw res;
    return await res.json()
}
/**
 * Fetch weather data
 * @param abortController AbortController
 */
export const fetchWeatherData = async (abortController: AbortController = new AbortController()): Promise<WeatherDataType> => {
    let res = await fetch(`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc`, {
        method: "GET",
        signal: abortController.signal
    })
    if (!res.ok) throw res;
    let data = await res.json();
    const temperature: number = data.temperature.data[1].value;
    const icon: number = data.icon[0];
    const humidity: number = data.humidity.data[0].value;
    const uv_index: number = data.uvindex !== "" ? data.uvindex.data[0].value : 0;

    res = await fetch(`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=tc`, {
        method: "GET",
        signal: abortController.signal
    })
    if (!res.ok) throw res;
    data = Object.values(await res.json());
    const alert: I_WeatherAlert[] = data.filter((item: any) => item.actionCode !== "CANCEL")

    res = await fetch(`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=flw&lang=tc`, {
        method: "GET",
        signal: abortController.signal
    })
    if (!res.ok) throw res;
    const weatherReport = await res.json();

    return {temperature, icon, alert, humidity, weatherReport, uv_index}

}

/**
 * Fetch VM data from API
 * @param vm_id VM id
 * @param abortController AbortController
 * @param patch update data or not
 * @deprecated Not used anymore
 */
// export const fetchVMData = async (vm_id: string, abortController: AbortController = new AbortController(), patch = false) => {
//     const res = await fetch(API_URL + "/vpn/" + vm_id, {
//         method: patch ? "PATCH" : "GET",
//         credentials: "include",
//         signal: abortController.signal,
//         redirect: "error",
//         headers: {
//             "Cf-Access-Jwt-Assertion": TOKEN,
//             'X-Requested-With': 'XMLHttpRequest'
//         }
//     });
//     if (!res.ok) throw res;
//     return await res.json();
// }