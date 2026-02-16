import {createContext, useContext} from 'react';
import {UserProfileType} from "../constants/Type";

/**
 * Context to hold the user profile data.
 * Initialized with null.
 */
export const UserProfileContext = createContext<UserProfileType | null>(null);

/**
 * Custom hook to access the user profile context.
 *
 * @returns {UserProfileType | null} The current user profile from the context, or null if not set.
 */
export const useUserProfile = (): UserProfileType | null => {
    return useContext(UserProfileContext);
};