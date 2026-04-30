export interface EmailInput {
    subject: string;
    sender: string;
    snippet: string;
}

export interface ParsedEmail {
    companyName: string;
    role: string;
    workModel: string;
}