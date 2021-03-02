import { HandleError, HandleResponse } from "../Utilities/HelperFunctions";

/**
 * Gets a list of records from the backend.
 */
export async function GetRecords(): Promise<string[]> {
    try {
        const response = await fetch('https://localhost:44396/Records');
        return HandleResponse(response);
    } catch (error: any) {
        HandleError(error);
    }
    
    return [];
}