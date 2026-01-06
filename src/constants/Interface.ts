import {ReadOnlyModeType, VMCountryType, VMInstanceDataType, WeatherAlertType} from "./Type";

/**
 * Interface for the status update callback function.
 *
 * @callback I_StatusUpdateCallback
 * @param {boolean} target_power - The target power state. True for power on, false for power off.
 * @param {string} vm_id - The ID of the virtual machine to update.
 * @returns {void}
 */
export interface I_StatusUpdateCallback {
    (target_power: boolean, vm_id: string): void
}

/**
 * Interface for the weather alert.
 * @interface
 * @property {string} name - The name of the alert.
 * @property {WeatherAlertType} code - The code of the alert.
 * @property {string} actionCode - The action code associated with the alert.
 * @property {string} type - The type of the alert.
 */
export interface I_WeatherAlert {
    name: string;
    code: WeatherAlertType;
    actionCode: string;
    type: string;
}

/**
 * Interface for the power control.
 * @interface
 * @property {boolean} isPower - Indicates if the power is currently on.
 * @property {(power: boolean) => void} action - Function to toggle power state.
 * @property {ReadOnlyModeType} readonly - The read-only mode status.
 * @property {boolean} loading - Indicates if a power action is currently loading.
 */
export interface I_PowerControl {
    isPower: boolean,
    action: (power: boolean) => void,
    readonly: ReadOnlyModeType,
    loading: boolean,
}

/**
 * Interface for the WebSocket ticket.
 * @interface
 * @property {Object} [data] - The data object containing the ticket.
 * @property {string} data.ticket - The WebSocket ticket string.
 */
export interface I_WebSocketTicket {
    data?: {
        ticket: string
    }
}

/**
 * 定義所有 PostMessage 共用的屬性
 */
interface I_BasePostMessageData {
    ask: boolean;
}

/**
 * Extension Installed 訊息介面
 * type 必須明確指定為 'ExtensionInstalled'
 * @interface
 * @extends I_BasePostMessageData
 * @property {Object} data - The data payload.
 * @property {boolean} data.installed - Indicates if the extension is installed.
 * @property {string} data.version - The version of the installed extension.
 */
export interface I_ExtensionInstalled_PostMessageData extends I_BasePostMessageData {
    type: 'ExtensionInstalled';
    data: {
        installed: boolean;
        version: string;
    }
}

/**
 * Interface extending `I_windowPostMessage` for messages that include VM data.
 * @interface
 * @extends I_BasePostMessageData
 * @property {VMInstanceDataType[]} data - An array of VMData objects, providing detailed information about virtual machines.
 */
export interface I_PostVMData_PostMessageData extends I_BasePostMessageData {
    type: 'PostVMData';
    data: VMInstanceDataType[]
}

/**
 * Connect 訊息介面
 * type 必須明確指定為 'Connect'
 * @interface
 * @extends I_BasePostMessageData
 * @property {Object} data - The data payload.
 * @property {boolean} data.connected - Indicates if the connection is established.
 * @property {string} data.id - The connection ID.
 */
export interface I_Connect_PostMessageData extends I_BasePostMessageData {
    type: 'Connect' | 'AppConnect';
    data: {
        connected: boolean;
        id: string
    }
}

/**
 * Mobile App Installed 訊息介面
 */
export interface I_MobileAppInstalled_PostMessageData extends I_BasePostMessageData {
    type: 'MobileAppInstalled';
    data: {
        installed: boolean;
        version: string;
    }
}

/**
 * VM Operation Fail 訊息介面
 */
export interface I_VMOperationFail_PostMessageData extends I_BasePostMessageData {
    type: 'VMOperationFail';
    data: {
        id: string,
        provider: string,
        zone: string,
        action: "START" | "STOP",
        reason: "CPU_QUOTA" | "GENERAL",
        message: string,
        operation: string,
        timestamp: string
    }
}

/**
 * Retrieve Tracked Usage 訊息介面
 */
export interface I_RetrieveTrackedUsage_PostMessageData extends I_BasePostMessageData {
    type: 'RetrieveTrackedUsage';
    data: {
        datetime: string;
        country: VMCountryType;
        // True is connect, false is disconnect.
        isConnect: boolean;
    }[]
}

/**
 * Type definition for the Extend Time button props.
 * @interface
 * @property {string | null} expired - The expiration time as a string or null.
 * @property {boolean} loading - Indicates if the operation is in progress.
 * @property {() => Promise<any>} onClick - The click handler function that returns a Promise.
 */
export interface ExtendTimeProps {
    expired: string | null,
    loading: boolean,
    onClick: () => Promise<any>
}