import {createContext, useContext} from 'react';
import {UserProfileType} from "../constants/Type";

/**
 * Context to hold the Virtual Machine (VM) data.
 * Initialized with null.
 */
export const UserProfileContext = createContext<UserProfileType | null>(null);

/**
 * Custom hook to access the VM data context.
 *
 * @returns {VMDataType | null} The current VM data from the context, or null if not set.
 */
export const useUserProfile = (): UserProfileType | null => {
    return useContext(UserProfileContext);
};