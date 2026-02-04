import { useState, useEffect } from "react";
import { API_URL } from "../utils/Constant";

let configCache = null;

/**
 * Custom hook to fetch runtime configuration from backend
 * Replaces frontend .env dependency
 */
export const useConfig = () => {
    const [config, setConfig] = useState(configCache);
    const [loading, setLoading] = useState(!configCache);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (configCache) {
            setConfig(configCache);
            setLoading(false);
            return;
        }

        const fetchConfig = async () => {
            try {
                const response = await fetch(`${API_URL}/config`);
                const data = await response.json();

                if (data.success && data.config) {
                    configCache = data.config;
                    setConfig(data.config);
                } else {
                    throw new Error("Invalid config response");
                }
            } catch (err) {
                console.error("Failed to fetch config:", err);
                setError(err.message);
                // Fallback to safe defaults (uses current API_URL)
                configCache = {
                    googleClientId: "",
                    features: { googleOAuth: false },
                    apiUrl: API_URL.replace("/api", ""),
                    app: { name: "Logbook Presensi", version: "1.0.0" },
                };
                setConfig(configCache);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return { config, loading, error };
};

export default useConfig;
