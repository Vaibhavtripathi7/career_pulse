import { google } from "googleapis";

export function createOAuthClient() { 
  return new google.auth.OAuth2(
    process.env.CLIENT_ID as string,
    process.env.CLIENT_SECRET as string,
    process.env.GOOGLE_REDIRECT_URL as string

)};

