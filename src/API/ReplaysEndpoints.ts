import { HandleError, HandleResponse } from "../Utilities/HelperFunctions";

export interface ReplayResponse {
    id: number,
    message?: string
}

/**
 * Upload a replay to the API
 * @param file The File to upload
 */
export async function UploadReplay(file: File): Promise<ReplayResponse | boolean> {
    try {
        const response = await fetch('/api/replays', {
            method: 'POST',
            headers: {
                'source': 'web',
                'content-type': 'application/octet-stream'
            },
            body: file
        });
        return HandleResponse(response);
    } catch (error: any) {
        HandleError(error);
    }

    return false;
}