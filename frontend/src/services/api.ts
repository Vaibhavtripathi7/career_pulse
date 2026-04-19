import type{ ApiResponse, Application } from "../types";

const API_BASE_URL = 'https://localhost:3000/api';

export async function getApplication(): Promise<Application[]> {

    try {
        const response = await fetch(`${API_BASE_URL}/applications`);
        if (!response.ok){
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json: ApiResponse = await response.json();
        if (json.success) {
            return json.data;
        }else {
            throw new Error("API responeded with success: false");
        }
    } catch (error) {
        console.error("Failed to fetch applications", error);
        return [];
    }
}