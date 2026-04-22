import type{ ApiResponse, Application } from "../types";
import axios from 'axios';

const api = axios.create({

    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',

    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {

        if (error.response && error.respone.status === 401) {

            console.warn("Unauthorized! cookie is mising")

        }
        return Promise.reject(error);
    }
)


export async function getApplication(): Promise<Application[]> {

    try {
        const response = await api.get<ApiResponse>('/applications');

        if (response.data.success){
            return response.data.data;
        }
        else {
            throw new Error("API responeded with success: false");
        }
    } catch (error) {
        console.error("Failed to fetch applications", error);
        return [];
    }
}

export async function getUseProfile(){

    try {
        const response = await api.get('/auth/me');
        return response.data;

    } catch (error) {
        return null;
    }
}

export default api ;