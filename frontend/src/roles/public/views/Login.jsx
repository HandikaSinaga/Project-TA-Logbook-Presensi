import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import toast from "react-hot-toast";
import useConfig from "../../../hooks/useConfig";

/**
 * Login Page - Logbook & Presensi System
 * Original design - NO .env dependency, uses backend config
 * NO references to english-adaptive-learning
 */
const Login = () => {
    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
        remember: false,
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { config, loading: configLoading } = useConfig();
    const googleButtonRef = useRef(null);

    // Load Google Sign-In SDK when config is ready
    useEffect(() => {
        if (!config?.googleClientId) {
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (
                window.google &&
                config.googleClientId &&
                googleButtonRef.current
            ) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: config.googleClientId,
                        callback: handleGoogleCallback,
                        ux_mode: "popup",
                        context: "signin",
                    });

                    // Render the button
                    window.google.accounts.id.renderButton(
                        googleButtonRef.current,
                        {
                            type: "standard",
                            theme: "outline",
                            size: "large",
                            text: "signin_with",
                            shape: "rectangular",
                            logo_alignment: "left",
                            width: googleButtonRef.current.offsetWidth || 300,
                        }
                    );
                } catch (error) {
                    console.error(
                        "Failed to initialize Google Sign-In:",
                        error
                    );
                }
            }
        };

        script.onerror = () => {
            console.error("Failed to load Google SDK");
        };

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [config]);

    const handleGoogleCallback = async (response) => {
        try {
            setLoading(true);

            const result = await axiosInstance.post("/google-idtoken", {
                id_token: response.credential,
            });

            if (result.data.success && result.data.token && result.data.user) {
                localStorage.setItem("token", result.data.token);
                localStorage.setItem("user", JSON.stringify(result.data.user));

                toast.success("Login dengan Google berhasil!");

                const role = result.data.user.role;
                setTimeout(() => {
                    if (role === "admin")
                        navigate("/admin/dashboard", { replace: true });
                    else if (role === "supervisor")
                        navigate("/supervisor/dashboard", { replace: true });
                    else navigate("/user/dashboard", { replace: true });
                }, 500);
            }
        } catch (error) {
            let errorMessage = "Login dengan Google gagal. Silakan coba lagi.";

            if (error.response) {
                if (error.response.status === 403) {
                    errorMessage =
                        error.response.data.message ||
                        "Akun Anda belum diaktifkan";
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!credentials.email || !credentials.password) {
            toast.error("Email dan password harus diisi");
            return;
        }

        try {
            setLoading(true);
            const response = await axiosInstance.post("/login", {
                email: credentials.email,
                password: credentials.password,
                remember: credentials.remember,
            });

            if (
                response.data.success &&
                response.data.token &&
                response.data.user
            ) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                );

                toast.success("Login berhasil!");

                const role = response.data.user.role;
                setTimeout(() => {
                    if (role === "admin")
                        navigate("/admin/dashboard", { replace: true });
                    else if (role === "supervisor")
                        navigate("/supervisor/dashboard", { replace: true });
                    else navigate("/user/dashboard", { replace: true });
                }, 500);
            } else {
                throw new Error("Format response tidak valid");
            }
        } catch (error) {
            console.error("Login error:", error);

            let errorMessage = "Login gagal. Silakan coba lagi.";

            if (error.isNetworkError) {
                errorMessage = error.message;
            } else if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "Email atau password salah";
                } else if (error.response.status === 403) {
                    errorMessage = "Akun Anda telah dinonaktifkan";
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (configLoading) {
        return (
            <Container
                fluid
                className="h-screen d-flex align-items-center justify-content-center"
            >
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <Container fluid className="login-page h-screen bg-light">
            <Row className="h-100">
                {/* Left Panel - Branding */}
                <Col
                    md={6}
                    className="d-none d-md-flex flex-column justify-content-center align-items-center bg-gd text-white p-5"
                >
                    <div className="text-center mb-5">
                        <h1 className="display-4 fw-bold mb-3">
                            Logbook Presensi
                        </h1>
                        <p className="lead">
                            Sistem manajemen kehadiran dan logbook yang modern,
                            efisien, dan terintegrasi.
                        </p>
                    </div>
                    {/* Simple SVG illustration */}
                    <svg
                        width="300"
                        height="300"
                        viewBox="0 0 300 300"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle
                            cx="150"
                            cy="150"
                            r="100"
                            fill="white"
                            fillOpacity="0.1"
                        />
                        <circle
                            cx="150"
                            cy="150"
                            r="70"
                            fill="white"
                            fillOpacity="0.15"
                        />
                        <rect
                            x="110"
                            y="110"
                            width="80"
                            height="80"
                            rx="10"
                            fill="white"
                            fillOpacity="0.2"
                        />
                        <path
                            d="M130 150 L145 165 L175 135"
                            stroke="white"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </Col>

                {/* Right Panel - Login Form */}
                <Col
                    md={6}
                    className="d-flex flex-column justify-content-center p-5"
                >
                    <div
                        className="login-form-container"
                        style={{
                            maxWidth: "450px",
                            margin: "0 auto",
                            width: "100%",
                        }}
                    >
                        {/* Back to Home Button */}
                        <div className="mb-3">
                            <Link
                                to="/"
                                className="btn btn-link text-decoration-none p-0 text-secondary"
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Kembali ke Beranda
                            </Link>
                        </div>

                        <div className="mb-4 text-center text-md-start">
                            <h2 className="fw-bold text-blue mb-2">
                                Selamat Datang
                            </h2>
                            <p className="text-secondary">
                                Masuk ke akun Anda untuk melanjutkan
                            </p>
                        </div>

                        <div className="bg-gd rounded-35 p-1">
                            <Form
                                className="bg-white rounded-35 p-4"
                                onSubmit={handleSubmit}
                            >
                                <Form.Group
                                    className="mb-3"
                                    controlId="formEmail"
                                >
                                    <Form.Label className="fw-semibold">
                                        Email{" "}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="nama@email.com"
                                        value={credentials.email}
                                        onChange={(e) =>
                                            setCredentials({
                                                ...credentials,
                                                email: e.target.value,
                                            })
                                        }
                                        disabled={loading}
                                        required
                                        className="rounded-35"
                                    />
                                </Form.Group>

                                <Form.Group
                                    className="mb-3"
                                    controlId="formPassword"
                                >
                                    <Form.Label className="fw-semibold">
                                        Password{" "}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="input-group">
                                        <Form.Control
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Masukkan password"
                                            value={credentials.password}
                                            onChange={(e) =>
                                                setCredentials({
                                                    ...credentials,
                                                    password: e.target.value,
                                                })
                                            }
                                            disabled={loading}
                                            required
                                            className="rounded-start-35"
                                        />
                                        <button
                                            className="btn btn-outline-secondary rounded-end-35"
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            disabled={loading}
                                        >
                                            <i
                                                className={`bi bi-eye${
                                                    showPassword ? "-slash" : ""
                                                }`}
                                            ></i>
                                        </button>
                                    </div>
                                </Form.Group>

                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <Form.Group
                                        controlId="formRemember"
                                        className="mb-0"
                                    >
                                        <Form.Check
                                            type="checkbox"
                                            label="Ingat saya"
                                            checked={credentials.remember}
                                            onChange={(e) =>
                                                setCredentials({
                                                    ...credentials,
                                                    remember: e.target.checked,
                                                })
                                            }
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                    <Link
                                        to="/forgot-password"
                                        className="text-blue text-decoration-none small"
                                    >
                                        Lupa password?
                                    </Link>
                                </div>

                                <Button
                                    type="submit"
                                    variant="gd"
                                    className="w-100 mb-3 rounded-35"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                                className="me-2"
                                            />
                                            Memproses...
                                        </>
                                    ) : (
                                        "Masuk"
                                    )}
                                </Button>

                                {config?.features?.googleOAuth && (
                                    <>
                                        <div className="text-center my-3">
                                            <span className="text-muted small">
                                                atau
                                            </span>
                                        </div>

                                        {/* Google Sign-In Button will be rendered here */}
                                        <div
                                            ref={googleButtonRef}
                                            className="w-100"
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                minHeight: "44px",
                                            }}
                                        />
                                    </>
                                )}

                                <p className="text-center mt-4 mb-0 small text-secondary">
                                    Belum punya akun? Hubungi administrator
                                    untuk pembuatan akun.
                                </p>
                            </Form>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
