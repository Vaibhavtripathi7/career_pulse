export interface EmailInput {
    subject: string;
    sender: string;
    snippet: string;
    body?: string;
    labelIds?: string[];
}

export interface ParsedEmail {
    companyName: string;
    role: string;
    workModel: string;
    confidence?: number;
    source?: string;
}
