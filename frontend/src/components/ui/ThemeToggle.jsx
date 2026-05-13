import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "react-bootstrap";

const ThemeToggle = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className="theme-toggle-container d-flex align-items-center justify-content-center mx-auto">
            <Button
                variant="link"
                className={`theme-toggle-btn p-2 rounded-circle border-0 d-flex align-items-center justify-content-center ${isDarkMode ? 'dark' : 'light'}`}
                onClick={toggleTheme}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                style={{
                    width: "40px",
                    height: "40px",
                    background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    color: isDarkMode ? "#fbbf24" : "#4b5563",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                <div 
                    className="icon-wrapper"
                    style={{
                        transform: `rotate(${isDarkMode ? 360 : 0}deg)`,
                        transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                >
                    {isDarkMode ? (
                        <i className="bi bi-moon-stars-fill fs-5"></i>
                    ) : (
                        <i className="bi bi-sun-fill fs-5"></i>
                    )}
                </div>
            </Button>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .theme-toggle-btn:hover {
                    transform: scale(1.1);
                    background: ${isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"} !important;
                    box-shadow: 0 0 15px ${isDarkMode ? "rgba(251, 191, 36, 0.3)" : "rgba(75, 85, 99, 0.2)"};
                }
                .theme-toggle-btn:active {
                    transform: scale(0.95);
                }
                
                @media (max-width: 991px) {
                    .theme-toggle-container {
                        margin-left: 0 !important;
                        margin-right: 1rem !important;
                    }
                }
            `}} />
        </div>
    );
};

export default ThemeToggle;
