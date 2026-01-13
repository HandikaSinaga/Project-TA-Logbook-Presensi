import { useState, useEffect } from "react";

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
                const response = await fetch(
                    "http://localhost:3001/api/config"
                );
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
                // Fallback to safe defaults
                configCache = {
                    googleClientId: "",
                    features: { googleOAuth: false },
                    apiUrl: "http://localhost:3001",
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
