import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "v1";

function getKey(): Buffer {
    const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY ?? "", "hex");
    if (key.length !== 32) {
        throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes in hex");
    }
    return key;
}

export function encryptToken(token: string): string;
export function encryptToken(token: string | null): string | null;
export function encryptToken(token: string | null): string | null {
    if (token === null) return null;

    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [PREFIX, iv.toString("base64"), tag.toString("base64"), data.toString("base64")].join(":");
}

export function decryptToken(stored: string): string;
export function decryptToken(stored: string | null): string | null;
export function decryptToken(stored: string | null): string | null {
    if (stored === null) return null;
    if (!stored.startsWith(`${PREFIX}:`)) return stored;

    const [, iv, tag, data] = stored.split(":");
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv!, "base64"));
    decipher.setAuthTag(Buffer.from(tag!, "base64"));

    return Buffer.concat([
        decipher.update(Buffer.from(data!, "base64")),
        decipher.final()
    ]).toString("utf8");
}
