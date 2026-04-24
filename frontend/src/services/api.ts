import type{ ApiResponse, Application, SingleApplicationResponse } from "../types";
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

        if (error.response && error.response.status === 401) {

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

export async function createApplication(newApp:Partial<Application>): Promise<Application>
 
{
    const response = await api.post<SingleApplicationResponse>("/applications", newApp); 
    if(response.data.success){
        return response.data.data;
    } else {
        throw new Error("failed to create application");
    }

}

export async function updateApplicationStatus(
  id: string,
  status: string
): Promise<void> {
  const response = await api.patch<SingleApplicationResponse>(
    `/applications/${id}`,
    { status }
  );

  if (!response.data.success) {
    throw new Error("Failed to update status");
  }
}


export default api ;