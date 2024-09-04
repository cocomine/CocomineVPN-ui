import {I_StatusUpdateCallback, I_WeatherAlert} from "./Interface";

/**
 * Type definition for the context.
 *
 * @typedef {Object} ContextType
 * @property {I_StatusUpdateCallback} statusUpdateCallback - The status update callback function.
 */
export type ContextType = {
    statusUpdateCallback: I_StatusUpdateCallback
}
/**
 * Type definition for the country.
 */
export type VMCountryType = "TW" | "JP" | "US" | "HK" | "UK" | string
/**
 * Type definition for the provider.
 * @typedef {("google" | "azure")} VMProviderType
 */
export type VMProviderType = "google" | "azure"
/**
 * Type definition for the profile.
 * @typedef {Object} VPNProfileType
 * @property {("OpenVPN" | "SoftEther" | "SS")} type - The type of the profile.
 * @property {string} name - The name of the profile.
 * @property {string} filename - The filename of the profile.
 * @property {string} [url] - The url of the profile.
 */
export type VPNProfileType = {
    "type": "OpenVPN" | "SoftEther" | "SS" | "socks5",
    "name": string,
    "filename": string
    "url"?: string
}
/**
 * Type definition for the read only mode.
 * @typedef {("startOnly" | "stopOnly" | "readOnly" | "disable")} ReadOnlyModeType
 */
export type ReadOnlyModeType = "startOnly" | "stopOnly" | "readOnly" | "disable"
/**
 * Type definition for the VM data.
 * @typedef {Object} VMDataType
 * @property {string} _name - The name of the VM.
 * @property {string} _status - The status of the VM.
 * @property {string} _id - The id of the VM.
 * @property {string} _zone - The zone of the VM.
 * @property {string} _url - The url of the VM.
 * @property {VMCountryType} _country - The country of the VM.
 * @property {VPNProfileType[]} _profiles - The profiles of the VM.
 * @property {VMProviderType} _provider - The provider of the VM.
 * @property {boolean} _isPowerOn - The power status of the VM.
 * @property {ReadOnlyModeType} _readonly - The read only mode of the VM.
 */
export type VMDataType = {
    readonly _name: string;
    _status: string;
    readonly _id: string;
    readonly _zone: string;
    readonly _url: string
    readonly _country: VMCountryType
    readonly _profiles: VPNProfileType[]
    readonly _provider: VMProviderType
    _isPowerOn: boolean
    readonly _readonly: ReadOnlyModeType,
    _expired: string | null
}
/**
 * Type definition for the user profile.
 * @typedef {Object} UserProfileType
 * @property {string} email - The email of the user.
 * @property {string} username - The username of the user.
 * @property {string} ip - The ip of the user.
 */
export type UserProfileType = {
    email: string;
    name: string;
    ip: string;
}
/**
 * Type definition for the weather alert type.
 */
export type WeatherAlertType =
    "TC1" |
    "TC10" |
    "TC3" |
    "TC8NE" |
    "TC8NW" |
    "TC8SE" |
    "TC8SW" |
    "TC9" |
    "WCOLD" |
    "WFIRER" |
    "WFIREY" |
    "WFNTSA" |
    "WFROST" |
    "WHOT" |
    "WL" |
    "WMSGNL" |
    "WRAINA" |
    "WRAINB" |
    "WRAINR" |
    "WTMW" |
    "WTS"
/**
 * Type definition for the weather data.
 */
export type WeatherDataType = {
    temperature: number,
    icon: number,
    alert: I_WeatherAlert[],
    humidity: number,
    uv_index: number
    weatherReport: {
        forecastDesc: string,
        outlook: string,
        generalSituation: string,
        tcInfo: string | "",
        fireDangerWarning: string | "",
    }
}
/**
 * Type definition for the alert memo.
 */
export type AlertMemoType = [any, WeatherAlertType][]
/**
 * Type definition for the websocket data.
 */
export type WebSocketDataType = {
    url: string,
    data: any,
}