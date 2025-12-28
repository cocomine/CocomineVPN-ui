import {
    I_Connect_PostMessageData,
    I_ExtensionInstalled_PostMessageData,
    I_MobileAppInstalled_PostMessageData,
    I_PostVMData_PostMessageData,
    I_StatusUpdateCallback,
    I_VMOperationFail_PostMessageData,
    I_WeatherAlert
} from "./Interface";
import {TurnstileProps} from "@marsidev/react-turnstile";

/**
 * Type definition for the context.
 *
 * @property {I_StatusUpdateCallback} statusUpdateCallback - The status update callback function.
 */
export type MenuContextType = {
    statusUpdateCallback: I_StatusUpdateCallback
}

export type ProfileContextType = {
    data: VMInstanceDataType
}

/**
 * VM country code type.
 * Common short codes are provided, but any string is allowed to support extensions.
 */
export type VMCountryType = "TW" | "JP" | "US" | "HK" | "UK" | string

/**
 * VM provider type.
 * Enumerates supported VM/cloud providers.
 */
export type VMProviderType = "google" | "azure"

/**
 * VPN profile representation.
 *
 * @property {"OpenVPN" | "SoftEther" | "SS" | "socks5"} type - Profile transport/type.
 * @property {string} name - Human readable profile name.
 * @property {string} filename - Local filename associated with the profile.
 * @property {string} [url] - Optional remote URL where profile can be downloaded.
 */
export type VPNProfileType = {
    "type": "OpenVPN" | "SoftEther" | "SS" | "socks5",
    "name": string,
    "filename": string,
    "url"?: string
}

/**
 * Read-only mode controls UI action availability.
 * - `startOnly`: only allow start action
 * - `stopOnly`: only allow stop action
 * - `readOnly`: all actions are disabled (read-only)
 * - `disable`: do not apply read-only restrictions
 */
export type ReadOnlyModeType = "startOnly" | "stopOnly" | "readOnly" | "disable"

/**
 * Type definition for the VM data response.
 * @typedef {Object} VMDataType
 * @property {string} next_update - The timestamp for the next scheduled update.
 * @property {string} last_update - The timestamp for the last update.
 * @property {VMInstanceDataType[]} data - The array of VM instances.
 */
export type VMDataType = {
    next_update: string;
    last_update: string;
    data: VMInstanceDataType[]
}

/**
 * VM instance data shape used across UI and runtime messaging.
 *
 * Fields prefixed with `readonly` should not be mutated after creation.
 *
 * @property {string} _name - Display name of the VM.
 * @property {string} _status - Current VM status (e.g. "running", "stopped").
 * @property {string} _id - Unique VM identifier.
 * @property {string} _zone - Zone or region where VM is located.
 * @property {string} _url - Access URL for VM.
 * @property {VMCountryType} _country - Country/region code for VM.
 * @property {VPNProfileType[]} _profiles - Array of associated VPN profiles.
 * @property {VMProviderType} _provider - Cloud/provider for the VM.
 * @property {boolean} _isPowerOn - Whether the VM is powered on.
 * @property {ReadOnlyModeType} _readonly - Readonly mode for the VM controls.
 * @property {string | null} _expired - Optional expiration timestamp or null if not set.
 */
export type VMInstanceDataType = {
    readonly _name: string;
    _status: string;
    readonly _id: string;
    readonly _zone: string;
    readonly _url: string;
    readonly _country: VMCountryType;
    readonly _profiles: VPNProfileType[];
    readonly _provider: VMProviderType;
    _isPowerOn: boolean;
    readonly _readonly: ReadOnlyModeType;
    _expired: string | null;
}

/**
 * Type definition for the user profile.
 * @typedef {Object} UserProfileType
 * @property {string} email - The email of the user.
 * @property {string} username - The username of the user.
 * @property {string} ip - The ip of the user.
 */
export type UserProfileType = {
    email: string,
    name?: string,
    ip?: string,
    custom?: {
        name: string,
        [key: string]: any
    },
    [key: string]: any
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
 * @typedef {Object} WeatherDataType
 * @property {number} temperature - The current temperature.
 * @property {number} icon - The weather icon ID.
 * @property {I_WeatherAlert[]} alert - Array of weather alerts.
 * @property {number} humidity - The humidity percentage.
 * @property {number} uv_index - The UV index.
 * @property {Object} weatherReport - The detailed weather report.
 */
export type WeatherDataType = {
    temperature: number,
    icon: number,
    alert: I_WeatherAlert[],
    humidity: number,
    uv_index: number,
    weatherReport: {
        forecastDesc: string,
        outlook: string,
        generalSituation: string,
        tcInfo: string | "",
        fireDangerWarning: string | "",
        forecastPeriod: string
    }
}

/**
 * Type definition for the alert memo.
 */
export type AlertMemoType = [any, WeatherAlertType][]

/**
 * Type definition for the websocket data.
 * @typedef {Object} WebSocketDataType
 * @property {string} uri - The WebSocket URL.
 * @property {any} data - The data payload.
 */
export type WebSocketDataType = {
    url: string,
    data: any,
}

/**
 * PostMessage 數據的聯合類型 (Discriminated Union)。
 * 使用此類型時，TypeScript 會根據 'type' 的值自動縮小範圍到具體的 Interface。
 */
export type PostMessageData =
    | I_ExtensionInstalled_PostMessageData
    | I_Connect_PostMessageData
    | I_MobileAppInstalled_PostMessageData
    | I_PostVMData_PostMessageData
    | I_VMOperationFail_PostMessageData;

/**
 * Turnstile 元件的參數，移除 `siteKey` 由組件統一注入。
 */
export type TurnstileWidgetProps = Omit<TurnstileProps, "siteKey">;

/**
 * Turnstile Context 函數類型，返回一個 Promise，解析為驗證 token 字串。
 */
export type TurnstileContextType = () => Promise<string>;