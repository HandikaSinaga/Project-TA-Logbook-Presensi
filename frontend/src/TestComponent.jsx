import React from "react";

console.log("TestComponent loaded");

const TestComponent = () => {
    console.log("TestComponent rendering");
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f0f0f0",
            }}
        >
            <div
                style={{
                    padding: "40px",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    textAlign: "center",
                }}
            >
                <h1 style={{ color: "#2563eb", marginBottom: "20px" }}>
                    ✅ React Is Working!
                </h1>
                <p style={{ color: "#64748b", fontSize: "18px" }}>
                    This test confirms React can render components.
                </p>
                <div
                    style={{
                        marginTop: "20px",
                        padding: "15px",
                        backgroundColor: "#dcfce7",
                        borderRadius: "8px",
                    }}
                >
                    <p style={{ color: "#166534", margin: 0 }}>
                        ✓ Frontend: http://localhost:5173/
                        <br />✓ Backend: http://localhost:3001/
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TestComponent;
