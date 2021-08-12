import Map from "../Models/Map";
import Record from "../Models/Record";
import { HandleError, HandleResponse } from "../Utilities/HelperFunctions";

/**
 * Gets a list of records from the backend.
 */
export async function GetRecords(mapFilter = ''): Promise<Record[]> {
    try {
        const params = new URLSearchParams();
        if (mapFilter)
            params.set('mapName', mapFilter);
        const response = await fetch(`/api/records?${params.toString()}`);
        return HandleResponse(response);
    } catch (error: any) {
        HandleError(error);
    }
    return [];
}

export async function GetMaps(): Promise<Map[]> {
    try {
        const response = await fetch('/api/maps');
        return HandleResponse(response);
    } catch (error: any) {
        HandleError(error);
    }
    return [];
}