import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token
 * @param {string} idToken - ID token from Google Sign-In
 * @returns {Promise<object>} - Decoded token payload
 */
export async function verifyGoogleToken(idToken) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Verify email is verified
        if (!payload.email_verified) {
            throw new Error("Email not verified by Google");
        }

        // Optional: Check hosted domain if OAUTH_ALLOWED_HD is set
        if (
            process.env.OAUTH_ALLOWED_HD &&
            process.env.OAUTH_ALLOWED_HD.trim() !== ""
        ) {
            const allowedDomains = process.env.OAUTH_ALLOWED_HD.split(";").map(
                (d) => d.trim()
            );
            if (payload.hd && !allowedDomains.includes(payload.hd)) {
                throw new Error("Domain not allowed for OAuth sign-in");
            }
        }

        return {
            email: payload.email,
            name: payload.name || "",
            picture: payload.picture || "",
            sub: payload.sub,
            email_verified: payload.email_verified,
            hd: payload.hd || null,
        };
    } catch (error) {
        console.error("Error verifying Google token:", error.message);
        throw new Error("Invalid Google ID token");
    }
}
