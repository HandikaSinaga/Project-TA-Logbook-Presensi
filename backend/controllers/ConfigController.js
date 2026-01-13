class ConfigController {
    static async getPublicConfig(req, res) {
        try {
            const publicConfig = {
                googleClientId: process.env.GOOGLE_CLIENT_ID || "",
                features: {
                    googleOAuth: !!process.env.GOOGLE_CLIENT_ID,
                    emailVerification: false,
                },
                apiUrl: process.env.API_URL || "http://localhost:3001",
                app: {
                    name: "Logbook Presensi",
                    version: "1.0.0",
                },
            };

            res.json({
                success: true,
                config: publicConfig,
            });
        } catch (error) {
            console.error("Error fetching config:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch configuration",
            });
        }
    }
}

export default ConfigController;
