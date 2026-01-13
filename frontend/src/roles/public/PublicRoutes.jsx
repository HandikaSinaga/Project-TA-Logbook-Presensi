import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./views/Login";
import Home from "./views/Home";

const PublicRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default PublicRoutes;
