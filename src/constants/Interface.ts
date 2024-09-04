import {ReadOnlyModeType, VMDataType, WeatherAlertType} from "./Type";

/**
 * Interface for the status update callback function.
 *
 * @callback I_StatusUpdateCallback
 * @param {Promise<VMDataType>} promise - The promise that will resolve to the updated VM data.
 * @param {boolean} target_power - The target power state. True for power on, false for power off.
 * @param {string} vm_id - The ID of the virtual machine to update.
 * @returns {void}
 */
export interface I_StatusUpdateCallback {
    (target_power: boolean, vm_id: string): void
}

/**
 * Interface for the weather alert.
 */
export interface I_WeatherAlert {
    name: string;
    code: WeatherAlertType;
    actionCode: string;
    type: string;
}

/**
 * Interface for the structure of window post messages.
 * @interface
 * @property {string} type - The type of the message, used to identify the purpose or action of the message.
 * @property {boolean} ask - A boolean flag indicating whether the message is a request for information (true) or a notification (false).
 */
export interface I_windowPostMessage {
    type: string,
    ask: boolean,
}

/**
 * Interface extending `I_windowPostMessage` for messages that include VM data.
 * @interface
 * @extends I_windowPostMessage
 * @property {VMDataType[]} data - An array of VMData objects, providing detailed information about virtual machines.
 */
export interface I_VMData_windowPostMessage extends I_windowPostMessage {
    data: VMDataType[]
}

/**
 * Interface for the power control.
 */
export interface I_PowerControl {
    isPower: boolean,
    action: (power: boolean) => void,
    readonly: ReadOnlyModeType;
}

/**
 * Interface for the WebSocket ticket.
 */
export interface I_WebSocketTicket {
    data?: {
        ticket: string
    }
}

/**
 * Type definition for the post message data.
 */
export interface I_PostMessageData {
    type: string;
    data: any;
    ask: boolean
}

export interface I_ExtensionInstalled_PostMessageData extends I_PostMessageData {
    data: {
        installed: boolean;
        version: string;
    }
}

export interface I_Connect_PostMessageData extends I_PostMessageData {
    data: {
        connected: boolean;
        id: string
    }
}

