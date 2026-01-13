import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import MainNav from "../../../components/layout/public/MainNav";

/**
 * Landing Page - Logbook & Presensi System
 * Original design - NO references to english-adaptive-learning
 * Created: December 2024
 */
const Home = () => {
    return (
        <>
            <MainNav />
            <div className="landing-page">
                {/* Hero Section */}
                <section className="hero-section bg-gd text-white py-5">
                    <Container>
                        <Row className="align-items-center min-vh-50 py-5">
                            <Col
                                lg={6}
                                className="text-center text-lg-start mb-4 mb-lg-0"
                            >
                                <h1 className="display-4 fw-bold mb-4">
                                    Kelola Presensi & Logbook dengan Mudah
                                </h1>
                                <p className="lead mb-4">
                                    Sistem manajemen presensi dan logbook
                                    berbasis web yang modern, efisien, dan
                                    terintegrasi. Pantau kehadiran, catat
                                    aktivitas harian, dan hasilkan laporan
                                    secara real-time.
                                </p>
                                <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                                    <Link to="/login">
                                        <Button
                                            variant="light"
                                            size="lg"
                                            className="px-4 rounded-35"
                                        >
                                            <i className="bi bi-box-arrow-in-right me-2"></i>
                                            Masuk
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline-light"
                                        size="lg"
                                        className="px-4 rounded-35"
                                    >
                                        <i className="bi bi-info-circle me-2"></i>
                                        Pelajari Lebih Lanjut
                                    </Button>
                                </div>
                            </Col>
                            <Col lg={6} className="text-center">
                                {/* Simple geometric SVG - original, no copyright */}
                                <svg
                                    width="100%"
                                    height="350"
                                    viewBox="0 0 500 350"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <rect
                                        x="50"
                                        y="30"
                                        width="400"
                                        height="290"
                                        rx="20"
                                        fill="white"
                                        fillOpacity="0.1"
                                        stroke="white"
                                        strokeWidth="2"
                                    />
                                    <rect
                                        x="80"
                                        y="70"
                                        width="110"
                                        height="80"
                                        rx="10"
                                        fill="white"
                                        fillOpacity="0.2"
                                    />
                                    <rect
                                        x="210"
                                        y="70"
                                        width="110"
                                        height="80"
                                        rx="10"
                                        fill="white"
                                        fillOpacity="0.2"
                                    />
                                    <rect
                                        x="340"
                                        y="70"
                                        width="80"
                                        height="80"
                                        rx="10"
                                        fill="white"
                                        fillOpacity="0.2"
                                    />
                                    <rect
                                        x="80"
                                        y="170"
                                        width="340"
                                        height="120"
                                        rx="10"
                                        fill="white"
                                        fillOpacity="0.15"
                                    />
                                    <circle
                                        cx="250"
                                        cy="230"
                                        r="35"
                                        fill="white"
                                        fillOpacity="0.3"
                                    />
                                    <path
                                        d="M250 210 L250 230 L265 245"
                                        stroke="white"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Features Section */}
                <section className="features-section py-5 bg-light">
                    <Container>
                        <div className="text-center mb-5">
                            <h2 className="fw-bold text-blue mb-3">
                                Fitur Unggulan
                            </h2>
                            <p className="text-secondary">
                                Solusi lengkap untuk manajemen kehadiran dan
                                aktivitas karyawan
                            </p>
                        </div>
                        <Row className="g-4">
                            <Col md={6} lg={3}>
                                <Card className="h-100 border-0 shadow-sm hover-lift rounded-35">
                                    <Card.Body className="text-center p-4">
                                        <div className="feature-icon mb-3">
                                            <i className="bi bi-calendar-check fs-1 text-blue"></i>
                                        </div>
                                        <h5 className="fw-bold mb-3">
                                            Presensi Digital
                                        </h5>
                                        <p className="text-secondary small mb-0">
                                            Catat kehadiran secara digital
                                            dengan mudah dan akurat. Support
                                            absen masuk, pulang, dan lembur.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6} lg={3}>
                                <Card className="h-100 border-0 shadow-sm hover-lift rounded-35">
                                    <Card.Body className="text-center p-4">
                                        <div className="feature-icon mb-3">
                                            <i className="bi bi-journal-text fs-1 text-blue"></i>
                                        </div>
                                        <h5 className="fw-bold mb-3">
                                            Logbook Harian
                                        </h5>
                                        <p className="text-secondary small mb-0">
                                            Dokumentasikan aktivitas kerja
                                            harian dengan sistematis. Mudah
                                            diakses dan dilaporkan.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6} lg={3}>
                                <Card className="h-100 border-0 shadow-sm hover-lift rounded-35">
                                    <Card.Body className="text-center p-4">
                                        <div className="feature-icon mb-3">
                                            <i className="bi bi-graph-up fs-1 text-blue"></i>
                                        </div>
                                        <h5 className="fw-bold mb-3">
                                            Dashboard Real-time
                                        </h5>
                                        <p className="text-secondary small mb-0">
                                            Pantau data presensi dan logbook
                                            secara real-time dengan visualisasi
                                            yang informatif.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6} lg={3}>
                                <Card className="h-100 border-0 shadow-sm hover-lift rounded-35">
                                    <Card.Body className="text-center p-4">
                                        <div className="feature-icon mb-3">
                                            <i className="bi bi-file-earmark-bar-graph fs-1 text-blue"></i>
                                        </div>
                                        <h5 className="fw-bold mb-3">
                                            Laporan Otomatis
                                        </h5>
                                        <p className="text-secondary small mb-0">
                                            Generate laporan presensi dan
                                            aktivitas dengan satu klik. Export
                                            ke PDF atau Excel.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Benefits Section */}
                <section className="benefits-section py-5">
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={6} className="mb-4 mb-lg-0">
                                <h2 className="fw-bold text-blue mb-4">
                                    Mengapa Pilih Sistem Kami?
                                </h2>
                                <div className="benefits-list">
                                    <div className="benefit-item d-flex align-items-start mb-3">
                                        <i className="bi bi-check-circle-fill text-success fs-5 me-3 mt-1 flex-shrink-0"></i>
                                        <div>
                                            <h6 className="fw-bold mb-1">
                                                Mudah Digunakan
                                            </h6>
                                            <p className="text-secondary small mb-0">
                                                Interface intuitif yang dapat
                                                digunakan oleh semua level
                                                karyawan tanpa training khusus.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="benefit-item d-flex align-items-start mb-3">
                                        <i className="bi bi-check-circle-fill text-success fs-5 me-3 mt-1 flex-shrink-0"></i>
                                        <div>
                                            <h6 className="fw-bold mb-1">
                                                Data Terpusat & Aman
                                            </h6>
                                            <p className="text-secondary small mb-0">
                                                Semua data tersimpan aman di
                                                server terpusat dengan enkripsi
                                                dan backup otomatis.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="benefit-item d-flex align-items-start mb-3">
                                        <i className="bi bi-check-circle-fill text-success fs-5 me-3 mt-1 flex-shrink-0"></i>
                                        <div>
                                            <h6 className="fw-bold mb-1">
                                                Akses Multi-Platform
                                            </h6>
                                            <p className="text-secondary small mb-0">
                                                Akses dari desktop, tablet, atau
                                                smartphone. Bekerja dengan semua
                                                browser modern.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="benefit-item d-flex align-items-start mb-3">
                                        <i className="bi bi-check-circle-fill text-success fs-5 me-3 mt-1 flex-shrink-0"></i>
                                        <div>
                                            <h6 className="fw-bold mb-1">
                                                Laporan Komprehensif
                                            </h6>
                                            <p className="text-secondary small mb-0">
                                                Berbagai template laporan siap
                                                pakai untuk kebutuhan monitoring
                                                dan evaluasi.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="benefit-item d-flex align-items-start">
                                        <i className="bi bi-check-circle-fill text-success fs-5 me-3 mt-1 flex-shrink-0"></i>
                                        <div>
                                            <h6 className="fw-bold mb-1">
                                                Dukungan Teknis
                                            </h6>
                                            <p className="text-secondary small mb-0">
                                                Tim support siap membantu
                                                mengatasi kendala teknis yang
                                                Anda hadapi.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col lg={6} className="text-center">
                                {/* Simple geometric illustration */}
                                <svg
                                    width="100%"
                                    height="350"
                                    viewBox="0 0 500 350"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        cx="250"
                                        cy="175"
                                        r="130"
                                        fill="#0090FF"
                                        fillOpacity="0.08"
                                    />
                                    <circle
                                        cx="250"
                                        cy="175"
                                        r="90"
                                        fill="#0090FF"
                                        fillOpacity="0.12"
                                    />
                                    <circle
                                        cx="250"
                                        cy="175"
                                        r="50"
                                        fill="#0090FF"
                                        fillOpacity="0.18"
                                    />
                                    <rect
                                        x="210"
                                        y="135"
                                        width="80"
                                        height="80"
                                        rx="8"
                                        fill="#0090FF"
                                        fillOpacity="0.25"
                                    />
                                    <path
                                        d="M225 175 L240 190 L275 155"
                                        stroke="#0090FF"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* CTA Section */}
                <section className="cta-section bg-blue text-white py-5">
                    <Container>
                        <div className="text-center py-4">
                            <h2 className="fw-bold mb-3">
                                Siap Untuk Memulai?
                            </h2>
                            <p className="lead mb-4">
                                Bergabunglah dengan ratusan perusahaan yang
                                telah meningkatkan efisiensi manajemen kehadiran
                                mereka.
                            </p>
                            <div className="d-flex gap-3 justify-content-center flex-wrap">
                                <Link to="/login">
                                    <Button
                                        variant="light"
                                        size="lg"
                                        className="px-5 rounded-35"
                                    >
                                        Masuk Sekarang
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline-light"
                                    size="lg"
                                    className="px-5 rounded-35"
                                >
                                    Hubungi Kami
                                </Button>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* Footer */}
                <footer className="bg-dark text-white py-4">
                    <Container>
                        <Row>
                            <Col
                                md={6}
                                className="text-center text-md-start mb-2 mb-md-0"
                            >
                                <p className="mb-0">
                                    &copy; 2024 Logbook Presensi. Hak Cipta
                                    Dilindungi.
                                </p>
                            </Col>
                            <Col md={6} className="text-center text-md-end">
                                <a
                                    href="#"
                                    className="text-white text-decoration-none me-3"
                                >
                                    Tentang
                                </a>
                                <a
                                    href="#"
                                    className="text-white text-decoration-none me-3"
                                >
                                    Bantuan
                                </a>
                                <a
                                    href="#"
                                    className="text-white text-decoration-none"
                                >
                                    Kontak
                                </a>
                            </Col>
                        </Row>
                    </Container>
                </footer>
            </div>
        </>
    );
};

export default Home;
