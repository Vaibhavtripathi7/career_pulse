export interface Application { 
    id: string;
    companyName: string;
    role: string;
    status: string;
    workModel: string;
    createdAt: string  
}

export interface ApiResponse { 
    success: boolean;
    count: number;
    data: Application[];
}

export interface SingleApplicationResponse {
    success: boolean;
    data: Application;
}