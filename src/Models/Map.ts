export default interface Map {
    id: number;
    name: string;
    filesize: number;
    validated: boolean;
    difficulty: number;
    created_on: Date;
    updated_on: Date;
    approved_by_steamid64: string;
    workshop_url: string;
    download_url: string;
}