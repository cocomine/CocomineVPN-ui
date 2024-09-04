/**
 * NetworkError class that implements the Error interface.
 * This class is used to create a custom error type for network related errors.
 */
export class NetworkError implements Error {
    /**
     * The error message.
     */
    message: string;

    /**
     * The name of the error. Default is "NetworkError".
     */
    name: string = "NetworkError";

    /**
     * Constructor for the NetworkError class.
     * @param {string} message - The error message.
     */
    constructor(message: string) {
        this.message = message;
    }
}