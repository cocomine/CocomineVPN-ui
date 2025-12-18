import {createContext, useContext} from 'react';
import {VMDataType} from "./Type";

/**
 * Context to hold the Virtual Machine (VM) data.
 * Initialized with null.
 */
export const VMDataContext = createContext<VMDataType | null>(null);

/**
 * Custom hook to access the VM data context.
 *
 * @returns {VMDataType | null} The current VM data from the context, or null if not set.
 */
export const useVMData = (): VMDataType | null => {
    return useContext(VMDataContext);
}