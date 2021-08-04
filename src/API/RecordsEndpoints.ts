import Record from "../Models/Record";
import { HandleError, HandleResponse } from "../Utilities/HelperFunctions";

/**
 * Gets a list of records from the backend.
 */
export async function GetRecords(): Promise<Record[]> {
    try {
        const response = await fetch('/api/records');
        return HandleResponse(response);
    } catch (error: any) {
        HandleError(error);
    }
    
    return [];
}